'use client'

import { useEffect, useState } from 'react'
import { formatPrice, formatDate } from '@/lib/utils'
import { RotateCcw, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubOrder {
  id: number
  order_number: string
  created_at: string
  status: string
  total: number
  subscription_months: number
  plan_label: string
  plan_price: number
  customer_name: string | null
  customer_email: string | null
  product_name: string | null
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-orange-600 bg-orange-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<SubOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function load(status = 'all') {
    setLoading(true)
    const res = await fetch(`/api/admin/subscriptions?status=${status}`)
    if (res.ok) {
      const d = await res.json()
      setSubs(d.subscriptions ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  const filtered = subs.filter((s) => {
    const q = search.toLowerCase()
    return !q || s.order_number?.toLowerCase().includes(q)
      || s.customer_name?.toLowerCase().includes(q)
      || s.customer_email?.toLowerCase().includes(q)
      || s.product_name?.toLowerCase().includes(q)
  })

  const stats = {
    total: subs.length,
    active: subs.filter((s) => s.status !== 'cancelled').length,
    revenue: subs.reduce((sum, s) => sum + Number(s.total), 0),
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <RotateCcw size={22} className="text-primary" />
        <h1 className="text-2xl font-bold text-brand-dark">Subscriptions</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Total Revenue', value: formatPrice(stats.revenue) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs text-brand-gray uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-brand-dark">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, product, order…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-brand-gray">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-brand-gray">
            <RotateCcw size={40} className="mb-2 opacity-30" />
            <p>No subscription orders yet.</p>
            <p className="text-xs mt-1">Add subscription plans to a product and customers can subscribe from the product page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-brand-gray">Order</th>
                  <th className="text-left px-5 py-3 font-semibold text-brand-gray">Customer</th>
                  <th className="text-left px-5 py-3 font-semibold text-brand-gray hidden md:table-cell">Product</th>
                  <th className="text-left px-5 py-3 font-semibold text-brand-gray hidden sm:table-cell">Plan</th>
                  <th className="text-right px-5 py-3 font-semibold text-brand-gray">Total</th>
                  <th className="text-center px-5 py-3 font-semibold text-brand-gray">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-brand-gray hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-mono text-xs text-brand-gray">#{s.order_number}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-brand-dark">{s.customer_name ?? '—'}</p>
                      <p className="text-xs text-brand-gray">{s.customer_email ?? ''}</p>
                    </td>
                    <td className="px-5 py-3 text-brand-dark hidden md:table-cell">{s.product_name ?? '—'}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                        <RotateCcw size={10} /> {s.plan_label ?? `${s.subscription_months}mo`}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-brand-dark">{formatPrice(Number(s.total))}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full capitalize', STATUS_COLORS[s.status] ?? 'text-gray-600 bg-gray-100')}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-brand-gray text-xs hidden lg:table-cell">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
