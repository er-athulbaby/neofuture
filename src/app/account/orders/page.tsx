import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Package, ChevronRight } from 'lucide-react'

interface OrderRow {
  id: number; order_number: string; status: string; total: number
  created_at: string; item_count: number
}

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/account/orders')

  const orders = await query<OrderRow>(
    `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
       COUNT(oi.id)::int as item_count
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [session.user.id]
  ).catch(() => [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/account" className="text-brand-gray hover:text-primary text-sm">Dashboard</Link>
        <span className="text-gray-300">/</span>
        <h1 className="font-bold text-brand-dark text-xl flex items-center gap-2">
          <Package size={20} className="text-primary" /> My Orders
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-brand-dark font-semibold mb-1">No orders yet</p>
          <p className="text-brand-gray text-sm mb-6">Your orders will appear here after you make a purchase.</p>
          <Link href="/shop" className="inline-block bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/order/${order.id}`}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all group">
              <div>
                <p className="font-semibold text-brand-dark">#{order.order_number}</p>
                <p className="text-xs text-brand-gray mt-0.5">{formatDate(order.created_at)} · {order.item_count} item{order.item_count !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className="font-bold text-brand-dark">{formatPrice(order.total)}</span>
                <ChevronRight size={16} className="text-brand-gray group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
