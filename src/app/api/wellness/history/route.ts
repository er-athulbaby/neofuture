import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { ensureWellnessTables } from '@/lib/neopulse'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureWellnessTables()

    const rows = await query<{
      check_in_date: string
      sleep_score: number
      energy_score: number
      stress_level: number
      wellness_score: string
    }>(
      `SELECT check_in_date, sleep_score, energy_score, stress_level, wellness_score
       FROM wellness_checkins
       WHERE user_id = $1 AND check_in_date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY check_in_date ASC`,
      [String(session.user.id)]
    )

    return NextResponse.json({ history: rows })
  } catch (err) {
    console.error('[wellness/history]', err)
    return NextResponse.json({ history: [] })
  }
}
