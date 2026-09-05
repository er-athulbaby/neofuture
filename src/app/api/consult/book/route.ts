import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { doctor_id, slot_datetime, use_neopulse } = await req.json()

  const doctor = await queryOne<{ id: number; name: string; consultation_fee: number }>(
    'SELECT id, name, consultation_fee FROM doctors WHERE id = $1 AND is_active = true',
    [doctor_id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  // Check slot is not already taken
  const clash = await queryOne(
    `SELECT id FROM consultations WHERE doctor_id=$1 AND slot_datetime=$2 AND status IN ('pending','confirmed')`,
    [doctor_id, slot_datetime]
  )
  if (clash) return NextResponse.json({ error: 'Slot already booked' }, { status: 409 })

  // Check active free followup
  const freeFollowup = await queryOne<{ id: number; followup_expires_at: string }>(
    `SELECT id, followup_expires_at FROM consultations
     WHERE patient_id=$1 AND doctor_id=$2 AND followup_expires_at > NOW() AND status='completed'
     ORDER BY followup_expires_at DESC LIMIT 1`,
    [session.user.id, doctor_id]
  )

  if (freeFollowup) {
    // Create free follow-up directly
    const consult = await queryOne<{ id: number }>(
      `INSERT INTO consultations (patient_id, doctor_id, slot_datetime, status, is_followup, parent_consultation_id)
       VALUES ($1,$2,$3,'confirmed',true,$4) RETURNING id`,
      [session.user.id, doctor_id, slot_datetime, freeFollowup.id]
    )
    return NextResponse.json({ consultation_id: consult!.id, is_free: true, amount: 0 })
  }

  // Paid booking
  let fee = doctor.consultation_fee
  let neopulseRedeemed = 0
  let neopulsePointsUsed = 0

  if (use_neopulse) {
    const user = await queryOne<{ neopulse_balance: number }>(
      'SELECT neopulse_balance FROM users WHERE id = $1',
      [session.user.id]
    )
    if (user && user.neopulse_balance > 0) {
      neopulseRedeemed = Math.min(99, fee - 1, user.neopulse_balance)
      neopulsePointsUsed = neopulseRedeemed
      fee -= neopulseRedeemed
    }
  }

  const consult = await queryOne<{ id: number }>(
    `INSERT INTO consultations (patient_id, doctor_id, slot_datetime, neopulse_redeemed, neopulse_points_used, status)
     VALUES ($1,$2,$3,$4,$5,'pending') RETURNING id`,
    [session.user.id, doctor_id, slot_datetime, neopulseRedeemed, neopulsePointsUsed]
  )

  const order = await razorpay.orders.create({
    amount: fee * 100,
    currency: 'INR',
    receipt: `consult_${consult!.id}`,
  })

  await query('UPDATE consultations SET razorpay_order_id=$1 WHERE id=$2', [order.id, consult!.id])

  return NextResponse.json({
    consultation_id: consult!.id,
    razorpay_order_id: order.id,
    amount: fee,
    neopulse_redeemed: neopulseRedeemed,
    is_free: false,
  })
}
