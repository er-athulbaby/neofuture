import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS doctor_text_templates (
      id SERIAL PRIMARY KEY,
      doctor_id INTEGER NOT NULL,
      field_type VARCHAR(50) NOT NULL,
      value TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(doctor_id, field_type, value)
    )
  `, []).catch(() => {})
}

async function getDoctor(userId: string) {
  return queryOne<{ id: number }>('SELECT id FROM doctors WHERE user_id=$1', [userId])
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json([], { status: 200 })

  const doctor = await getDoctor(session.user.id)
  if (!doctor) return NextResponse.json([], { status: 200 })

  await ensureTable()

  const fieldType = req.nextUrl.searchParams.get('field_type')
  const rows = fieldType
    ? await query(`SELECT id, field_type, value FROM doctor_text_templates WHERE doctor_id=$1 AND field_type=$2 ORDER BY created_at DESC`, [doctor.id, fieldType])
    : await query(`SELECT id, field_type, value FROM doctor_text_templates WHERE doctor_id=$1 ORDER BY field_type, created_at DESC`, [doctor.id])

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { field_type, value } = await req.json()
  if (!field_type || !value?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const doctor = await getDoctor(session.user.id)
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  await ensureTable()

  const row = await queryOne<{ id: number }>(
    `INSERT INTO doctor_text_templates (doctor_id, field_type, value)
     VALUES ($1,$2,$3)
     ON CONFLICT (doctor_id, field_type, value) DO UPDATE SET value=EXCLUDED.value
     RETURNING id`,
    [doctor.id, field_type, value.trim()]
  )
  return NextResponse.json({ id: row?.id })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  const doctor = await getDoctor(session.user.id)
  if (!doctor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await query('DELETE FROM doctor_text_templates WHERE id=$1 AND doctor_id=$2', [id, doctor.id])
  return NextResponse.json({ ok: true })
}
