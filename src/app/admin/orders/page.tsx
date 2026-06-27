import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import AdminOrdersClient from './AdminOrdersClient'

interface OrderRow {
  id: number; order_number: string; status: string; payment_status: string
  total: number; created_at: string; user_name: string | null; user_email: string | null
  item_count: number; shipping_address: string
}

export default async function AdminOrdersPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/login')

  const orders = await query<OrderRow>(
    `SELECT o.id, o.order_number, o.status, o.payment_status, o.total, o.created_at,
       o.shipping_address, u.name as user_name, u.email as user_email,
       COUNT(oi.id)::int as item_count
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id, u.name, u.email
     ORDER BY o.created_at DESC`,
    []
  ).catch(() => [])

  return <AdminOrdersClient orders={orders} />
}
