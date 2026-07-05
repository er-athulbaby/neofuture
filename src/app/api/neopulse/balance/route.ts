import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ensureNeopulseTables, generateReferralCode } from '@/lib/neopulse'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureNeopulseTables()

    // Use try/catch in case columns don't exist yet on first migration
    let balance = 0
    let existingReferralCode: string | null = null

    try {
      const user = await queryOne<{ neopulse_balance: number; referral_code: string | null }>(
        `SELECT neopulse_balance, referral_code FROM users WHERE id = $1`,
        [session.user.id]
      )
      balance = user?.neopulse_balance ?? 0
      existingReferralCode = user?.referral_code ?? null
    } catch (e) {
      console.error('[neopulse/balance] SELECT failed — columns may not exist yet:', e)
      // Columns may not exist yet; return safe defaults
      return NextResponse.json({ balance: 0, referral_code: '', checked_in_today: false, transactions: [] })
    }

    // Generate and persist referral code if missing
    let referralCode = existingReferralCode
    if (!referralCode) {
      referralCode = generateReferralCode(session.user.id)
      await queryOne(
        `UPDATE users SET referral_code = $1 WHERE id = $2`,
        [referralCode, session.user.id]
      ).catch((e) => console.error('[neopulse/balance] UPDATE referral_code failed:', e?.message))
    }

    const transactions = await query<{
      id: number; action: string; points: number; description: string; created_at: string
    }>(
      `SELECT id, action, points, description, created_at
       FROM neopulse_transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [String(session.user.id)]
    ).catch(() => [] as never[])

    const checkedInToday = transactions.some(
      (t) =>
        t.action === 'daily_checkin' &&
        new Date(t.created_at).toDateString() === new Date().toDateString()
    )

    return NextResponse.json({
      balance,
      referral_code: referralCode ?? '',
      checked_in_today: checkedInToday,
      transactions,
    })
  } catch (err) {
    console.error('[neopulse/balance] unexpected error:', err)
    return NextResponse.json({ balance: 0, referral_code: '', checked_in_today: false, transactions: [] })
  }
}
