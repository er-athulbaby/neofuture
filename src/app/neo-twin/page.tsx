'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Zap, Star, Heart, Activity, Moon, Droplets, Smile, Calendar,
  TrendingUp, TrendingDown, Minus, ChevronRight, Home, CheckSquare,
  Users, ShoppingBag, Gift, BarChart2, MessageCircle,
  Mail, X, Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NeoTwinData {
  unlocked: boolean
  total_checkins: number
  needed?: number
  name: string
  latest: {
    sleep_score: number; energy_score: number; stress_level: number
    hydration_score: number | null; mood_score: number | null; wellness_score: string
  } | null
  health: { height_cm: number | null; weight_kg: number | null; date_of_birth: string | null; last_period_date: string | null } | null
  cycle: { day: number | null; phase: string }
  np_balance: number
  streak: number
  cur: Record<string, number>
  prev: Record<string, number>
  timeline: Record<string, number | null>
  neo_twin_message: string
  insights: string[]
  strengths: string[]
  opportunities: string[]
  forecast: { label: string; description: string; trend: 'up' | 'down' | 'stable' }
  monthly_story: string
  achievements: { label: string; icon: string; earned: boolean }[]
  history: { check_in_date: string; wellness_score: string }[]
}

const NAV_ITEMS = [
  { icon: Star, label: 'Neo Twin', href: '/neo-twin', active: true },
  { icon: Home, label: 'Today', href: '/account' },
  { icon: Calendar, label: 'Check-in History', href: '/neopulse' },
  { icon: CheckSquare, label: 'Check-in', href: '/neopulse' },
  { icon: BarChart2, label: 'Dashboard', href: '/account' },
  { icon: Users, label: 'Community', href: '/#community' },
  { icon: ShoppingBag, label: 'Products', href: '/shop' },
  { icon: Gift, label: 'Rewards', href: '/neopulse' },
]

function ScoreCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function PctBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-xs text-gray-400">—</span>
  if (pct > 0) return <span className="flex items-center gap-0.5 text-xs text-green-600 font-semibold"><TrendingUp size={11} />↑ {pct}%</span>
  if (pct < 0) return <span className="flex items-center gap-0.5 text-xs text-red-500 font-semibold"><TrendingDown size={11} />↓ {Math.abs(pct)}%</span>
  return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus size={11} /> 0%</span>
}

function WellnessCircle({ score }: { score: number }) {
  const pct = Math.min(score / 10, 1)
  const r = 46
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const color = score >= 8 ? '#22c55e' : score >= 6 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 60 60)" />
      </svg>
      <div className="absolute text-center">
        <p className="text-xs text-gray-500 font-medium">Wellness</p>
        <p className="text-3xl font-black text-gray-900 leading-none">{score}</p>
        <p className="text-xs text-gray-400">Score</p>
      </div>
    </div>
  )
}

