import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import AdminAnalyticsClient from './AnalyticsClient'
import type { AnalyticsOverview } from '@/types'

export const metadata = { title: 'Admin — Analytics' }
export const revalidate = 60

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/')

  const [revenue, customers, leads, quizDone, revenueByDay, topProducts, ordersByStatus, quizPaths, funnelData] = await Promise.all([
    queryOne<{ total: string; orders: string; avg: string }>(
      `SELECT COALESCE(SUM(total),0)::numeric(12,2) as total, COUNT(*)::int as orders, COALESCE(AVG(total),0)::numeric(10,2) as avg FROM orders WHERE payment_status = 'paid'`
    ).catch(() => null),
    queryOne<{ count: string }>('SELECT COUNT(DISTINCT id)::int as count FROM users WHERE is_admin = false').catch(() => null),
    queryOne<{ count: string }>('SELECT COUNT(*)::int as count FROM wellness_leads').catch(() => null),
    queryOne<{ count: string }>('SELECT COUNT(*)::int as count FROM quiz_sessions WHERE completed = true').catch(() => null),
    query<{ date: string; revenue: number; orders: number }>(
      `SELECT DATE(created_at) as date, SUM(total)::numeric(12,2) as revenue, COUNT(*)::int as orders FROM orders WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date ASC`
    ).catch(() => []),
    query<{ product_id: number; name: string; revenue: number; units: number }>(
      `SELECT oi.product_id, oi.product_name as name, SUM(oi.total)::numeric(12,2) as revenue, SUM(oi.quantity)::int as units FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.payment_status = 'paid' GROUP BY oi.product_id, oi.product_name ORDER BY revenue DESC LIMIT 5`
    ).catch(() => []),
    query<{ status: string; count: number }>(
      `SELECT status, COUNT(*)::int as count FROM orders GROUP BY status ORDER BY count DESC`
    ).catch(() => []),
    query<{ path: string; count: number }>(
      `SELECT quiz_path as path, COUNT(*)::int as count FROM quiz_sessions WHERE completed = true GROUP BY quiz_path`
    ).catch(() => []),
    Promise.all([
      queryOne<{ count: string }>(`SELECT COUNT(*)::int as count FROM quiz_sessions`).catch(() => null),
      queryOne<{ count: string }>(`SELECT COUNT(*)::int as count FROM quiz_sessions WHERE completed = true`).catch(() => null),
      queryOne<{ count: string }>(`SELECT COUNT(*)::int as count FROM orders WHERE payment_status = 'paid'`).catch(() => null),
    ]),
  ])

  const analytics: AnalyticsOverview = {
    total_revenue: Number(revenue?.total ?? 0),
    total_orders: Number(revenue?.orders ?? 0),
    avg_order_value: Number(revenue?.avg ?? 0),
    total_customers: Number(customers?.count ?? 0),
    total_leads: Number(leads?.count ?? 0),
    quiz_completions: Number(quizDone?.count ?? 0),
    revenue_by_day: revenueByDay,
    top_products: topProducts,
    orders_by_status: ordersByStatus,
    quiz_paths: quizPaths,
    funnel: {
      visits: 0,
      quiz_starts: Number(funnelData[0]?.count ?? 0),
      quiz_completions: Number(funnelData[1]?.count ?? 0),
      product_views: 0,
      add_to_cart: 0,
      purchases: Number(funnelData[2]?.count ?? 0),
    },
  }

  return <AdminAnalyticsClient data={analytics} />
}
