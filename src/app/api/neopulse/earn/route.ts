import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { awardPoints, hasActionToday, type EarnAction } from '@/lib/neopulse'

// Only these actions may be triggered directly by the client.
// All others (product_review, referral, first_purchase, etc.) are awarded
// server-side during the relevant flow to prevent points farming.
const USER_TRIGGERABLE: readonly EarnAction[] = ['daily_checkin', 'social_share']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json() as { action: EarnAction }

  if (!action || !USER_TRIGGERABLE.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const userId = String(session.user.id)

  // All user-triggerable actions are capped at once per day
  const done = await hasActionToday(userId, action)
  if (done) return NextResponse.json({ skipped: true, reason: 'Already earned today' })

  const result = await awardPoints(userId, action)
  return NextResponse.json({ success: true, awarded: result.awarded, new_balance: result.newBalance })
}
