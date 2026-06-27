import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { sendShippingUpdate } from '@/lib/email'

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.is_admin) return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const conditions = status ? `WHERE o.status = '${status}'` : ''
  const orders = await query(
    `SELECT o.*, u.name as user_name, u.email as user_email FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     ${conditions}
     ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return NextResponse.json({ orders })
}

export async function PUT(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, status, tracking_number } = await req.json()

  const order = await queryOne<{ order_number: string; user_id: string }>(
    `UPDATE orders SET status = $1, tracking_number = $2, updated_at = NOW() WHERE id = $3 RETURNING order_number, user_id`,
    [status, tracking_number ?? null, id]
  )

  if (status === 'shipped' && tracking_number && order) {
    const user = await queryOne<{ email: string }>(`SELECT email FROM users WHERE id = $1`, [order.user_id])
    if (user?.email) {
      await sendShippingUpdate(user.email, { orderNumber: order.order_number, trackingNumber: tracking_number }).catch(() => {})
    }
  }

  return NextResponse.json({ success: true })
}
