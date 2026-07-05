import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import {
  calcWellnessScore, ensureWellnessTables, ensureNeopulseTables,
  awardPoints, hasActionToday
} from '@/lib/neopulse'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureWellnessTables()

  const today = await queryOne<{
    sleep_score: number; energy_score: number; stress_level: number; wellness_score: string
  }>(
    `SELECT sleep_score, energy_score, stress_level, wellness_score
     FROM wellness_checkins WHERE user_id = $1 AND check_in_date = CURRENT_DATE`,
    [session.user.id]
  )

  return NextResponse.json({ done: !!today, today: today ?? null })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sleep_score, energy_score, stress_level } = await req.json()

  if (
    typeof sleep_score !== 'number' || sleep_score < 1 || sleep_score > 10 ||
    typeof energy_score !== 'number' || energy_score < 1 || energy_score > 10 ||
    typeof stress_level !== 'number' || stress_level < 1 || stress_level > 10
  ) {
    return NextResponse.json({ error: 'Scores must be between 1 and 10' }, { status: 400 })
  }

  await ensureWellnessTables()
  await ensureNeopulseTables()

  const wellness_score = calcWellnessScore(sleep_score, energy_score, stress_level)

  try {
    await query(
      `INSERT INTO wellness_checkins (user_id, check_in_date, sleep_score, energy_score, stress_level, wellness_score)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
       ON CONFLICT (user_id, check_in_date) DO UPDATE
       SET sleep_score=$2, energy_score=$3, stress_level=$4, wellness_score=$5`,
      [session.user.id, sleep_score, energy_score, stress_level, wellness_score]
    )
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  }

  // Award 10 NP if not already awarded today
  let npAwarded = 0
  const alreadyAwarded = await hasActionToday(Number(session.user.id), 'daily_checkin')
  if (!alreadyAwarded) {
    const result = await awardPoints(Number(session.user.id), 'daily_checkin')
    npAwarded = result.awarded
  }

  return NextResponse.json({ success: true, wellness_score, np_awarded: npAwarded })
}
