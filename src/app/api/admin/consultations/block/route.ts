import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function guard() {
  const session = await auth()
  if (!session?.user?.is_admin && !session?.user?.is_doctor) return null
  return session
}

export async function GET(req: NextRequest) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const doctor_id = req.nextUrl.searchParams.get('doctor_id')
  const date = req.nextUrl.searchParams.get('date')
  if (!doctor_id || !date) return NextResponse.json({ rows: [] })
  const rows = await query(
    `SELECT id, slot_datetime, block_note FROM consultations
     WHERE doctor_id=$1 AND DATE(slot_datetime AT TIME ZONE 'Asia/Kolkata')=$2 AND status='blocked'
     ORDER BY slot_datetime`,
    [doctor_id, date]
  )
  return NextResponse.json({ rows })
}

export async function POST(req: NextRequest) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { doctor_id, slot_datetime, note } = await req.json()
  if (!doctor_id || !slot_datetime) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Check no real booking exists for this slot
  const clash = await queryOne(
    `SELECT id FROM consultations WHERE doctor_id=$1 AND slot_datetime=$2 AND status IN ('pending','confirmed','blocked')`,
    [doctor_id, slot_datetime]
  )
  if (clash) return NextResponse.json({ error: 'Slot already taken' }, { status: 409 })

  // Ensure block_note column exists; safe to ignore if already present or unsupported
  await query(`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS block_note TEXT`, []).catch(() => {})

  // Check again whether column exists after migration attempt
  const hasBlockNote = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name='consultations' AND column_name='block_note'
     ) AS exists`
  )

  try {
    if (hasBlockNote?.exists) {
      await query(
        `INSERT INTO consultations (patient_id, doctor_id, slot_datetime, status, is_followup, lab_reports, teleconsult_consent, block_note)
         VALUES ($1, $2, $3, 'blocked', false, '[]', false, $4)`,
        [session.user.id, doctor_id, slot_datetime, note ?? 'Blocked by admin']
      )
    } else {
      await query(
        `INSERT INTO consultations (patient_id, doctor_id, slot_datetime, status, is_followup, lab_reports, teleconsult_consent)
         VALUES ($1, $2, $3, 'blocked', false, '[]', false)`,
        [session.user.id, doctor_id, slot_datetime]
      )
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  await query(`DELETE FROM consultations WHERE id=$1 AND status='blocked'`, [Number(id)])
  return NextResponse.json({ ok: true })
}
