'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Users, Eye, Clock, TrendingDown, RefreshCw, AlertCircle, BarChart2, Globe, Monitor, Smartphone, Tablet } from 'lucide-react'

type Range = 'today' | 'week' | 'month'

interface GAData {
  configured: boolean
  error?: string
  today?: { users: number; sessions: number; pageViews: number }
  week?: { users: number; sessions: number; pageViews: number }
  month?: {
    users: number; newUsers: number; sessions: number
    pageViews: number; bounceRate: number; avgDuration: number
  }
  trend?: { date: string; users: number; sessions: number; pageViews: number }[]
  topPages?: { path: string; views: number; users: number }[]
  sources?: { channel: string; sessions: number; users: number }[]
  devices?: { device: string; sessions: number }[]
}

const COLORS = ['#D4236A', '#7B35A8', '#E07B2A', '#16A34A', '#0891B2', '#6366F1', '#F59E0B', '#EC4899']

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

function fmtDate(d: string) {
  // YYYYMMDD → MMM DD
  return new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-brand-dark">{value}</div>
      <div className="text-sm text-brand-gray mt-0.5">{label}</div>
      {sub && <div className="text-xs text-brand-gray/60 mt-1">{sub}</div>}
    </div>
  )
}

const DeviceIcon = ({ device }: { device: string }) => {
  const d = device.toLowerCase()
  if (d === 'mobile') return <Smartphone size={14} className="text-brand-gray" />
  if (d === 'tablet') return <Tablet size={14} className="text-brand-gray" />
  return <Monitor size={14} className="text-brand-gray" />
}

