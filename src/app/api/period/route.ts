import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const logs = await query<{ id: number; start_date: string; end_date: string | null; notes: string | null }>(
      `SELECT id, start_date::text, end_date::text, notes FROM period_logs WHERE user_id = $1 ORDER BY start_date DESC LIMIT 12`,
      [session.user.id]
    )

    const prediction = await queryOne<{ predicted_start: string; predicted_end: string; avg_cycle_length: number }>(
      `SELECT predicted_start::text, predicted_end::text, avg_cycle_length FROM period_predictions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [session.user.id]
    ).catch(() => null)

    return NextResponse.json({ logs, prediction })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { start_date, end_date, notes } = await req.json()
    if (!start_date) return NextResponse.json({ error: 'Start date required' }, { status: 400 })

    const log = await queryOne<{ id: number }>(
      `INSERT INTO period_logs (user_id, start_date, end_date, notes) VALUES ($1, $2, $3, $4) RETURNING id`,
      [session.user.id, start_date, end_date ?? null, notes ?? null]
    )

    // Compute next period prediction from last 3 cycles
    const recentLogs = await query<{ start_date: string }>(
      `SELECT start_date::text FROM period_logs WHERE user_id = $1 ORDER BY start_date DESC LIMIT 4`,
      [session.user.id]
    )

    if (recentLogs.length >= 2) {
      const gaps: number[] = []
      for (let i = 0; i < recentLogs.length - 1; i++) {
        const a = new Date(recentLogs[i].start_date)
        const b = new Date(recentLogs[i + 1].start_date)
        gaps.push(Math.round((a.getTime() - b.getTime()) / 86400000))
      }
      const avgCycle = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length)
      const lastStart = new Date(recentLogs[0].start_date)
      const predictedStart = new Date(lastStart)
      predictedStart.setDate(predictedStart.getDate() + avgCycle)
      const predictedEnd = new Date(predictedStart)
      predictedEnd.setDate(predictedEnd.getDate() + 5)

      await query(
        `INSERT INTO period_predictions (user_id, predicted_start, predicted_end, avg_cycle_length, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id) DO UPDATE SET predicted_start=$2, predicted_end=$3, avg_cycle_length=$4, updated_at=NOW()`,
        [session.user.id, predictedStart.toISOString().split('T')[0], predictedEnd.toISOString().split('T')[0], avgCycle]
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, id: log!.id })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    await query(`DELETE FROM period_logs WHERE id = $1 AND user_id = $2`, [id, session.user.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 })
  }
}
