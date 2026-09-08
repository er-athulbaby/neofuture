import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function ensureTable() {
  await query(`CREATE TABLE IF NOT EXISTS doctor_prescription_options (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctor_id, field_type, value)
  )`, [])
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doctor = await queryOne<{ id: number }>('SELECT id FROM doctors WHERE user_id = $1', [session.user.id])
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  await ensureTable()

  const rows = await query<{ id: number; field_type: string; value: string }>(
    'SELECT id, field_type, value FROM doctor_prescription_options WHERE doctor_id=$1 ORDER BY field_type, value',
    [doctor.id]
  )

  // Group by field_type
  const grouped: Record<string, { id: number; value: string }[]> = {}
  for (const row of rows) {
    if (!grouped[row.field_type]) grouped[row.field_type] = []
    grouped[row.field_type].push({ id: row.id, value: row.value })
  }
  return NextResponse.json(grouped)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doctor = await queryOne<{ id: number }>('SELECT id FROM doctors WHERE user_id = $1', [session.user.id])
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  await ensureTable()

  const { field_type, value } = await req.json()
  if (!field_type || !value?.trim()) return NextResponse.json({ error: 'field_type and value required' }, { status: 400 })

  const VALID_FIELDS = ['medicine', 'strength', 'dosage_route', 'frequency', 'duration', 'quantity']
  if (!VALID_FIELDS.includes(field_type)) return NextResponse.json({ error: 'Invalid field_type' }, { status: 400 })

  const row = await queryOne<{ id: number }>(
    'INSERT INTO doctor_prescription_options (doctor_id, field_type, value) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id',
    [doctor.id, field_type, value.trim()]
  )
  return NextResponse.json({ success: true, id: row?.id })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doctor = await queryOne<{ id: number }>('SELECT id FROM doctors WHERE user_id = $1', [session.user.id])
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const { id } = await req.json()
  await query('DELETE FROM doctor_prescription_options WHERE id=$1 AND doctor_id=$2', [id, doctor.id])
  return NextResponse.json({ success: true })
}
