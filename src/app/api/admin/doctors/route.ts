import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const doctors = await query(`
    SELECT d.*, u.email,
      (SELECT json_agg(a ORDER BY a.day_of_week, a.start_time)
       FROM doctor_availability a WHERE a.doctor_id = d.id) AS availability
    FROM doctors d
    LEFT JOIN users u ON u.id = d.user_id
    ORDER BY d.created_at DESC
  `)
  return NextResponse.json(doctors)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { user_id, name, qualification, specialisation, bio, consultation_fee, registration_no, state_medical_council, photo_url, signature_url, login_email, login_password } = body

  // Create user account for doctor if email + password provided
  let resolvedUserId = user_id || null
  if (login_email && login_password) {
    if (login_password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [login_email])
    if (existing) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    const hash = await bcrypt.hash(login_password, 10)
    const newUser = await queryOne<{ id: string }>(
      `INSERT INTO users (name, email, password_hash, is_doctor) VALUES ($1,$2,$3,true) RETURNING id`,
      [name, login_email, hash]
    )
    resolvedUserId = newUser!.id
  }

  const doctor = await queryOne<{ id: number }>(
    `INSERT INTO doctors (user_id, name, qualification, specialisation, bio, consultation_fee, registration_no, state_medical_council, photo_url, signature_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [resolvedUserId, name, qualification, specialisation, bio, consultation_fee ?? 299, registration_no, state_medical_council, photo_url || null, signature_url || null]
  )

  if (resolvedUserId && !login_email) {
    await query('UPDATE users SET is_doctor = true WHERE id = $1', [resolvedUserId])
  }

  return NextResponse.json(doctor)
}
