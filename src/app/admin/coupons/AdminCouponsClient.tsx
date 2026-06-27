'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { formatDate } from '@/lib/utils'
import { Tag, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Coupon {
  id: number; code: string; type: string; value: number; min_order: number
  usage_limit: number | null; used_count: number; is_active: boolean
  expires_at: string | null; created_at: string
}

const EMPTY = { code: '', type: 'percent', value: '', min_order: '0', usage_limit: '', expires_at: '' }

export default function AdminCouponsClient({ coupons: initial }: { coupons: Coupon[] }) {
  const { toast } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const fc = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.value) { toast('Code and value required', 'error'); return }
    setSaving(true)
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        min_order: Number(form.min_order) || 0,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        expires_at: form.expires_at || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast(data.error || 'Failed to create', 'error'); return }
    toast('Coupon created!')
    setCoupons((cc) => [data.coupon, ...cc])
    setShowForm(false)
    setForm(EMPTY)
  }

  async function toggleCoupon(id: number, current: boolean) {
    const res = await fetch('/api/admin/coupons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    if (res.ok) {
      setCoupons((cc) => cc.map((c) => c.id === id ? { ...c, is_active: !current } : c))
    }
  }

  async function deleteCoupon(id: number, code: string) {
    if (!confirm(`Delete coupon "${code}"?`)) return
    const res = await fetch('/api/admin/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setCoupons((cc) => cc.filter((c) => c.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-brand-gray hover:text-primary text-sm">Admin</Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-bold text-brand-dark text-xl flex items-center gap-2">
            <Tag size={20} className="text-primary" /> Coupons
          </h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Coupons', value: coupons.length },
          { label: 'Active', value: coupons.filter((c) => c.is_active).length },
          { label: 'Total Uses', value: coupons.reduce((s, c) => s + c.used_count, 0) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-brand-dark">{s.value}</p>
            <p className="text-xs text-brand-gray mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-brand-gray">Code</th>
                <th className="text-left py-3 px-4 font-semibold text-brand-gray">Type</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-gray">Value</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-gray hidden sm:table-cell">Min Order</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-gray">Uses</th>
                <th className="text-left py-3 px-4 font-semibold text-brand-gray hidden md:table-cell">Expires</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-gray">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-gray">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-brand-gray">No coupons yet</td></tr>
              ) : coupons.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date()
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-dark">{c.code}</td>
                    <td className="py-3 px-4 text-brand-gray capitalize">{c.type}</td>
                    <td className="py-3 px-4 text-right font-semibold text-brand-dark">
                      {c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}

                    </td>
                    <td className="py-3 px-4 text-right text-brand-gray hidden sm:table-cell">
                      {c.min_order > 0 ? `₹${c.min_order}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-brand-gray">
                      {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''}
                    </td>
                    <td className="py-3 px-4 text-brand-gray hidden md:table-cell">
                      {c.expires_at ? (
                        <span className={expired ? 'text-danger' : ''}>
                          {new Date(c.expires_at).toLocaleDateString('en-IN')}
                          {expired && ' (expired)'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => toggleCoupon(c.id, c.is_active)}
                        className={cn('text-xs px-2.5 py-1 rounded-full font-semibold transition-colors',
                          c.is_active && !expired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {c.is_active && !expired ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => deleteCoupon(c.id, c.code)}
                        className="p-1.5 text-gray-400 hover:text-danger rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create coupon modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-brand-dark">Create Coupon</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createCoupon} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Coupon Code *</label>
                <input name="code" value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:border-primary"
                  placeholder="e.g. SAVE20" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Type</label>
                  <select name="type" value={form.type} onChange={fc}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">
                    Value {form.type === 'percent' ? '(%)' : '(₹)'} *
                  </label>
                  <input name="value" type="number" step="0.01" min="0" value={form.value} onChange={fc}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Min Order (₹)</label>
                  <input name="min_order" type="number" min="0" value={form.min_order} onChange={fc}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Usage Limit</label>
                  <input name="usage_limit" type="number" min="0" value={form.usage_limit} onChange={fc}
                    placeholder="Unlimited"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Expiry Date (optional)</label>
                <input name="expires_at" type="date" value={form.expires_at} onChange={fc}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-3 pt-1 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-brand-gray hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors">
                  {saving ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
