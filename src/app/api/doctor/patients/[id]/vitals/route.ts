import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

interface Props { params: Promise<{ id: string }> }

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS doctor_patient_vitals (
      id SERIAL PRIMARY KEY,
      doctor_id INTEGER NOT NULL,
      patient_id TEXT NOT NULL,
      dob DATE,
      weight_kg NUMERIC(5,1),
      height_cm NUMERIC(5,1),
      blood_pressure VARCHAR(20),
      pulse_bpm INTEGER,
      mobile VARCHAR(20),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(doctor_id, patient_id)
    )
  `, [])
  // Add mobile column if upgrading from old schema
  await query(`ALTER TABLE doctor_patient_vitals ADD COLUMN IF NOT EXISTS mobile VARCHAR(20)`, []).catch(() => {})
}

export async function GET(_req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: patientId } = await params
  const doctor = await queryOne<{ id: number }>(
    'SELECT id FROM doctors WHERE user_id=$1', [session.user.id]
  )
  if (!doctor) return NextResponse.json({}, { status: 200 })

  await ensureTable()

  const vitals = await queryOne(
    'SELECT dob, weight_kg, height_cm, blood_pressure, pulse_bpm, mobile, updated_at FROM doctor_patient_vitals WHERE doctor_id=$1 AND patient_id=$2',
    [doctor.id, patientId]
  ).catch(() => null)

  return NextResponse.json(vitals ?? {})
}

export async function PUT(req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: patientId } = await params

  const doctor = await queryOne<{ id: number }>(
    'SELECT id FROM doctors WHERE user_id = $1', [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const { dob, weight_kg, height_cm, blood_pressure, pulse_bpm, mobile } = await req.json()

  await ensureTable()

  await query(`
    INSERT INTO doctor_patient_vitals (doctor_id, patient_id, dob, weight_kg, height_cm, blood_pressure, pulse_bpm, mobile, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
    ON CONFLICT (doctor_id, patient_id) DO UPDATE SET
      dob = EXCLUDED.dob,
      weight_kg = EXCLUDED.weight_kg,
      height_cm = EXCLUDED.height_cm,
      blood_pressure = EXCLUDED.blood_pressure,
      pulse_bpm = EXCLUDED.pulse_bpm,
      mobile = EXCLUDED.mobile,
      updated_at = NOW()
  `, [doctor.id, patientId, dob || null, weight_kg || null, height_cm || null, blood_pressure || null, pulse_bpm || null, mobile || null])

  return NextResponse.json({ ok: true })
}
