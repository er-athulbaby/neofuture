import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const doctor = await queryOne(`
    SELECT d.*, u.email,
      (SELECT json_agg(a ORDER BY a.day_of_week, a.start_time)
       FROM doctor_availability a WHERE a.doctor_id = d.id) AS availability
    FROM doctors d LEFT JOIN users u ON u.id = d.user_id WHERE d.id = $1
  `, [id])
  if (!doctor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(doctor)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const { name, qualification, specialisation, bio, consultation_fee, registration_no, state_medical_council, photo_url, signature_url, is_active } = body

  const doctor = await queryOne(
    `UPDATE doctors SET name=$1, qualification=$2, specialisation=$3, bio=$4, consultation_fee=$5,
     registration_no=$6, state_medical_council=$7, photo_url=$8, signature_url=$9, is_active=$10
     WHERE id=$11 RETURNING *`,
    [name, qualification, specialisation, bio, consultation_fee, registration_no, state_medical_council, photo_url, signature_url, is_active ?? true, id]
  )
  return NextResponse.json(doctor)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await query('UPDATE doctors SET is_active = false WHERE id = $1', [id])
  return NextResponse.json({ success: true })
}
