import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import {
  calcWellnessScore, ensureWellnessTables, ensureNeopulseTables,
  awardPoints, hasActionToday, hasEverDone
} from '@/lib/neopulse'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureWellnessTables()

    const today = await queryOne<{
      sleep_score: number; energy_score: number; stress_level: number
      hydration_score: number | null; mood_score: number | null; wellness_score: string
    }>(
      `SELECT sleep_score, energy_score, stress_level, hydration_score, mood_score, wellness_score
       FROM wellness_checkins WHERE user_id = $1 AND check_in_date = CURRENT_DATE`,
      [String(session.user.id)]
    )

    return NextResponse.json({ done: !!today, today: today ?? null })
  } catch (err) {
    console.error('[wellness/checkin GET]', err)
    return NextResponse.json({ done: false, today: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { sleep_score, energy_score, stress_level, hydration_score, mood_score } = body

    if (
      typeof sleep_score !== 'number' || sleep_score < 1 || sleep_score > 10 ||
      typeof energy_score !== 'number' || energy_score < 1 || energy_score > 10 ||
      typeof stress_level !== 'number' || stress_level < 1 || stress_level > 10
    ) {
      return NextResponse.json({ error: 'Each score must be a number between 1 and 10' }, { status: 400 })
    }

    await ensureWellnessTables()
    await ensureNeopulseTables()

    const h = (typeof hydration_score === 'number' && hydration_score >= 1 && hydration_score <= 10) ? hydration_score : null
    const m = (typeof mood_score === 'number' && mood_score >= 1 && mood_score <= 10) ? mood_score : null
    const wellness_score = calcWellnessScore(sleep_score, energy_score, stress_level, h, m)
    const userId = String(session.user.id)

    await query(
      `INSERT INTO wellness_checkins (user_id, check_in_date, sleep_score, energy_score, stress_level, hydration_score, mood_score, wellness_score)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, check_in_date) DO UPDATE
       SET sleep_score = EXCLUDED.sleep_score,
           energy_score = EXCLUDED.energy_score,
           stress_level = EXCLUDED.stress_level,
           hydration_score = EXCLUDED.hydration_score,
           mood_score = EXCLUDED.mood_score,
           wellness_score = EXCLUDED.wellness_score`,
      [userId, sleep_score, energy_score, stress_level, h, m, wellness_score]
    )

    let npAwarded = 0

    // Daily check-in: 10 NP (once per day)
    const alreadyAwarded = await hasActionToday(userId, 'daily_checkin')
    if (!alreadyAwarded) {
      const result = await awardPoints(userId, 'daily_checkin')
      npAwarded += result.awarded
    }

    // Weekly streak: 35 NP when 7 consecutive days are checked in (once per week)
    const streakRow = await queryOne<{ cnt: string }>(
      `SELECT COUNT(DISTINCT check_in_date)::text as cnt FROM wellness_checkins
       WHERE user_id = $1 AND check_in_date >= CURRENT_DATE - 6`,
      [userId]
    ).catch(() => null)
    const streakDays = parseInt(streakRow?.cnt ?? '0')
    if (streakDays >= 7) {
      const alreadyStreakThisWeek = await queryOne<{ cnt: string }>(
        `SELECT COUNT(*)::text as cnt FROM neopulse_transactions
         WHERE user_id = $1 AND action = 'weekly_streak' AND created_at >= CURRENT_DATE - 6`,
        [userId]
      ).catch(() => null)
      if (parseInt(alreadyStreakThisWeek?.cnt ?? '0') === 0) {
        const result = await awardPoints(userId, 'weekly_streak')
        npAwarded += result.awarded
      }
    }

    // Neo Twin unlock: 300 NP one-time when reaching 30 check-ins
    const totalRow = await queryOne<{ cnt: string }>(
      `SELECT COUNT(*)::text as cnt FROM wellness_checkins WHERE user_id = $1`,
      [userId]
    ).catch(() => null)
    const totalCheckins = parseInt(totalRow?.cnt ?? '0')
    if (totalCheckins >= 30) {
      const alreadyUnlocked = await hasEverDone(userId, 'neo_twin_unlock')
      if (!alreadyUnlocked) {
        const result = await awardPoints(userId, 'neo_twin_unlock')
        npAwarded += result.awarded
      }
    }

    return NextResponse.json({ success: true, wellness_score, np_awarded: npAwarded })
  } catch (err) {
    console.error('[wellness/checkin POST]', err)
    const msg = err instanceof Error ? err.message : 'Failed to save check-in'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
