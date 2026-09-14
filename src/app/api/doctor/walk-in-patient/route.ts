import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const doctor = await queryOne<{ id: number }>(
    'SELECT id FROM doctors WHERE user_id=$1', [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const { name, phone, email, gender, dob } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // Use provided email or generate a placeholder
  const userEmail = email?.trim() || `walkin-${Date.now()}@neofuture.internal`

  // Check if email already exists
  const existing = await queryOne<{ id: string }>(
    'SELECT id::text FROM users WHERE email=$1', [userEmail]
  ).catch(() => null)

  let patientId: string
  if (existing) {
    patientId = existing.id
  } else {
    const newUser = await queryOne<{ id: string }>(
      `INSERT INTO users (name, email, phone, gender, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING id::text`,
      [name.trim(), userEmail, phone?.trim() || null, gender || null]
    )
    if (!newUser) return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
    patientId = newUser.id
  }

  // Save vitals (DOB, gender) under this doctor
  if (dob || gender) {
    await query(`
      INSERT INTO doctor_patient_vitals (doctor_id, patient_id, dob, gender, mobile, updated_at)
      VALUES ($1,$2,$3,$4,$5,NOW())
      ON CONFLICT (doctor_id, patient_id) DO UPDATE SET
        dob = COALESCE(EXCLUDED.dob, doctor_patient_vitals.dob),
        gender = COALESCE(EXCLUDED.gender, doctor_patient_vitals.gender),
        mobile = COALESCE(EXCLUDED.mobile, doctor_patient_vitals.mobile),
        updated_at = NOW()
    `, [doctor.id, patientId, dob || null, gender || null, phone?.trim() || null]).catch(() => {})
  }

  return NextResponse.json({ id: patientId, name: name.trim(), email: userEmail })
}
