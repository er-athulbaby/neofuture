import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT 'Home',
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `, [])
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTables()
  const addresses = await query(
    'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
    [String(session.user.id)]
  )
  return NextResponse.json({ addresses })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTables()

  const { label, name, phone, address_line1, address_line2, city, state, pincode, is_default } = await req.json()
  if (!name || !phone || !address_line1 || !city || !state || !pincode) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  const userId = String(session.user.id)

  if (is_default) {
    await query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId])
  }

  const row = await queryOne<{ id: number }>(
    `INSERT INTO user_addresses (user_id, label, name, phone, address_line1, address_line2, city, state, pincode, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [userId, label || 'Home', name, phone, address_line1, address_line2 || null, city, state, pincode, !!is_default]
  )
  return NextResponse.json({ id: row?.id, success: true })
}
