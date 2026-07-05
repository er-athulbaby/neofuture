import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ensureNeopulseTables, generateReferralCode } from '@/lib/neopulse'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureNeopulseTables()

  // Ensure referral code exists
  const user = await queryOne<{ neopulse_balance: number; referral_code: string | null }>(
    `SELECT neopulse_balance, referral_code FROM users WHERE id = $1`,
    [session.user.id]
  )

  let referralCode = user?.referral_code
  if (!referralCode) {
    referralCode = generateReferralCode(Number(session.user.id))
    await queryOne(
      `UPDATE users SET referral_code = $1 WHERE id = $2`,
      [referralCode, session.user.id]
    ).catch(() => {})
  }

  const transactions = await query<{
    id: number; action: string; points: number; description: string; created_at: string
  }>(
    `SELECT id, action, points, description, created_at
     FROM neopulse_transactions WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [session.user.id]
  )

  // Check if checked in today
  const checkedInToday = transactions.some(
    (t) =>
      t.action === 'daily_checkin' &&
      new Date(t.created_at).toDateString() === new Date().toDateString()
  )

  return NextResponse.json({
    balance: user?.neopulse_balance ?? 0,
    referral_code: referralCode,
    checked_in_today: checkedInToday,
    transactions,
  })
}
