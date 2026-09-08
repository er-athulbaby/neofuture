import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doctor = await queryOne<{ id: number }>(
    'SELECT id FROM doctors WHERE user_id = $1', [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const rows = await query(`
    SELECT
      u.id, u.name, u.email,
      COUNT(c.id)::int AS consultation_count,
      MAX(c.slot_datetime) AS last_consultation,
      dpv.dob, dpv.weight_kg, dpv.height_cm, dpv.blood_pressure, dpv.pulse_bpm
    FROM consultations c
    JOIN users u ON u.id = c.patient_id
    LEFT JOIN doctor_patient_vitals dpv ON dpv.patient_id = u.id AND dpv.doctor_id = $1
    WHERE c.doctor_id = $1 AND c.status IN ('confirmed','completed')
    GROUP BY u.id, u.name, u.email, dpv.dob, dpv.weight_kg, dpv.height_cm, dpv.blood_pressure, dpv.pulse_bpm
    ORDER BY MAX(c.slot_datetime) DESC
  `, [doctor.id])

  return NextResponse.json(rows)
}
