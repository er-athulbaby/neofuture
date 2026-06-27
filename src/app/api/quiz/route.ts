import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()

    const {
      ageGroup, mainConcern, path, answers,
      hormone_score, stress_score, energy_score,
      recommended_product,
    } = body

    const sessionKey = crypto.randomUUID()

    const result = await queryOne<{ id: number }>(
      `INSERT INTO quiz_sessions
        (user_id, session_key, age_group, main_concern, quiz_path, answers, hormone_score, stress_score, energy_score, completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING id`,
      [
        session?.user?.id ?? null,
        sessionKey,
        ageGroup,
        mainConcern,
        path,
        JSON.stringify(answers),
        hormone_score ?? 0,
        stress_score ?? 0,
        energy_score ?? 0,
      ]
    )

    // Save wellness score for logged in users
    if (session?.user?.id && result?.id) {
      await query(
        `INSERT INTO wellness_scores (user_id, hormone_score, stress_score, energy_score, quiz_session_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [session.user.id, hormone_score ?? 0, stress_score ?? 0, energy_score ?? 0, result.id]
      )
    }

    // Track analytics event
    await query(
      `INSERT INTO analytics_events (event_type, user_id, data) VALUES ($1, $2, $3)`,
      ['quiz_completed', session?.user?.id ?? null, JSON.stringify({ path, recommended_product })]
    ).catch(() => {})

    return NextResponse.json({ session_id: result?.id })
  } catch (err) {
    console.error('Quiz error:', err)
    return NextResponse.json({ error: 'Failed to save quiz' }, { status: 500 })
  }
}
