import { query, queryOne } from './db'

export type EarnAction =
  | 'daily_checkin'
  | 'referral'
  | 'first_purchase'
  | 'product_review'
  | 'profile_complete'
  | 'social_share'

export const POINT_VALUES: Record<EarnAction, number> = {
  daily_checkin: 10,
  referral: 15,
  first_purchase: 50,
  product_review: 20,
  profile_complete: 25,
  social_share: 10,
}

export const ACTION_LABELS: Record<EarnAction, string> = {
  daily_checkin: 'Daily wellness check-in',
  referral: 'Referred a friend',
  first_purchase: 'First purchase bonus',
  product_review: 'Product review',
  profile_complete: 'Profile completed',
  social_share: 'Shared on social media',
}

// Sequential migrations — no parallel ALTER TABLE on the same table
export async function ensureNeopulseTables() {
  // Create transactions table first (no FK — avoids type mismatch with NextAuth users.id)
  await query(`CREATE TABLE IF NOT EXISTS neopulse_transactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    action VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    reference_id VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`, []).catch((e) => console.error('[neopulse] create table error:', e?.message))

  // Add columns to users table one at a time to avoid lock contention
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS neopulse_balance INTEGER NOT NULL DEFAULT 0`, [])
    .catch((e) => console.error('[neopulse] add neopulse_balance error:', e?.message))

  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)`, [])
    .catch((e) => console.error('[neopulse] add referral_code error:', e?.message))

  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id TEXT`, [])
    .catch((e) => console.error('[neopulse] add referred_by error:', e?.message))

  // Index (non-critical, ignore failure)
  await query(`CREATE INDEX IF NOT EXISTS idx_neopulse_user_id ON neopulse_transactions(user_id, created_at DESC)`, [])
    .catch(() => {})
}

export async function ensureWellnessTables() {
  // No FK reference — avoids type mismatch with NextAuth users.id
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
  )`, []).catch((e) => console.error('[wellness] create table error:', e?.message))

  // Hydration + Mood added in v2 (nullable for backward compat)
  await query(`ALTER TABLE wellness_checkins ADD COLUMN IF NOT EXISTS hydration_score INTEGER`, []).catch(() => {})
  await query(`ALTER TABLE wellness_checkins ADD COLUMN IF NOT EXISTS mood_score INTEGER`, []).catch(() => {})

  await query(`CREATE INDEX IF NOT EXISTS idx_wellness_user_date ON wellness_checkins(user_id, check_in_date DESC)`, [])
    .catch(() => {})
}

export function calcWellnessScore(sleep: number, energy: number, stress: number, hydration?: number | null, mood?: number | null): number {
  if (hydration != null && mood != null) {
    const raw = (sleep + energy + hydration + mood + (11 - stress)) / 5
    return Math.round(raw * 10) / 10
  }
  const raw = (sleep + energy + (11 - stress)) / 3
  return Math.round(raw * 10) / 10
}

export function generateReferralCode(userId: string | number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const id = String(userId).replace(/\D/g, '') || '0'
  const n = parseInt(id.slice(-6)) // take last 6 digits to stay in safe int range
  let code = 'NEO'
  for (let i = 0; i < 5; i++) {
    code += chars[((n * 13 + i * 7 + 3) * 17) % chars.length]
  }
  return code
}

export async function awardPoints(
  userId: string | number,
  action: EarnAction,
  referenceId?: string,
  customDescription?: string
): Promise<{ awarded: number; newBalance: number }> {
  await ensureNeopulseTables()
  const points = POINT_VALUES[action]
  const description = customDescription ?? ACTION_LABELS[action]

  await query(
    `INSERT INTO neopulse_transactions (user_id, action, points, description, reference_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [String(userId), action, points, description, referenceId ?? null]
  )

  const updated = await queryOne<{ neopulse_balance: number }>(
    `UPDATE users SET neopulse_balance = neopulse_balance + $1 WHERE id = $2 RETURNING neopulse_balance`,
    [points, userId]
  )

  return { awarded: points, newBalance: updated?.neopulse_balance ?? 0 }
}

export async function hasActionToday(userId: string | number, action: EarnAction): Promise<boolean> {
  const row = await queryOne<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM neopulse_transactions
     WHERE user_id = $1 AND action = $2 AND created_at >= CURRENT_DATE`,
    [String(userId), action]
  )
  return parseInt(row?.cnt ?? '0') > 0
}

export async function hasEverDone(userId: string | number, action: EarnAction): Promise<boolean> {
  const row = await queryOne<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM neopulse_transactions WHERE user_id = $1 AND action = $2`,
    [String(userId), action]
  )
  return parseInt(row?.cnt ?? '0') > 0
}
