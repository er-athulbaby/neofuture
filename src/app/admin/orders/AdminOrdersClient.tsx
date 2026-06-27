'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import { formatPrice, formatDate } from '@/lib/utils'
import { ShoppingBag, ChevronDown, X, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Order {
  id: number; order_number: string; status: string; payment_status: string
  total: number; created_at: string; user_name: string | null; user_email: string | null
  item_count: number; shipping_address: string
}

const STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminOrdersClient({ orders: initial }: { orders: Order[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>(initial)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = orders.filter((o) => {
    const matchStatus = filter === 'all' || o.status === filter
    const matchSearch = !search || o.order_number.includes(search) ||
      o.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user_email?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  function openEdit(order: Order) {
    setEditOrder(order)
    setNewStatus(order.status)
    setTrackingNumber('')
    setNotes('')
  }

  async function updateOrder() {
    if (!editOrder) return
    setSaving(true)
    const res = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editOrder.id,
        status: newStatus,
        tracking_number: trackingNumber || undefined,
        notes: notes || undefined,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast('Failed to update order', 'error'); return }
    setOrders((oo) => oo.map((o) => o.id === editOrder.id ? { ...o, status: newStatus } : o))
    toast(`Order #${editOrder.order_number} updated!`)
    setEditOrder(null)
  }

  const addr = (json: string) => { try { const a = JSON.parse(json); return `${a.city}, ${a.state}` } catch { return '—' } }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-brand-gray hover:text-primary text-sm">Admin</Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-bold text-brand-dark text-xl flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" /> Orders
          </h1>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, name, email..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary w-full sm:w-72" />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap mb-5">
        {['all', ...STATUSES].map((s) => {
          const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={cn('px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-brand-gray hover:bg-gray-200')}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-brand-gray">Order</th>
                <th className="text-left py-3 px-4 font-semibold text-brand-gray hidden md:table-cell">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-brand-gray hidden lg:table-cell">Location</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-gray">Items</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-gray">Amount</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-gray">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-gray">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-brand-gray">No orders found</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-brand-dark">#{o.order_number}</p>
                    <p className="text-xs text-brand-gray">{formatDate(o.created_at)}</p>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <p className="text-brand-dark">{o.user_name ?? 'Guest'}</p>
                    {o.user_email && <p className="text-xs text-brand-gray">{o.user_email}</p>}
                  </td>
                  <td className="py-3 px-4 text-brand-gray hidden lg:table-cell">{addr(o.shipping_address)}</td>
                  <td className="py-3 px-4 text-center text-brand-gray">{o.item_count}</td>
                  <td className="py-3 px-4 text-right font-semibold text-brand-dark">{formatPrice(o.total)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold', STATUS_BADGE[o.status] ?? 'bg-gray-100 text-gray-500')}>
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/order/${o.id}`} target="_blank"
                        className="text-xs text-brand-gray hover:text-primary px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">View</Link>
                      <button onClick={() => openEdit(o)}
                        className="text-xs text-primary hover:bg-primary-light px-2.5 py-1 rounded-lg font-medium transition-colors">Update</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-brand-dark">Update Order #{editOrder.order_number}</h2>
              <button onClick={() => setEditOrder(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Order Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              {(newStatus === 'shipped' || newStatus === 'delivered') && (
                <div>
                  <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase flex items-center gap-1">
                    <Truck size={12} /> Tracking Number
                  </label>
                  <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                    placeholder="Enter tracking number" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Note to Customer (optional)</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Dispatched via DTDC" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditOrder(null)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-brand-gray hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={updateOrder} disabled={saving}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors">
                  {saving ? 'Saving...' : 'Update Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
