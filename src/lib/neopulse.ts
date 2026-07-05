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

export async function ensureNeopulseTables() {
  await Promise.all([
    query(`CREATE TABLE IF NOT EXISTS neopulse_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      points INTEGER NOT NULL,
      description TEXT,
      reference_id VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`, []).catch(() => {}),
    query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS neopulse_balance INTEGER NOT NULL DEFAULT 0`, []).catch(() => {}),
    query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)`, []).catch(() => {}),
    query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id INTEGER`, []).catch(() => {}),
    query(`CREATE INDEX IF NOT EXISTS idx_neopulse_user_id ON neopulse_transactions(user_id, created_at DESC)`, []).catch(() => {}),
  ])
}

export async function ensureWellnessTables() {
  await Promise.all([
    query(`CREATE TABLE IF NOT EXISTS wellness_checkins (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
      sleep_score INTEGER NOT NULL,
      energy_score INTEGER NOT NULL,
      stress_level INTEGER NOT NULL,
      wellness_score NUMERIC(4,1) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, check_in_date)
    )`, []).catch(() => {}),
    query(`CREATE INDEX IF NOT EXISTS idx_wellness_user_date ON wellness_checkins(user_id, check_in_date DESC)`, []).catch(() => {}),
  ])
}

export function calcWellnessScore(sleep: number, energy: number, stress: number): number {
  const raw = (sleep + energy + (11 - stress)) / 3
  return Math.round(raw * 10) / 10
}

export function generateReferralCode(userId: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'NEO'
  const seed = userId * 31337
  for (let i = 0; i < 5; i++) {
    code += chars[(seed * (i + 7) * 13) % chars.length]
  }
  return code
}

export async function awardPoints(
  userId: number,
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
    [userId, action, points, description, referenceId ?? null]
  )

  const updated = await queryOne<{ neopulse_balance: number }>(
    `UPDATE users SET neopulse_balance = neopulse_balance + $1 WHERE id = $2 RETURNING neopulse_balance`,
    [points, userId]
  )

  return { awarded: points, newBalance: updated?.neopulse_balance ?? 0 }
}

export async function hasActionToday(userId: number, action: EarnAction): Promise<boolean> {
  const row = await queryOne<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM neopulse_transactions
     WHERE user_id = $1 AND action = $2 AND created_at >= CURRENT_DATE`,
    [userId, action]
  )
  return parseInt(row?.cnt ?? '0') > 0
}

export async function hasEverDone(userId: number, action: EarnAction): Promise<boolean> {
  const row = await queryOne<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM neopulse_transactions WHERE user_id = $1 AND action = $2`,
    [userId, action]
  )
  return parseInt(row?.cnt ?? '0') > 0
}
