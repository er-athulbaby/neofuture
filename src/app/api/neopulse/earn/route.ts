import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { awardPoints, hasActionToday, hasEverDone, type EarnAction, POINT_VALUES } from '@/lib/neopulse'

const ONE_TIME_ACTIONS: EarnAction[] = ['first_purchase', 'profile_complete']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, referenceId } = await req.json() as { action: EarnAction; referenceId?: string }

  if (!action || !(action in POINT_VALUES)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const userId = Number(session.user.id)

  // Daily actions: only once per day
  if (action === 'daily_checkin' || action === 'social_share') {
    const done = await hasActionToday(userId, action)
    if (done) return NextResponse.json({ skipped: true, reason: 'Already earned today' })
  }

  // One-time actions
  if (ONE_TIME_ACTIONS.includes(action)) {
    const done = await hasEverDone(userId, action)
    if (done) return NextResponse.json({ skipped: true, reason: 'Already earned once' })
  }

  const result = await awardPoints(userId, action, referenceId)
  return NextResponse.json({ success: true, awarded: result.awarded, new_balance: result.newBalance })
}
