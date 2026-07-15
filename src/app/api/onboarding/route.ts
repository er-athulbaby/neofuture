import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_health_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      height_cm NUMERIC(5,1),
      weight_kg NUMERIC(5,1),
      date_of_birth DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []).catch(() => {})
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {})
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS health_data_consent BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {})
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS health_data_consent_at TIMESTAMPTZ`, []).catch(() => {})
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureTables()
  const userId = Number(session.user.id)

  const user = await queryOne<{ onboarding_done: boolean; health_data_consent: boolean }>(
    `SELECT onboarding_done, health_data_consent FROM users WHERE id = $1`,
    [userId]
  ).catch(() => null)

  const profile = await queryOne<{ height_cm: number | null; weight_kg: number | null; date_of_birth: string | null }>(
    `SELECT height_cm, weight_kg, date_of_birth FROM user_health_profiles WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
    [userId]
  ).catch(() => null)

  return NextResponse.json({
    onboarding_done: user?.onboarding_done ?? false,
    health_data_consent: user?.health_data_consent ?? false,
    profile: profile ?? null,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureTables()
  const userId = Number(session.user.id)
  const { height_cm, weight_kg, date_of_birth, skip } = await req.json()

  if (!skip) {
    // Upsert health profile
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM user_health_profiles WHERE user_id = $1`,
      [userId]
    ).catch(() => null)

    if (existing) {
      await query(
        `UPDATE user_health_profiles SET height_cm = $2, weight_kg = $3, date_of_birth = $4, updated_at = NOW() WHERE user_id = $1`,
        [userId, height_cm ?? null, weight_kg ?? null, date_of_birth ?? null]
      )
    } else {
      await query(
        `INSERT INTO user_health_profiles (user_id, height_cm, weight_kg, date_of_birth) VALUES ($1, $2, $3, $4)`,
        [userId, height_cm ?? null, weight_kg ?? null, date_of_birth ?? null]
      )
    }
  }

  await query(`UPDATE users SET onboarding_done = true WHERE id = $1`, [userId])

  return NextResponse.json({ success: true })
}
