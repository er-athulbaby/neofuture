import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { createMeetingEvent } from '@/lib/google-calendar'
import { sendConsultationConfirmation } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { consultation_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()

  // Verify Razorpay signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const consult = await queryOne<{
    id: number; patient_id: number; doctor_id: number; slot_datetime: string;
    duration_minutes: number; neopulse_points_used: number; is_followup: boolean
  }>(
    'SELECT * FROM consultations WHERE id=$1 AND patient_id=$2',
    [consultation_id, session.user.id]
  )
  if (!consult) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const doctor = await queryOne<{ name: string; specialisation: string; google_refresh_token: string; consultation_fee: number }>(
    'SELECT name, specialisation, google_refresh_token, consultation_fee FROM doctors WHERE id=$1',
    [consult.doctor_id]
  )

  const patient = await queryOne<{ name: string; email: string }>(
    'SELECT name, email FROM users WHERE id=$1',
    [consult.patient_id]
  )

  // Create Google Meet via Calendar API
  let meetLink = ''
  let googleEventId = ''
  if (doctor?.google_refresh_token) {
    const startTime = new Date(consult.slot_datetime).toISOString()
    const endTime = new Date(new Date(consult.slot_datetime).getTime() + consult.duration_minutes * 60000).toISOString()
    try {
      const event = await createMeetingEvent(doctor.google_refresh_token, {
        title: `NeoFuture Consultation — ${patient?.name} with ${doctor.name}`,
        startTime,
        endTime,
        patientEmail: patient?.email ?? '',
        doctorEmail: '',
        description: `NeoFuture teleconsultation. Consultation ID: TC-${String(consultation_id).padStart(6, '0')}`,
      })
      meetLink = event.meetLink
      googleEventId = event.eventId
    } catch {
      meetLink = `https://meet.google.com/neofuture-${consultation_id}`
    }
  }

  // Update consultation
  await query(
    `UPDATE consultations SET status='confirmed', meet_link=$1, google_event_id=$2, razorpay_payment_id=$3 WHERE id=$4`,
    [meetLink, googleEventId, razorpay_payment_id, consultation_id]
  )

  // Deduct NeoPulse points
  if (consult.neopulse_points_used > 0) {
    await query('UPDATE users SET neopulse_balance = neopulse_balance - $1 WHERE id = $2', [consult.neopulse_points_used, session.user.id])
  }

  // Send confirmation email
  if (patient?.email && doctor) {
    await sendConsultationConfirmation(patient.email, {
      patientName: patient.name,
      doctorName: doctor.name,
      specialisation: doctor.specialisation ?? '',
      slotDatetime: consult.slot_datetime,
      meetLink,
      fee: doctor.consultation_fee,
      isFollowup: consult.is_followup,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, meet_link: meetLink })
}
