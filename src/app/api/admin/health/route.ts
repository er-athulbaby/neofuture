import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_health_profiles (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      height_cm NUMERIC(5,1),
      weight_kg NUMERIC(5,1),
      date_of_birth DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []).catch(() => {})
  // Migrate user_id from INTEGER to TEXT if the old schema is present
  await query(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_health_profiles'
          AND column_name = 'user_id'
          AND data_type = 'integer'
      ) THEN
        ALTER TABLE user_health_profiles ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      END IF;
    END $$
  `, []).catch(() => {})
  await query(`ALTER TABLE user_health_profiles ADD COLUMN IF NOT EXISTS last_period_date DATE`, []).catch(() => {})
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS health_data_consent BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {})
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS health_data_consent_at TIMESTAMPTZ`, []).catch(() => {})
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {})
  await query(`CREATE TABLE IF NOT EXISTS wellness_checkins (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sleep_score INTEGER NOT NULL,
    energy_score INTEGER NOT NULL,
    stress_level INTEGER NOT NULL,
    wellness_score NUMERIC(4,1) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, check_in_date)
  )`, []).catch(() => {})
  await query(`ALTER TABLE wellness_checkins ADD COLUMN IF NOT EXISTS hydration_score INTEGER`, []).catch(() => {})
  await query(`ALTER TABLE wellness_checkins ADD COLUMN IF NOT EXISTS mood_score INTEGER`, []).catch(() => {})
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureTables()

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')

  if (userId) {
    // Detail view: wellness history for a specific user
    const checkins = await query<{
      check_in_date: string
      sleep_score: number
      energy_score: number
      stress_level: number
      hydration_score: number | null
      mood_score: number | null
      wellness_score: number
    }>(
      `SELECT check_in_date, sleep_score, energy_score, stress_level,
              hydration_score, mood_score, wellness_score
       FROM wellness_checkins WHERE user_id = $1
       ORDER BY check_in_date DESC LIMIT 90`,
      [userId]
    ).catch(() => [])

    const profile = await query<{
      height_cm: number | null
      weight_kg: number | null
      date_of_birth: string | null
      last_period_date: string | null
      updated_at: string
    }>(
      `SELECT height_cm, weight_kg, date_of_birth, last_period_date, updated_at
       FROM user_health_profiles WHERE user_id = $1
       ORDER BY id DESC LIMIT 1`,
      [String(userId)]
    ).catch(() => [])

    return NextResponse.json({ checkins, profile: profile[0] ?? null })
  }

  // List view: ALL users (admins included so admin can see their own data)
  const users = await query<{
    id: string
    name: string
    email: string
    is_admin: boolean
    health_data_consent: boolean
    health_data_consent_at: string | null
    onboarding_done: boolean
    height_cm: number | null
    weight_kg: number | null
    date_of_birth: string | null
    checkin_count: string
    last_checkin: string | null
    avg_wellness: string | null
  }>(
    `SELECT
       u.id, u.name, u.email,
       COALESCE(u.is_admin, false) as is_admin,
       COALESCE(u.health_data_consent, false) as health_data_consent,
       u.health_data_consent_at,
       COALESCE(u.onboarding_done, false) as onboarding_done,
       hp.height_cm, hp.weight_kg, hp.date_of_birth,
       COALESCE(wc.checkin_count, '0') as checkin_count,
       wc.last_checkin,
       wc.avg_wellness
     FROM users u
     LEFT JOIN LATERAL (
       SELECT height_cm, weight_kg, date_of_birth
       FROM user_health_profiles WHERE user_id = u.id::text
       ORDER BY id DESC LIMIT 1
     ) hp ON true
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*)::text as checkin_count,
         MAX(check_in_date)::text as last_checkin,
         ROUND(AVG(wellness_score::numeric), 1)::text as avg_wellness
       FROM wellness_checkins WHERE user_id = u.id::text
     ) wc ON true
     ORDER BY wc.checkin_count DESC NULLS LAST, u.created_at DESC`,
    []
  ).catch(() => [])

  return NextResponse.json({ users })
}
