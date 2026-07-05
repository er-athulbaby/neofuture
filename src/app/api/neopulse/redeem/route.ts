import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { ensureNeopulseTables } from '@/lib/neopulse'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { points_to_redeem, order_reference } = await req.json()
  const pts = Number(points_to_redeem)

  if (!pts || pts < 100 || pts % 100 !== 0) {
    return NextResponse.json({ error: 'Points must be a multiple of 100 (minimum 100)' }, { status: 400 })
  }

  await ensureNeopulseTables()

  const user = await queryOne<{ neopulse_balance: number }>(
    `SELECT neopulse_balance FROM users WHERE id = $1`,
    [session.user.id]
  )

  if (!user || user.neopulse_balance < pts) {
    return NextResponse.json({ error: 'Insufficient NeoPulse points' }, { status: 400 })
  }

  const discountPercent = pts / 100

  await query(
    `INSERT INTO neopulse_transactions (user_id, action, points, description, reference_id)
     VALUES ($1, 'redemption', $2, $3, $4)`,
    [session.user.id, -pts, `Redeemed ${pts} NP — ${discountPercent}% order discount`, order_reference ?? null]
  )

  await query(
    `UPDATE users SET neopulse_balance = neopulse_balance - $1 WHERE id = $2`,
    [pts, session.user.id]
  )

  return NextResponse.json({ success: true, discount_percent: discountPercent, points_used: pts })
}
