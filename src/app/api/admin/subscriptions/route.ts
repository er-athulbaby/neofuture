import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'all'

  const rows = await query(`
    SELECT
      o.id, o.order_number, o.created_at, o.status, o.total,
      o.subscription_months, o.subscription_plan_id,
      u.name AS customer_name, u.email AS customer_email,
      sp.label AS plan_label, sp.price AS plan_price,
      oi.product_name,
      o.shipping_address
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN subscription_plans sp ON sp.id = o.subscription_plan_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.subscription_plan_id IS NOT NULL
      ${status !== 'all' ? `AND o.status = '${status}'` : ''}
    ORDER BY o.created_at DESC
    LIMIT 200
  `, []).catch(() => [])

  return NextResponse.json({ subscriptions: rows })
}
