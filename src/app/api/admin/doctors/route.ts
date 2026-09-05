import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

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
  const { user_id, name, qualification, specialisation, bio, consultation_fee, registration_no, state_medical_council, photo_url, signature_url } = body

  const doctor = await queryOne<{ id: number }>(
    `INSERT INTO doctors (user_id, name, qualification, specialisation, bio, consultation_fee, registration_no, state_medical_council, photo_url, signature_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [user_id ?? null, name, qualification, specialisation, bio, consultation_fee ?? 299, registration_no, state_medical_council, photo_url ?? null, signature_url ?? null]
  )

  if (user_id) {
    await query('UPDATE users SET is_doctor = true WHERE id = $1', [user_id])
  }

  return NextResponse.json(doctor)
}
