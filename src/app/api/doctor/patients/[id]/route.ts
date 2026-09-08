import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: patientId } = await params

  const doctor = await queryOne<{ id: number }>(
    'SELECT id FROM doctors WHERE user_id = $1', [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  // Confirm this patient has consulted with this doctor
  const hasAccess = await queryOne(
    `SELECT 1 FROM consultations WHERE doctor_id=$1 AND patient_id::text=$2::text AND status IN ('confirmed','completed') LIMIT 1`,
    [doctor.id, patientId]
  )
  if (!hasAccess) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

  const [patient, vitals, consultations] = await Promise.all([
    queryOne<{ id: string; name: string; email: string; phone: string | null }>(
      'SELECT id::text, name, email, phone FROM users WHERE id::text = $1', [patientId]
    ),
    queryOne<{
      dob: string | null; weight_kg: number | null; height_cm: number | null
      blood_pressure: string | null; pulse_bpm: number | null; updated_at: string | null
    }>(
      'SELECT dob, weight_kg, height_cm, blood_pressure, pulse_bpm, updated_at FROM doctor_patient_vitals WHERE doctor_id=$1 AND patient_id=$2',
      [doctor.id, patientId]
    ).catch(() => null),
    query(`
      SELECT c.id, c.slot_datetime, c.status, c.is_followup, c.lab_reports, c.meet_link,
        cr.id AS report_id, cr.diagnosis, cr.notes, cr.prescription, cr.additional_instructions, cr.created_at AS report_date
      FROM consultations c
      LEFT JOIN consultation_reports cr ON cr.consultation_id = c.id
      WHERE c.doctor_id=$1 AND c.patient_id::text=$2::text AND c.status IN ('confirmed','completed')
      ORDER BY c.slot_datetime DESC
    `, [doctor.id, patientId]),
  ])

  return NextResponse.json({ patient, vitals: vitals ?? null, consultations })
}
