import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const doctor = await queryOne<{ id: number }>(
    'SELECT id FROM doctors WHERE user_id = $1',
    [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })

  // Ensure vitals table and all columns exist so the LEFT JOIN never throws
  await query(`
    CREATE TABLE IF NOT EXISTS doctor_patient_vitals (
      id SERIAL PRIMARY KEY, doctor_id INTEGER NOT NULL, patient_id TEXT NOT NULL,
      dob DATE, weight_kg NUMERIC(5,1), height_cm NUMERIC(5,1),
      blood_pressure VARCHAR(20), pulse_bpm INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(doctor_id, patient_id)
    )
  `, []).catch(() => {})
  await Promise.all([
    query(`ALTER TABLE doctor_patient_vitals ADD COLUMN IF NOT EXISTS patient_name TEXT`, []).catch(() => {}),
    query(`ALTER TABLE doctor_patient_vitals ADD COLUMN IF NOT EXISTS age INTEGER`, []).catch(() => {}),
    query(`ALTER TABLE doctor_patient_vitals ADD COLUMN IF NOT EXISTS gender VARCHAR(10)`, []).catch(() => {}),
    query(`ALTER TABLE doctor_patient_vitals ADD COLUMN IF NOT EXISTS mobile VARCHAR(20)`, []).catch(() => {}),
  ])

  const rows = await query(`
    SELECT c.*,
      u.id::text AS patient_id,
      COALESCE(v.patient_name, u.name) AS patient_name,
      u.email AS patient_email,
      r.id AS report_id, r.pdf_url AS report_pdf_url
    FROM consultations c
    JOIN users u ON u.id = c.patient_id
    LEFT JOIN consultation_reports r ON r.consultation_id = c.id
    LEFT JOIN doctor_patient_vitals v ON v.doctor_id = $1 AND v.patient_id = u.id::text
    WHERE c.doctor_id = $1 AND c.status IN ('confirmed','completed')
    ORDER BY c.slot_datetime ASC
  `, [doctor.id])

  return NextResponse.json(rows)
}
