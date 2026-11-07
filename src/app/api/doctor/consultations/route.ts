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

  // Ensure table + column exist before the enriched query runs
  await query(`
    CREATE TABLE IF NOT EXISTS doctor_patient_vitals (
      id SERIAL PRIMARY KEY, doctor_id INTEGER NOT NULL, patient_id TEXT NOT NULL,
      dob DATE, weight_kg NUMERIC(5,1), height_cm NUMERIC(5,1),
      blood_pressure VARCHAR(20), pulse_bpm INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(doctor_id, patient_id)
    )
  `, []).catch(() => {})
  await query(`ALTER TABLE doctor_patient_vitals ADD COLUMN IF NOT EXISTS patient_name TEXT`, []).catch(() => {})

  const plainSql = `
    SELECT c.*,
      u.id::text AS patient_id, u.name AS patient_name, u.email AS patient_email,
      r.id AS report_id, r.pdf_url AS report_pdf_url
    FROM consultations c
    JOIN users u ON u.id = c.patient_id
    LEFT JOIN consultation_reports r ON r.consultation_id = c.id
    WHERE c.doctor_id = $1 AND c.status IN ('confirmed','completed')
    ORDER BY c.slot_datetime ASC`

  // Try to enrich with saved patient name; fall back to plain query on any error
  let rows
  try {
    rows = await query(`
      SELECT c.*,
        u.id::text AS patient_id,
        COALESCE(
          (SELECT dpv.patient_name FROM doctor_patient_vitals dpv
           WHERE dpv.doctor_id = $1 AND dpv.patient_id = u.id::text LIMIT 1),
          u.name
        ) AS patient_name,
        u.email AS patient_email,
        r.id AS report_id, r.pdf_url AS report_pdf_url
      FROM consultations c
      JOIN users u ON u.id = c.patient_id
      LEFT JOIN consultation_reports r ON r.consultation_id = c.id
      WHERE c.doctor_id = $1 AND c.status IN ('confirmed','completed')
      ORDER BY c.slot_datetime ASC
    `, [doctor.id])
  } catch {
    rows = await query(plainSql, [doctor.id]).catch(() => [])
  }

  return NextResponse.json(rows)
}
