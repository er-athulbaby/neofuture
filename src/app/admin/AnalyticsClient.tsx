'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import type { AnalyticsOverview } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { TrendingUp, Users, ShoppingBag, MessageCircle, Sparkles, Package } from 'lucide-react'

const PATH_LABELS: Record<string, string> = {
  pcos: 'PCOS (neobalance)',
  sleep_stress: 'Sleep/Stress (neonidra)',
  energy: 'Energy (neoprime)',
}

const PIE_COLORS = ['#D4236A', '#E07B2A', '#7B35A8', '#16A34A', '#6B7280']

interface Props { data: AnalyticsOverview }

export default function AdminAnalyticsClient({ data }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin top nav */}
      <div className="bg-brand-dark text-white px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">
          <span className="text-neo-orange">neo</span>future Admin
        </span>
        <nav className="flex gap-4 text-sm text-gray-300">
          <Link href="/admin" className="text-white font-medium">Analytics</Link>
          <Link href="/admin/products" className="hover:text-white">Products</Link>
          <Link href="/admin/orders" className="hover:text-white">Orders</Link>
          <Link href="/admin/leads" className="hover:text-white">Leads</Link>
          <Link href="/admin/coupons" className="hover:text-white">Coupons</Link>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-brand-dark mb-6">Analytics Dashboard</h1>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <KPICard label="Total Revenue" value={formatPrice(data.total_revenue)} icon={<TrendingUp size={18} />} color="primary" />
          <KPICard label="Total Orders" value={data.total_orders.toString()} icon={<ShoppingBag size={18} />} color="neo-orange" />
          <KPICard label="Avg Order Value" value={formatPrice(data.avg_order_value)} icon={<TrendingUp size={18} />} color="neo-purple" />
          <KPICard label="Customers" value={data.total_customers.toString()} icon={<Users size={18} />} color="primary" />
          <KPICard label="Quiz Leads" value={data.total_leads.toString()} icon={<MessageCircle size={18} />} color="neo-orange" />
          <KPICard label="Quiz Completions" value={data.quiz_completions.toString()} icon={<Sparkles size={18} />} color="neo-purple" />
        </div>

        {/* Revenue chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-brand-dark mb-4">Revenue — Last 30 Days</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.revenue_by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).getDate().toString()} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => formatPrice(Number(v))} labelFormatter={(l) => formatDate(l as string)} />
                <Line type="monotone" dataKey="revenue" stroke="#D4236A" strokeWidth={2} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quiz paths pie */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-brand-dark mb-4">Quiz Paths</h2>
            {data.quiz_paths.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={data.quiz_paths} dataKey="count" nameKey="path" cx="50%" cy="50%" outerRadius={70}>
                      {data.quiz_paths.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, PATH_LABELS[name as string] ?? name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-3">
                  {data.quiz_paths.map((p, i) => (
                    <div key={p.path} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-brand-dark truncate">{PATH_LABELS[p.path] ?? p.path}</span>
                      <span className="ml-auto font-semibold text-brand-dark">{p.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-brand-gray text-sm">No quiz data yet</div>
            )}
          </div>
        </div>

        {/* Top products + funnel + order status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top products */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
              <Package size={16} /> Top Products
            </h2>
            {data.top_products.length > 0 ? (
              <div className="space-y-3">
                {data.top_products.map((p, i) => (
                  <div key={p.product_id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{p.name}</p>
                      <p className="text-xs text-brand-gray">{p.units} units · {formatPrice(p.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-brand-gray text-sm">No sales yet</div>
            )}
          </div>

          {/* Orders by status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-brand-dark mb-4">Orders by Status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.orders_by_status} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#D4236A" radius={[0, 4, 4, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Funnel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-brand-dark mb-4">Conversion Funnel</h2>
            <div className="space-y-2">
              {[
                { label: 'Quiz Starts', value: data.funnel.quiz_starts, color: 'primary' },
                { label: 'Quiz Completions', value: data.funnel.quiz_completions, color: 'neo-orange' },
                { label: 'Purchases', value: data.funnel.purchases, color: 'success' },
              ].map((step, i, arr) => {
                const pct = i === 0 ? 100 : arr[0].value > 0 ? Math.round((step.value / arr[0].value) * 100) : 0
                return (
                  <div key={step.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-brand-dark font-medium">{step.label}</span>
                      <span className="text-brand-gray">{step.value} ({pct}%)</span>
                    </div>
                    <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div className={`h-full bg-${step.color} rounded-lg transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-light text-primary',
    'neo-orange': 'bg-neo-orange-light text-neo-orange',
    'neo-purple': 'bg-neo-purple-light text-neo-purple',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className={`w-9 h-9 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-brand-dark">{value}</p>
      <p className="text-xs text-brand-gray mt-0.5">{label}</p>
    </div>
  )
}
