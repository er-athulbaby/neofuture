import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [revenue, orderStats, leadCount, quizCount, revenueByDay, topProducts, ordersByStatus, quizPaths, funnel] = await Promise.all([
    // Total revenue
    queryOne<{ total: string; orders: string; avg: string }>(
      `SELECT COALESCE(SUM(total),0)::numeric(12,2) as total, COUNT(*)::int as orders, COALESCE(AVG(total),0)::numeric(10,2) as avg
       FROM orders WHERE payment_status = 'paid'`
    ),
    // Total customers
    queryOne<{ count: string }>('SELECT COUNT(DISTINCT id)::int as count FROM users WHERE is_admin = false'),
    // Leads
    queryOne<{ count: string }>('SELECT COUNT(*)::int as count FROM wellness_leads'),
    // Quiz completions
    queryOne<{ count: string }>('SELECT COUNT(*)::int as count FROM quiz_sessions WHERE completed = true'),

    // Revenue by day (last 30 days)
    query<{ date: string; revenue: number; orders: number }>(
      `SELECT DATE(created_at) as date, SUM(total)::numeric(12,2) as revenue, COUNT(*)::int as orders
       FROM orders WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date ASC`
    ),
    // Top products
    query<{ product_id: number; name: string; revenue: number; units: number }>(
      `SELECT oi.product_id, oi.product_name as name, SUM(oi.total)::numeric(12,2) as revenue, SUM(oi.quantity)::int as units
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.payment_status = 'paid'
       GROUP BY oi.product_id, oi.product_name ORDER BY revenue DESC LIMIT 5`
    ),
    // Orders by status
    query<{ status: string; count: number }>(
      `SELECT status, COUNT(*)::int as count FROM orders GROUP BY status ORDER BY count DESC`
    ),
    // Quiz paths
    query<{ path: string; count: number }>(
      `SELECT quiz_path as path, COUNT(*)::int as count FROM quiz_sessions WHERE completed = true GROUP BY quiz_path`
    ),
    // Funnel
    Promise.all([
      queryOne<{ count: string }>(`SELECT COUNT(*)::int as count FROM analytics_events WHERE event_type = 'page_view'`),
      queryOne<{ count: string }>(`SELECT COUNT(*)::int as count FROM quiz_sessions`),
      queryOne<{ count: string }>(`SELECT COUNT(*)::int as count FROM quiz_sessions WHERE completed = true`),
      queryOne<{ count: string }>(`SELECT COUNT(*)::int as count FROM analytics_events WHERE event_type = 'product_view'`),
      queryOne<{ count: string }>(`SELECT COUNT(*)::int as count FROM analytics_events WHERE event_type = 'add_to_cart'`),
      queryOne<{ count: string }>(`SELECT COUNT(*)::int as count FROM orders WHERE payment_status = 'paid'`),
    ]),
  ])

  const [visits, quizStarts, quizDone, productViews, cartAdds, purchases] = funnel

  return NextResponse.json({
    total_revenue: Number(revenue?.total ?? 0),
    total_orders: Number(revenue?.orders ?? 0),
    avg_order_value: Number(revenue?.avg ?? 0),
    total_customers: Number(orderStats?.count ?? 0),
    total_leads: Number(leadCount?.count ?? 0),
    quiz_completions: Number(quizCount?.count ?? 0),
    revenue_by_day: revenueByDay,
    top_products: topProducts,
    orders_by_status: ordersByStatus,
    quiz_paths: quizPaths,
    funnel: {
      visits: Number(visits?.count ?? 0),
      quiz_starts: Number(quizStarts?.count ?? 0),
      quiz_completions: Number(quizDone?.count ?? 0),
      product_views: Number(productViews?.count ?? 0),
      add_to_cart: Number(cartAdds?.count ?? 0),
      purchases: Number(purchases?.count ?? 0),
    },
  })
}
