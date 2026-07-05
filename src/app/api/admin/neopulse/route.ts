import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { ensureNeopulseTables, ensureWellnessTables } from '@/lib/neopulse'

export async function GET() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await ensureNeopulseTables()
    await ensureWellnessTables()

    const users = await query<{
      id: number
      name: string
      email: string
      neopulse_balance: number
      referral_code: string | null
      total_earned: string
      total_redeemed: string
      last_checkin: string | null
      avg_wellness: string | null
      checkin_streak: string
    }>(
      `SELECT
         u.id, u.name, u.email, u.neopulse_balance, u.referral_code,
         COALESCE(SUM(CASE WHEN t.points > 0 THEN t.points ELSE 0 END), 0)::text AS total_earned,
         COALESCE(ABS(SUM(CASE WHEN t.points < 0 THEN t.points ELSE 0 END)), 0)::text AS total_redeemed,
         (SELECT MAX(check_in_date)::text FROM wellness_checkins wc WHERE wc.user_id = u.id::text) AS last_checkin,
         (SELECT ROUND(AVG(wellness_score::numeric),1)::text FROM wellness_checkins wc
          WHERE wc.user_id = u.id::text AND check_in_date >= CURRENT_DATE - 7) AS avg_wellness,
         (SELECT COUNT(*)::text FROM wellness_checkins wc WHERE wc.user_id = u.id::text) AS checkin_streak
       FROM users u
       LEFT JOIN neopulse_transactions t ON t.user_id = u.id::text
       WHERE u.neopulse_balance > 0 OR EXISTS (SELECT 1 FROM wellness_checkins wc WHERE wc.user_id = u.id::text)
       GROUP BY u.id, u.name, u.email, u.neopulse_balance, u.referral_code
       ORDER BY u.neopulse_balance DESC`,
      []
    )

    const stats = await query<{ total_balance: string; active_today: string }>(
      `SELECT
         COALESCE(SUM(neopulse_balance), 0)::text AS total_balance,
         (SELECT COUNT(*)::text FROM neopulse_transactions WHERE created_at >= CURRENT_DATE) AS active_today
       FROM users WHERE neopulse_balance > 0`,
      []
    )

    return NextResponse.json({ users, stats: stats[0] ?? { total_balance: '0', active_today: '0' } })
  } catch (err) {
    console.error('[admin/neopulse]', err)
    return NextResponse.json({ users: [], stats: { total_balance: '0', active_today: '0' } })
  }
}
