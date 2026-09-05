import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const rows = await query('SELECT * FROM doctor_availability WHERE doctor_id = $1 ORDER BY day_of_week, start_time', [id])
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { day_of_week, start_time, end_time, slot_duration } = await req.json()

  const row = await queryOne(
    `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, day_of_week, start_time, end_time, slot_duration ?? 30]
  )
  return NextResponse.json(row)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await params
  const { availability_id } = await req.json()
  await query('DELETE FROM doctor_availability WHERE id = $1', [availability_id])
  return NextResponse.json({ success: true })
}