export default function GAAnalyticsPage() {
  const [data, setData] = useState<GAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('month')
  const [activeMetric, setActiveMetric] = useState<'users' | 'sessions' | 'pageViews'>('users')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ga')
      setData(await res.json())
    } catch {
      setData({ configured: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-brand-gray">
          <RefreshCw size={20} className="animate-spin" />
          <span>Loading analytics…</span>
        </div>
      </div>
    )
  }

  if (!data?.configured) {
    return (
      <div className="p-8 max-w-lg">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-amber-900 mb-2">Google Analytics not configured</div>
              <p className="text-sm text-amber-800 mb-4">
                Add these environment variables to your <code className="bg-amber-100 px-1 rounded">.env.local</code>:
              </p>
              <pre className="bg-amber-100 rounded-xl p-4 text-xs text-amber-900 overflow-x-auto whitespace-pre">
{`NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
GA_PROPERTY_ID=123456789
GOOGLE_SA_CLIENT_EMAIL=sa@project.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`}
              </pre>
              <p className="text-xs text-amber-700 mt-3">
                GA_PROPERTY_ID is the numeric ID from your GA4 property settings (not the G- measurement ID).
                GOOGLE_SA_* come from a service account JSON key with Analytics Viewer role.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="p-8 max-w-lg">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-900 mb-1">GA API error</div>
              <div className="text-sm text-red-800">{data.error}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const rangeData = range === 'today' ? data.today : range === 'week' ? data.week : data.month
  const m = data.month!

  const totalDeviceSessions = (data.devices ?? []).reduce((s, d) => s + d.sessions, 0)
  const trendData = (data.trend ?? []).map(r => ({ ...r, dateLabel: fmtDate(r.date) }))

  const metricLabels = { users: 'Users', sessions: 'Sessions', pageViews: 'Page Views' }

  return (
    <div className="p-6 space-y-6 min-h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <BarChart2 size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Google Analytics</h1>
            <p className="text-sm text-brand-gray">Powered by GA4 Data API</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Range picker */}
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {(['today', 'week', 'month'] as Range[]).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${range === r ? 'bg-primary text-white' : 'text-brand-gray hover:text-brand-dark'}`}>
                {r === 'today' ? 'Today' : r === 'week' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button onClick={load}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw size={16} className="text-brand-gray" />
          </button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Active Users" value={fmt(rangeData?.users ?? 0)} color="bg-primary" />
        <KpiCard icon={Eye} label="Page Views" value={fmt(rangeData?.pageViews ?? 0)} color="bg-neo-purple" />
        <KpiCard
          icon={Clock} label="Avg Session" color="bg-neo-orange"
          value={range === 'month' ? fmtDuration(m.avgDuration) : '—'}
          sub={range !== 'month' ? 'Available for 30d range' : undefined}
        />
        <KpiCard
          icon={TrendingDown} label="Bounce Rate" color="bg-brand-gray"
          value={range === 'month' ? `${m.bounceRate}%` : '—'}
          sub={range !== 'month' ? 'Available for 30d range' : undefined}
        />
      </div>

      {/* Secondary stats */}
      {range === 'month' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-brand-dark">{fmt(m.users)}</div>
            <div className="text-sm text-brand-gray mt-1">Total Users</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-brand-dark">{fmt(m.newUsers)}</div>
            <div className="text-sm text-brand-gray mt-1">New Users</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-brand-dark">{fmt(m.sessions)}</div>
            <div className="text-sm text-brand-gray mt-1">Sessions</div>
          </div>
        </div>
      )}

      {/* Trend chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-brand-dark">30-Day Trend</h2>
          <div className="flex gap-1">
            {(['users', 'sessions', 'pageViews'] as const).map(m => (
              <button key={m} onClick={() => setActiveMetric(m)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${activeMetric === m ? 'bg-primary text-white' : 'bg-gray-100 text-brand-gray hover:bg-gray-200'}`}>
                {metricLabels[m]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4236A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#D4236A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#6B7280' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(v: number | undefined) => [fmt(v ?? 0), metricLabels[activeMetric]] as [string, string]}
            />
            <Area type="monotone" dataKey={activeMetric} stroke="#D4236A" strokeWidth={2} fill="url(#gaGradient)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: top pages + sources + devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Pages */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <Globe size={16} className="text-primary" /> Top Pages
          </h2>
          <div className="space-y-2">
            {(data.topPages ?? []).map((p, i) => {
              const maxViews = data.topPages?.[0]?.views ?? 1
              const pct = Math.round((p.views / maxViews) * 100)
              return (
                <div key={p.path} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-dark truncate max-w-[180px]" title={p.path}>
                      <span className="text-brand-gray/50 text-xs mr-1">{i + 1}.</span>{p.path}
                    </span>
                    <span className="text-brand-gray font-medium tabular-nums">{fmt(p.views)}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {(!data.topPages || data.topPages.length === 0) && (
              <p className="text-sm text-brand-gray text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-brand-dark mb-4">Traffic Sources</h2>
          {(data.sources ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.sources} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis type="category" dataKey="channel" tick={{ fontSize: 11, fill: '#6B7280' }} width={90} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: number | undefined) => [fmt(v ?? 0), 'Sessions'] as [string, string]} />
                <Bar dataKey="sessions" radius={[0, 6, 6, 0]}>
                  {(data.sources ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-brand-gray text-center py-4">No data yet</p>
          )}
        </div>

        {/* Devices */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-brand-dark mb-4">Devices</h2>
          {(data.devices ?? []).length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.devices} dataKey="sessions" nameKey="device"
                    cx="50%" cy="50%" outerRadius={65} innerRadius={35}
                    paddingAngle={2}>
                    {(data.devices ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v: number | undefined) => [fmt(v ?? 0), 'Sessions'] as [string, string]} />
                  <Legend iconSize={8} formatter={(v) => <span className="text-xs text-brand-gray">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {(data.devices ?? []).map((d, i) => {
                  const pct = totalDeviceSessions ? Math.round((d.sessions / totalDeviceSessions) * 100) : 0
                  return (
                    <div key={d.device} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <DeviceIcon device={d.device} />
                        <span className="capitalize text-brand-dark">{d.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-brand-gray tabular-nums">{fmt(d.sessions)}</span>
                        <span className="text-xs text-brand-gray/60 tabular-nums w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-brand-gray text-center py-4">No data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
