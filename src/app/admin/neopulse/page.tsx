'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface UserRow {
  id: number
  name: string
  email: string
  neopulse_balance: number
  referral_code: string | null
  total_earned: string
  total_redeemed: string
  last_checkin: string | null
  avg_wellness: string | null
  checkin_streak: string
}

interface Stats {
  total_balance: string
  total_transactions: string
  active_today: string
}

export default function AdminNeoPulsePage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/neopulse')
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setStats(d.stats) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  function wellnessColor(score: string | null) {
    if (!score) return 'text-gray-400'
    const n = parseFloat(score)
    if (n >= 7) return 'text-green-600'
    if (n >= 5) return 'text-yellow-600'
    return 'text-red-500'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">NeoPulse Rewards</h1>
          <p className="text-sm text-brand-gray mt-0.5">Points balances and wellness data across all users</p>
        </div>
        <Link href="/admin" className="text-sm text-brand-gray hover:text-primary">← Back</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total NP Outstanding', value: stats?.total_balance ?? '…', color: '#D4236A' },
          { label: 'Users with NP', value: String(users.length), color: '#7B35A8' },
          { label: 'Actions Today', value: stats?.active_today ?? '…', color: '#E07B2A' },
          { label: 'Avg Balance', value: users.length ? Math.round(users.reduce((s, u) => s + u.neopulse_balance, 0) / users.length) + ' NP' : '—', color: '#22c55e' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-brand-gray uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-3xl font-black" style={{ color: s.color }}>{loading ? '…' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center">
          <h2 className="font-bold text-brand-dark flex-1">User Overview</h2>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary w-64"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-brand-gray">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-brand-gray">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-brand-gray uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-right px-4 py-3 font-semibold">Balance</th>
                  <th className="text-right px-4 py-3 font-semibold">Earned</th>
                  <th className="text-right px-4 py-3 font-semibold">Redeemed</th>
                  <th className="text-center px-4 py-3 font-semibold">7d Wellness</th>
                  <th className="text-center px-4 py-3 font-semibold">Check-ins</th>
                  <th className="text-left px-4 py-3 font-semibold">Last Check-in</th>
                  <th className="text-left px-4 py-3 font-semibold">Referral Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-dark">{u.name || '—'}</p>
                      <p className="text-xs text-brand-gray">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-primary">{u.neopulse_balance} NP</span>
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">+{u.total_earned}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">−{u.total_redeemed}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${wellnessColor(u.avg_wellness)}`}>
                        {u.avg_wellness ? `${u.avg_wellness}/10` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-brand-gray">{u.checkin_streak}</td>
                    <td className="px-4 py-3 text-brand-gray text-xs">
                      {u.last_checkin
                        ? new Date(u.last_checkin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-brand-dark">
                        {u.referral_code || '—'}
                      </span>
                    </td>
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
