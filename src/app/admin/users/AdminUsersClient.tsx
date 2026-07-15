'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { Users, ShieldCheck, ShieldOff, Trash2, Search, RefreshCw, Heart, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface User {
  id: string; name: string; email: string; is_admin: boolean
  created_at: string; order_count: number
}

interface HealthUser {
  id: string; name: string; email: string
  health_data_consent: boolean; health_data_consent_at: string | null
  onboarding_done: boolean
  height_cm: number | null; weight_kg: number | null; date_of_birth: string | null
  checkin_count: string; last_checkin: string | null; avg_wellness: string | null
}

interface WellnessCheckin {
  check_in_date: string; sleep_score: number; energy_score: number; stress_level: number; wellness_score: number
}

interface HealthProfile {
  height_cm: number | null; weight_kg: number | null; date_of_birth: string | null; updated_at: string
}

export default function AdminUsersClient({ currentUserId }: { currentUserId: string }) {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'admin' | 'users' | 'health'>('all')

  // Health tab state
  const [healthUsers, setHealthUsers] = useState<HealthUser[]>([])
  const [healthLoading, setHealthLoading] = useState(false)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [expandedData, setExpandedData] = useState<{ checkins: WellnessCheckin[]; profile: HealthProfile | null } | null>(null)
  const [expandedLoading, setExpandedLoading] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }

  async function loadHealth() {
    setHealthLoading(true)
    const res = await fetch('/api/admin/health')
    const data = await res.json()
    setHealthUsers(data.users ?? [])
    setHealthLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (tab === 'health' && healthUsers.length === 0) loadHealth()
  }, [tab])

  async function expandUser(userId: string) {
    if (expandedUser === userId) { setExpandedUser(null); return }
    setExpandedUser(userId)
    setExpandedLoading(true)
    const res = await fetch(`/api/admin/health?user_id=${userId}`)
    const data = await res.json()
    setExpandedData({ checkins: data.checkins ?? [], profile: data.profile ?? null })
    setExpandedLoading(false)
  }

  async function toggleAdmin(user: User) {
    const action = user.is_admin ? 'remove admin from' : 'make admin'
    if (!confirm(`Are you sure you want to ${action} ${user.email}?`)) return
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, is_admin: !user.is_admin }),
    })
    if (res.ok) {
      toast(user.is_admin ? 'Admin removed' : 'Admin granted')
      setUsers((u) => u.map((x) => x.id === user.id ? { ...x, is_admin: !x.is_admin } : x))
    } else toast('Failed', 'error')
  }

  async function deleteUser(user: User) {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    })
    if (res.ok) {
      toast('User deleted')
      setUsers((u) => u.filter((x) => x.id !== user.id))
    } else {
      const d = await res.json()
      toast(d.error ?? 'Failed', 'error')
    }
  }

  const filtered = users.filter((u) => {
    const matchTab = tab === 'all' || tab === 'health' || (tab === 'admin' ? u.is_admin : !u.is_admin)
    const q = search.toLowerCase()
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const adminCount = users.filter((u) => u.is_admin).length
  const userCount = users.filter((u) => !u.is_admin).length

  const filteredHealth = healthUsers.filter((u) => {
    const q = search.toLowerCase()
    return !q || u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  function calcAge(dob: string | null): string {
    if (!dob) return '—'
    const birth = new Date(dob)
    const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000))
    return `${age} yrs`
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-brand-dark flex items-center gap-2">
          <Users size={20} className="text-primary" /> User Management
        </h1>
        <button onClick={tab === 'health' ? loadHealth : load} className="flex items-center gap-1.5 text-sm text-brand-gray hover:text-primary transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-brand-dark">{users.length}</p>
          <p className="text-xs text-brand-gray mt-0.5">Total Users</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-neo-orange">{adminCount}</p>
          <p className="text-xs text-brand-gray mt-0.5">Admins</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{userCount}</p>
          <p className="text-xs text-brand-gray mt-0.5">Regular Users</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
          {(['all', 'admin', 'users', 'health'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white text-brand-dark shadow-sm' : 'text-brand-gray hover:text-brand-dark'}`}>
              {t === 'all' ? `All (${users.length})`
                : t === 'admin' ? `Admins (${adminCount})`
                : t === 'users' ? `Users (${userCount})`
                : <span className="flex items-center gap-1"><Heart size={12} /> Health Data</span>}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
      </div>

      {tab === 'health' ? (
        /* ── Health & Wellness tab ── */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {healthLoading ? (
            <div className="text-center py-12 text-brand-gray">Loading health data...</div>
          ) : filteredHealth.length === 0 ? (
            <div className="text-center py-12 text-brand-gray">No health data found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-gray uppercase">User</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Consent</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Height</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Weight</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Age</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Check-ins</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Avg Wellness</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Last Check-in</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">History</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHealth.map((u) => (
                    <>
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-brand-dark">{u.name ?? '—'}</p>
                            <p className="text-xs text-brand-gray">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.health_data_consent
                            ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle size={13} /> Yes</span>
                            : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><XCircle size={13} /> No</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-brand-gray">{u.height_cm ? `${u.height_cm} cm` : '—'}</td>
                        <td className="px-4 py-3 text-center text-brand-gray">{u.weight_kg ? `${u.weight_kg} kg` : '—'}</td>
                        <td className="px-4 py-3 text-center text-brand-gray">{calcAge(u.date_of_birth)}</td>
                        <td className="px-4 py-3 text-center font-medium text-brand-dark">{u.checkin_count}</td>
                        <td className="px-4 py-3 text-center">
                          {u.avg_wellness
                            ? <span className="font-semibold text-primary">{u.avg_wellness}/10</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-brand-gray">
                          {u.last_checkin ? formatDate(u.last_checkin) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => expandUser(u.id)}
                            className="p-1.5 text-brand-gray hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            {expandedUser === u.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>
                      </tr>
                      {expandedUser === u.id && (
                        <tr key={`${u.id}-expand`} className="bg-gray-50">
                          <td colSpan={9} className="px-6 py-4">
                            {expandedLoading ? (
                              <p className="text-sm text-brand-gray">Loading...</p>
                            ) : expandedData ? (
                              <div>
                                {expandedData.checkins.length === 0 ? (
                                  <p className="text-sm text-brand-gray">No wellness check-ins yet.</p>
                                ) : (
                                  <div>
                                    <p className="text-xs font-semibold text-brand-gray uppercase mb-3">Recent Wellness History ({expandedData.checkins.length} entries)</p>
                                    <div className="overflow-x-auto">
                                      <table className="text-xs w-full">
                                        <thead>
                                          <tr className="text-brand-gray">
                                            <th className="pr-4 pb-2 text-left">Date</th>
                                            <th className="pr-4 pb-2 text-center">Sleep</th>
                                            <th className="pr-4 pb-2 text-center">Energy</th>
                                            <th className="pr-4 pb-2 text-center">Stress</th>
                                            <th className="pr-4 pb-2 text-center">Wellness</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {expandedData.checkins.slice(0, 30).map((c, i) => (
                                            <tr key={i} className="border-t border-gray-100">
                                              <td className="pr-4 py-1.5 text-brand-gray">{formatDate(c.check_in_date)}</td>
                                              <td className="pr-4 py-1.5 text-center">{c.sleep_score}/10</td>
                                              <td className="pr-4 py-1.5 text-center">{c.energy_score}/10</td>
                                              <td className="pr-4 py-1.5 text-center">{c.stress_level}/10</td>
                                              <td className="pr-4 py-1.5 text-center font-semibold text-primary">{Number(c.wellness_score).toFixed(1)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
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
          )}
        </div>
      ) : (
        /* ── Users / Admins / All tab ── */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-brand-gray">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-brand-gray">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-gray uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-gray uppercase">Joined</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Orders</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Role</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-gray uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${u.is_admin ? 'bg-neo-orange-light text-neo-orange' : 'bg-primary-light text-primary'}`}>
                            {u.name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="font-medium text-brand-dark">{u.name ?? '—'}</p>
                            <p className="text-xs text-brand-gray">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-brand-gray text-xs">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-center font-medium text-brand-dark">{u.order_count}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${u.is_admin ? 'bg-neo-orange-light text-neo-orange' : 'bg-gray-100 text-brand-gray'}`}>
                          {u.is_admin ? <><ShieldCheck size={11} /> Admin</> : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {u.id !== currentUserId && (
                            <>
                              <button onClick={() => toggleAdmin(u)}
                                title={u.is_admin ? 'Remove admin' : 'Make admin'}
                                className={`p-1.5 rounded-lg transition-colors ${u.is_admin ? 'text-neo-orange hover:bg-neo-orange-light' : 'text-brand-gray hover:bg-primary-light hover:text-primary'}`}>
                                {u.is_admin ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                              </button>
                              <button onClick={() => deleteUser(u)}
                                title="Delete user"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-red-50 transition-colors">
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                          {u.id === currentUserId && (
                            <span className="text-xs text-brand-gray italic">You</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
