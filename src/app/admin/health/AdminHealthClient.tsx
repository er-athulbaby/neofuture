'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, Heart, Activity, RefreshCw } from 'lucide-react'

interface HealthUser {
  id: string
  name: string
  email: string
  health_data_consent: boolean
  onboarding_done: boolean
  height_cm: number | null
  weight_kg: number | null
  date_of_birth: string | null
  checkin_count: string
  last_checkin: string | null
  avg_wellness: string | null
}

interface Checkin {
  check_in_date: string
  sleep_score: number
  energy_score: number
  stress_level: number
  wellness_score: number
}

interface UserDetail {
  checkins: Checkin[]
  profile: { height_cm: number | null; weight_kg: number | null; date_of_birth: string | null; updated_at: string } | null
}

function calcAge(dob: string | null): string {
  if (!dob) return '—'
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  return `${years} yrs`
}

function scoreColor(v: number, invert = false) {
  const n = invert ? 11 - v : v
  if (n >= 8) return 'text-green-600 font-semibold'
  if (n >= 6) return 'text-yellow-600 font-semibold'
  return 'text-red-500 font-semibold'
}

export default function AdminHealthClient() {
  const [users, setUsers] = useState<HealthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, UserDetail>>({})
  const [detailLoading, setDetailLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/health').then((r) => r.json()).catch(() => ({ users: [] }))
    setUsers(res.users ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleUser(id: string) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (details[id]) return
    setDetailLoading(id)
    const res = await fetch(`/api/admin/health?user_id=${id}`).then((r) => r.json()).catch(() => null)
    if (res) setDetails((d) => ({ ...d, [id]: res }))
    setDetailLoading(null)
  }

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <Heart size={22} className="text-primary" /> Health Data
          </h1>
          <p className="text-sm text-brand-gray mt-0.5">User health profiles and daily wellness check-in history</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-brand-gray hover:text-brand-dark border border-gray-200 rounded-xl px-3 py-2 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
      />

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-primary/10 text-primary rounded-xl px-4 py-2 text-sm font-semibold">{users.length} users</div>
        <div className="bg-green-100 text-green-700 rounded-xl px-4 py-2 text-sm font-semibold">
          {users.filter((u) => u.health_data_consent).length} consented
        </div>
        <div className="bg-blue-100 text-blue-700 rounded-xl px-4 py-2 text-sm font-semibold">
          {users.filter((u) => parseInt(u.checkin_count) > 0).length} checked in
        </div>
        <div className="bg-purple-100 text-purple-700 rounded-xl px-4 py-2 text-sm font-semibold">
          {users.filter((u) => u.height_cm || u.weight_kg).length} health profiles
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-brand-gray">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-gray">Consent</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-gray">Height</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-gray">Weight</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-gray">Age</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-gray">Check-ins</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-gray">Avg Wellness</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-gray">Last Check-in</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-brand-gray">No users found</td></tr>
                )}
                {filtered.map((u) => (
                  <>
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-dark">{u.name}</p>
                        <p className="text-xs text-brand-gray">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {u.health_data_consent ? (
                          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">Yes</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-brand-dark">{u.height_cm ? `${u.height_cm} cm` : '—'}</td>
                      <td className="px-4 py-3 text-brand-dark">{u.weight_kg ? `${u.weight_kg} kg` : '—'}</td>
                      <td className="px-4 py-3 text-brand-dark">{calcAge(u.date_of_birth)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${parseInt(u.checkin_count) >= 30 ? 'text-green-600' : parseInt(u.checkin_count) > 0 ? 'text-primary' : 'text-gray-400'}`}>
                          {u.checkin_count}
                          {parseInt(u.checkin_count) >= 30 && <span className="ml-1 text-xs">🔥</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.avg_wellness ? (
                          <span className={scoreColor(parseFloat(u.avg_wellness))}>{u.avg_wellness}/10</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-brand-gray text-xs">{u.last_checkin ?? '—'}</td>
                      <td className="px-4 py-3">
                        {parseInt(u.checkin_count) > 0 && (
                          <button
                            onClick={() => toggleUser(u.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-brand-gray"
                          >
                            {expanded === u.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expanded === u.id && (
                      <tr key={`${u.id}-detail`} className="bg-gray-50/80">
                        <td colSpan={9} className="px-6 py-4">
                          {detailLoading === u.id ? (
                            <div className="flex items-center gap-2 text-brand-gray text-sm py-2">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Loading history...
                            </div>
                          ) : details[u.id] ? (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide flex items-center gap-1.5">
                                <Activity size={13} /> Last 90 days — {details[u.id].checkins.length} check-ins
                              </p>
                              <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-xs">
                                  <thead className="bg-white border-b border-gray-100">
                                    <tr>
                                      <th className="text-left px-3 py-2 font-semibold text-brand-gray">Date</th>
                                      <th className="text-center px-3 py-2 font-semibold text-brand-gray">😴 Sleep</th>
                                      <th className="text-center px-3 py-2 font-semibold text-brand-gray">⚡ Energy</th>
                                      <th className="text-center px-3 py-2 font-semibold text-brand-gray">🧘 Stress</th>
                                      <th className="text-center px-3 py-2 font-semibold text-brand-gray">Wellness</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {details[u.id].checkins.map((c) => (
                                      <tr key={c.check_in_date} className="border-b border-gray-50 hover:bg-white/70">
                                        <td className="px-3 py-1.5 text-brand-gray">{c.check_in_date}</td>
                                        <td className={`px-3 py-1.5 text-center ${scoreColor(c.sleep_score)}`}>{c.sleep_score}/10</td>
                                        <td className={`px-3 py-1.5 text-center ${scoreColor(c.energy_score)}`}>{c.energy_score}/10</td>
                                        <td className={`px-3 py-1.5 text-center ${scoreColor(c.stress_level, true)}`}>{c.stress_level}/10</td>
                                        <td className={`px-3 py-1.5 text-center ${scoreColor(Number(c.wellness_score))}`}>{Number(c.wellness_score).toFixed(1)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
