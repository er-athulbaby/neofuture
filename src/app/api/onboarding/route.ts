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
      last_period_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []).catch(() => {})
  await query(`ALTER TABLE user_health_profiles ADD COLUMN IF NOT EXISTS last_period_date DATE`, []).catch(() => {})
  await query(`ALTER TABLE user_health_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`, []).catch(() => {})
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

  const profile = await queryOne<{ height_cm: number | null; weight_kg: number | null; date_of_birth: string | null; last_period_date: string | null }>(
    `SELECT height_cm, weight_kg, date_of_birth, last_period_date FROM user_health_profiles WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
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

  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { height_cm, weight_kg, date_of_birth, last_period_date, skip } = body

    if (!skip) {
      // Delete any existing rows and insert fresh — simplest reliable approach
      await query(`DELETE FROM user_health_profiles WHERE user_id = $1`, [userId])
      await query(
        `INSERT INTO user_health_profiles (user_id, height_cm, weight_kg, date_of_birth, last_period_date)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          height_cm != null ? Number(height_cm) : null,
          weight_kg != null ? Number(weight_kg) : null,
          date_of_birth || null,
          last_period_date || null,
        ]
      )
    }

    await query(`UPDATE users SET onboarding_done = true WHERE id = $1`, [userId])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding save error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