export default function NeoTwinPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<NeoTwinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    fetch('/api/neo-twin')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF5F0] to-[#F5F0FF]">
        <div className="w-10 h-10 border-4 border-[#D4236A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  // Locked state
  if (!data.unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-[#FDF0FF] to-[#F0F5FF] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4236A] to-[#7B35A8] flex items-center justify-center mx-auto mb-5">
            <Star size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Neo Twin</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Your personal AI wellness twin unlocks after <strong>30 check-ins</strong>. It learns your patterns and gives you personalised insights.
          </p>

          {/* Progress ring */}
          <div className="relative flex items-center justify-center mb-6">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="56" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <circle cx="70" cy="70" r="56" fill="none" stroke="#D4236A" strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 56 * (data.total_checkins / 30)} ${2 * Math.PI * 56}`}
                strokeLinecap="round" transform="rotate(-90 70 70)" />
            </svg>
            <div className="absolute text-center">
              <p className="text-4xl font-black text-gray-900">{data.total_checkins}</p>
              <p className="text-sm text-gray-400">/ 30</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            {data.needed} more check-in{data.needed !== 1 ? 's' : ''} to unlock Neo Twin
          </p>

          <Link href="/neopulse"
            className="w-full block text-center bg-gradient-to-r from-[#D4236A] to-[#7B35A8] text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity">
            Go to Check-in &rarr;
          </Link>
        </div>
      </div>
    )
  }

  const wellnessScore = data.latest ? Math.round(parseFloat(data.latest.wellness_score) * 10) / 10 : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const Sidebar = ({ mobile = false }) => (
    <div className={cn(
      'flex flex-col h-full bg-white',
      mobile ? '' : 'border-r border-gray-100'
    )}>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4236A] to-[#7B35A8] flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <div>
            <span className="font-bold text-sm text-gray-900">neofuture</span>
            <p className="text-[10px] text-gray-400 leading-none">WOMEN WELLNESS ECOSYSTEM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link key={item.label} href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              item.active ? 'bg-orange-50 text-[#D4236A]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}>
            <item.icon size={16} className={item.active ? 'text-[#D4236A]' : 'text-gray-400'} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* NP card */}
      <div className="mx-4 mb-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 border border-red-100">
        <div className="flex items-center gap-1.5 mb-1">
          <Heart size={14} className="text-[#D4236A]" />
          <span className="text-xs font-semibold text-gray-700">Neo Pulse Points</span>
        </div>
        <p className="text-2xl font-black text-gray-900">{data.np_balance.toLocaleString()}</p>
        <p className="text-xs text-gray-500">= &#8377;{Math.floor(data.np_balance / 100) * 10}</p>
        <Link href="/neopulse" className="mt-2 block text-center text-xs bg-white border border-red-200 text-[#D4236A] py-1.5 rounded-lg font-semibold hover:bg-red-50 transition-colors">
          View Rewards &rarr;
        </Link>
      </div>

      {/* Streak */}
      <div className="mx-4 mb-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-base">&#128293;</span>
          <span className="text-xs font-semibold text-gray-700">{data.total_checkins} Day Streak</span>
        </div>
        <p className="text-2xl font-black text-[#E07B2A]">{data.total_checkins}</p>
        <p className="text-xs text-gray-500">Great going, {data.name}!</p>
      </div>

      {/* Quote */}
      <div className="mx-4 mb-5 text-center">
        <p className="text-xs text-gray-400 italic">&quot;Small daily choices create big changes.&quot;</p>
        <Heart size={12} className="text-[#D4236A] mx-auto mt-1" />
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#FAF8FF] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-56 xl:w-64 flex-col flex-shrink-0 h-full overflow-y-auto">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <span className="font-bold text-gray-900">Menu</span>
              <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <Sidebar mobile />
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 flex items-center gap-2">
                Neo Twin
                <span className="text-xs bg-gradient-to-r from-[#D4236A] to-[#7B35A8] text-white px-2 py-0.5 rounded-full font-bold">AI</span>
              </h1>
              <p className="text-xs text-gray-400">Your AI Wellness Twin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-500">Hello, {data.name}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4236A] to-[#7B35A8] flex items-center justify-center">
              <span className="text-white font-bold text-sm">{data.name.charAt(0)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5 pb-24 lg:pb-6">

          {/* Hero banner */}
          <div className="bg-gradient-to-br from-[#FFF5F0] to-[#F5F0FF] rounded-3xl p-5 border border-orange-100 flex flex-col sm:flex-row gap-5">
            {/* Left: greeting + wellness circle */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{greeting}, {data.name}! &#127800;</h2>
              <p className="text-sm text-gray-500 mb-4">Here&apos;s how your body &amp; mind are doing today.</p>
              {data.latest ? (
                <WellnessCircle score={wellnessScore} />
              ) : (
                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100">
                  <span className="text-2xl">&#128203;</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">No check-in today</p>
                    <Link href="/neopulse" className="text-xs text-[#D4236A] font-medium">Check in now &rarr;</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Center: avatar placeholder */}
            <div className="hidden md:flex flex-col items-center justify-center">
              <div className="w-28 h-32 bg-gradient-to-b from-[#D4236A]/20 to-[#7B35A8]/20 rounded-2xl flex items-center justify-center border-2 border-[#D4236A]/20">
                <div className="text-center">
                  <span className="text-4xl">&#129720;</span>
                  <p className="text-xs text-gray-400 mt-1">Neo Twin</p>
                </div>
              </div>
            </div>

            {/* Right: Neo Twin says */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-[#7B35A8]" />
                  <span className="text-sm font-bold text-gray-900">Neo Twin says</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{data.neo_twin_message}</p>
                <Link href="/neopulse"
                  className="mt-3 flex items-center gap-1 text-sm text-[#7B35A8] font-semibold hover:opacity-80">
                  <MessageCircle size={14} /> Chat with Neo Twin <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* 6 metric cards */}
          {data.latest && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <ScoreCard icon={<Zap size={16} />} label="Energy" value={data.latest.energy_score}
                sub={data.latest.energy_score >= 8 ? 'Excellent' : data.latest.energy_score >= 6 ? 'Good' : 'Needs work'}
                color="#D4236A" />
              <ScoreCard icon={<Moon size={16} />} label="Sleep" value={data.latest.sleep_score}
                sub={data.latest.sleep_score >= 8 ? 'Excellent' : data.latest.sleep_score >= 6 ? 'Good' : 'Needs work'}
                color="#7B35A8" />
              <ScoreCard icon={<Droplets size={16} />} label="Hydration"
                value={data.latest.hydration_score ?? '—'}
                sub={data.latest.hydration_score ? (data.latest.hydration_score >= 7 ? 'Well hydrated' : data.latest.hydration_score >= 5 ? 'Average' : 'Needs work') : 'Not tracked'}
                color="#0ea5e9" />
              <ScoreCard icon={<Activity size={16} />} label="Stress" value={data.latest.stress_level}
                sub={data.latest.stress_level <= 3 ? 'Very calm' : data.latest.stress_level <= 5 ? 'Manageable' : data.latest.stress_level <= 7 ? 'High' : 'Very high'}
                color="#E07B2A" />
              <ScoreCard icon={<Smile size={16} />} label="Mood"
                value={data.latest.mood_score ?? '—'}
                sub={data.latest.mood_score ? (data.latest.mood_score >= 8 ? 'Great' : data.latest.mood_score >= 6 ? 'Good' : 'Low') : 'Not tracked'}
                color="#ec4899" />
              <ScoreCard
                icon={<Calendar size={16} />}
                label="Cycle Day"
                value={data.cycle.day ?? '—'}
                sub={data.cycle.phase}
                color="#8b5cf6"
              />
            </div>
          )}

          {/* Row 3: Insights, Strengths/Opportunities, Forecast */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Body Pattern Insights */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>&#129513;</span> Body Pattern Insights
              </h3>
              {data.insights.length > 0 ? (
                <div className="space-y-3">
                  {data.insights.map((ins, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-base flex-shrink-0">{i === 0 ? '❤️' : i === 1 ? '🌙' : '🌿'}</span>
                      <p className="text-sm text-gray-600 leading-relaxed">{ins}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Keep checking in daily — patterns emerge after 7+ entries.</p>
              )}
              <button className="mt-4 text-xs text-[#7B35A8] font-semibold flex items-center gap-1 hover:opacity-80">
                View all insights <ChevronRight size={12} />
              </button>
            </div>

            {/* Strengths + Opportunities */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span>🌿</span> Wellness Strengths</h3>
                <div className="space-y-2">
                  {data.strengths.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-xs">&#10003;</span>
                      </span>
                      <span className="text-sm text-gray-700">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span>&#11088;</span> Growth Opportunities</h3>
                <div className="space-y-2">
                  {data.opportunities.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Forecast */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>&#128302;</span> AI Forecast
              </h3>
              <div className={cn(
                'rounded-xl p-3 mb-3',
                data.forecast.trend === 'up' ? 'bg-green-50' : data.forecast.trend === 'down' ? 'bg-orange-50' : 'bg-purple-50'
              )}>
                <p className={cn(
                  'text-sm font-bold mb-1',
                  data.forecast.trend === 'up' ? 'text-green-700' : data.forecast.trend === 'down' ? 'text-orange-700' : 'text-purple-700'
                )}>
                  {data.forecast.label}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">{data.forecast.description}</p>
              </div>
              {/* Mini trend chart */}
              {data.history.length >= 3 && (
                <div className="flex items-end gap-1 h-16">
                  {data.history.slice(-14).map((d, i) => {
                    const s = parseFloat(d.wellness_score)
                    const color = s >= 7 ? '#22c55e' : s >= 5 ? '#f59e0b' : '#ef4444'
                    return (
                      <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${(s / 10) * 100}%`, backgroundColor: color + '80', minHeight: 4 }} />
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Timeline, Monthly Story, Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Wellness Timeline */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><TrendingUp size={16} className="text-[#7B35A8]" /> Wellness Timeline</h3>
                <span className="text-xs text-gray-400">vs 30 days ago</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Energy', icon: '⚡', val: data.cur.energy, pct: data.timeline.energy, color: '#D4236A' },
                  { label: 'Sleep', icon: '🌙', val: data.cur.sleep, pct: data.timeline.sleep, color: '#7B35A8' },
                  { label: 'Mood', icon: '😊', val: data.cur.mood, pct: data.timeline.mood, color: '#ec4899' },
                  { label: 'Hydration', icon: '💧', val: data.cur.hydration, pct: data.timeline.hydration, color: '#0ea5e9' },
                  { label: 'Stress Mgmt', icon: '🌿', val: 11 - data.cur.stress, pct: data.timeline.stress, color: '#22c55e' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="text-base w-5">{m.icon}</span>
                    <span className="text-sm text-gray-700 w-20 flex-shrink-0">{m.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(m.val / 10) * 100}%`, backgroundColor: m.color }} />
                    </div>
                    <PctBadge pct={m.pct ?? null} />
                  </div>
                ))}
              </div>
              <button className="mt-4 text-xs text-[#7B35A8] font-semibold flex items-center gap-1 hover:opacity-80">
                View full timeline <ChevronRight size={12} />
              </button>
            </div>

            {/* This Month's Story */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>&#128214;</span> This Month&apos;s Story
              </h3>
              <div className="flex-1 bg-[#FFF5F0] rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line line-clamp-6">{data.monthly_story}</p>
              </div>
              <button className="mt-3 text-xs text-[#7B35A8] font-semibold flex items-center gap-1 hover:opacity-80">
                Read full report <ChevronRight size={12} />
              </button>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>&#127942;</span> Achievements
              </h3>
              <div className="space-y-2.5">
                {data.achievements.map((a, i) => (
                  <div key={i} className={cn('flex items-center gap-3 p-2 rounded-xl', a.earned ? 'bg-orange-50' : 'opacity-40')}>
                    <span className="text-xl">{a.icon}</span>
                    <span className={cn('text-sm font-medium', a.earned ? 'text-gray-900' : 'text-gray-500')}>{a.label}</span>
                    {a.earned && <span className="ml-auto text-xs text-green-600 font-bold">&#10003;</span>}
                  </div>
                ))}
              </div>
              <button className="mt-4 text-xs text-[#7B35A8] font-semibold flex items-center gap-1 hover:opacity-80">
                View all badges <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Monthly Wellness Letter */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Mail size={16} className="text-[#D4236A]" /> Monthly Wellness Letter
            </h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line line-clamp-8">{data.monthly_story}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-16 h-20 bg-gradient-to-b from-[#FFF5F0] to-[#FFE0F0] rounded-xl border border-pink-100 flex items-center justify-center">
                  <Heart size={24} className="text-[#D4236A]" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-4 py-2 z-10">
          {[
            { icon: Home, label: 'Home', href: '/' },
            { icon: CheckSquare, label: 'Check-in', href: '/neopulse' },
            { icon: Star, label: '', href: '/neo-twin', center: true },
            { icon: Users, label: 'Community', href: '/#community' },
            { icon: Activity, label: 'Profile', href: '/account' },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5',
                item.center
                  ? 'w-12 h-12 rounded-full bg-gradient-to-br from-[#D4236A] to-[#7B35A8] flex items-center justify-center shadow-lg -mt-4'
                  : 'text-gray-400 hover:text-gray-700'
              )}>
              <item.icon size={item.center ? 22 : 20} className={item.center ? 'text-white' : ''} />
              {!item.center && <span className="text-[10px]">{item.label}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
