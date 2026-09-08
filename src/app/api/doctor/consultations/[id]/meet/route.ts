import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { createMeetingEvent } from '@/lib/google-calendar'

interface Props { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const doctor = await queryOne<{ id: number; name: string; google_refresh_token: string | null }>(
    'SELECT id, name, google_refresh_token FROM doctors WHERE user_id = $1',
    [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
  if (!doctor.google_refresh_token) return NextResponse.json({ error: 'Connect Google Calendar first from your dashboard.' }, { status: 400 })

  const consult = await queryOne<{ id: number; slot_datetime: string; duration_minutes: number; patient_id: string }>(
    'SELECT id, slot_datetime, duration_minutes, patient_id FROM consultations WHERE id=$1 AND doctor_id=$2',
    [id, doctor.id]
  )
  if (!consult) return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })

  const patient = await queryOne<{ name: string; email: string }>(
    'SELECT name, email FROM users WHERE id=$1', [consult.patient_id]
  )

  try {
    const event = await createMeetingEvent(doctor.google_refresh_token, {
      title: `NeoFuture Consultation — ${patient?.name} with ${doctor.name}`,
      startTime: new Date(consult.slot_datetime).toISOString(),
      endTime: new Date(new Date(consult.slot_datetime).getTime() + (consult.duration_minutes || 30) * 60000).toISOString(),
      patientEmail: patient?.email ?? '',
      doctorEmail: '',
      description: `NeoFuture teleconsultation. Consultation ID: TC-${String(consult.id).padStart(6, '0')}`,
    })
    await query('UPDATE consultations SET meet_link=$1, google_event_id=$2 WHERE id=$3', [event.meetLink, event.eventId, consult.id])
    return NextResponse.json({ meet_link: event.meetLink })
  } catch (err) {
    console.error('[meet] Google Meet creation failed:', err)
    return NextResponse.json({ error: 'Failed to create Google Meet. Check your Google Calendar connection.' }, { status: 500 })
  }
}
