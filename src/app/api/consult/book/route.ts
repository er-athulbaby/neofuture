import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import Razorpay from 'razorpay'
import { createMeetingEvent } from '@/lib/google-calendar'

async function buildMeetLink(doctorId: number, consultId: number, slotDatetime: string, patientId: string): Promise<string> {
  try {
    const [doc, patient] = await Promise.all([
      queryOne<{ name: string; google_refresh_token: string | null }>('SELECT name, google_refresh_token FROM doctors WHERE id=$1', [doctorId]),
      queryOne<{ name: string; email: string }>('SELECT name, email FROM users WHERE id=$1', [patientId]),
    ])
    if (!doc?.google_refresh_token) return ''
    const event = await createMeetingEvent(doc.google_refresh_token, {
      title: `NeoFuture Consultation — ${patient?.name} with ${doc.name}`,
      startTime: new Date(slotDatetime).toISOString(),
      endTime: new Date(new Date(slotDatetime).getTime() + 30 * 60000).toISOString(),
      patientEmail: patient?.email ?? '',
      doctorEmail: '',
      description: `NeoFuture teleconsultation. Consultation ID: TC-${String(consultId).padStart(6, '0')}`,
    })
    return event.meetLink
  } catch { return '' }
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { doctor_id, slot_datetime, use_neopulse, lab_reports, teleconsult_consent } = await req.json()
  if (!teleconsult_consent) return NextResponse.json({ error: 'Teleconsultation consent is required' }, { status: 400 })

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
    const consult = await queryOne<{ id: number }>(
      `INSERT INTO consultations (patient_id, doctor_id, slot_datetime, status, is_followup, parent_consultation_id, lab_reports, teleconsult_consent)
       VALUES ($1,$2,$3,'confirmed',true,$4,$5,$6) RETURNING id`,
      [session.user.id, doctor_id, slot_datetime, freeFollowup.id, JSON.stringify(lab_reports ?? []), true]
    )
    const meetLink = await buildMeetLink(doctor_id, consult!.id, slot_datetime, session.user.id)
    if (meetLink) await query('UPDATE consultations SET meet_link=$1 WHERE id=$2', [meetLink, consult!.id])
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
    `INSERT INTO consultations (patient_id, doctor_id, slot_datetime, neopulse_redeemed, neopulse_points_used, status, lab_reports, teleconsult_consent)
     VALUES ($1,$2,$3,$4,$5,'pending',$6,$7) RETURNING id`,
    [session.user.id, doctor_id, slot_datetime, neopulseRedeemed, neopulsePointsUsed, JSON.stringify(lab_reports ?? []), true]
  )

  let order
  try {
    order = await razorpay.orders.create({
      amount: fee * 100,
      currency: 'INR',
      receipt: `consult_${consult!.id}`,
    })
  } catch (err) {
    await query(`DELETE FROM consultations WHERE id=$1`, [consult!.id])
    console.error('[book] Razorpay order creation failed:', err)
    return NextResponse.json({ error: 'Payment gateway unavailable. Please try again.' }, { status: 500 })
  }

  await query('UPDATE consultations SET razorpay_order_id=$1 WHERE id=$2', [order.id, consult!.id])

  return NextResponse.json({
    consultation_id: consult!.id,
    razorpay_order_id: order.id,
    amount: fee,
    neopulse_redeemed: neopulseRedeemed,
    is_free: false,
  })
}
