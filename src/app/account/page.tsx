import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Sparkles, ShoppingBag, Calendar, Baby, Scale, Utensils, BarChart3, Droplets, ArrowRight, ChevronRight, Zap, Star, Lock } from 'lucide-react'
import AccountPeriodWidget from './AccountPeriodWidget'

export const metadata = { title: 'My Dashboard' }

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id
  const userIdNum = Number(userId)

  const [latestScore, recentOrders, npData, todayCheckin, wellnessStreak, totalCheckinsRow, healthProfile] = await Promise.all([
    queryOne<{ hormone_score: number; stress_score: number; energy_score: number; created_at: string }>(
      'SELECT hormone_score, stress_score, energy_score, created_at FROM wellness_scores WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    ).catch(() => null),
    query<{ id: number; order_number: string; total: number; status: string; created_at: string }>(
      'SELECT id, order_number, total, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3',
      [userId]
    ).catch(() => []),
    queryOne<{ neopulse_balance: number; referral_code: string | null }>(
      'SELECT neopulse_balance, referral_code FROM users WHERE id = $1',
      [userId]
    ).catch(() => null),
    queryOne<{ wellness_score: string; sleep_score: number; energy_score: number; stress_level: number }>(
      'SELECT wellness_score, sleep_score, energy_score, stress_level FROM wellness_checkins WHERE user_id = $1 AND check_in_date = CURRENT_DATE',
      [String(userId)]
    ).catch(() => null),
    queryOne<{ cnt: string }>(
      "SELECT COUNT(*)::text AS cnt FROM wellness_checkins WHERE user_id = $1 AND check_in_date >= CURRENT_DATE - INTERVAL '7 days'",
      [String(userId)]
    ).catch(() => null),
    queryOne<{ cnt: string }>(
      'SELECT COUNT(*)::text AS cnt FROM wellness_checkins WHERE user_id = $1',
      [String(userId)]
    ).catch(() => null),
    queryOne<{ height_cm: number | null; weight_kg: number | null }>(
      'SELECT height_cm, weight_kg FROM user_health_profiles WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [userIdNum]
    ).catch(() => null),
  ])

  const npBalance = npData?.neopulse_balance ?? 0
  const checkedInToday = !!todayCheckin
  const streakDays = parseInt(wellnessStreak?.cnt ?? '0')
  const totalCheckins = parseInt(totalCheckinsRow?.cnt ?? '0')
  const twinUnlocked = totalCheckins >= 30
  const hasHealthProfile = !!(healthProfile?.height_cm || healthProfile?.weight_kg)

  // Compute overall wellness score (avg of available scores)
  const scores: number[] = []
  if (latestScore?.hormone_score) scores.push(latestScore.hormone_score)
  if (latestScore?.stress_score) scores.push(latestScore.stress_score)
  if (latestScore?.energy_score) scores.push(latestScore.energy_score)
  const overallScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  const tools = [
    { href: '/tools/due-date', icon: Calendar, title: 'Due Date Calculator', color: 'primary' },
    { href: '/tools/vaccination', icon: Baby, title: 'Vaccination Schedule', color: 'neo-orange' },
    { href: '/tools/growth-chart', icon: BarChart3, title: 'Baby Growth Chart', color: 'neo-purple' },
    { href: '/tools/weight-gain', icon: Scale, title: 'Weight Gain Calculator', color: 'primary' },
    { href: '/tools/baby-food', icon: Utensils, title: 'Baby Food Chart', color: 'neo-orange' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-lg">
            {session.user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Hello, {session.user.name?.split(' ')[0]}!</h1>
            <p className="text-brand-gray text-xs">Your AI Wellness Dashboard</p>
          </div>
        </div>
      </div>

      {/* Health profile completion banner — shown until height/weight is entered */}
      {!hasHealthProfile && (
        <div className="mb-5 bg-gradient-to-r from-primary/10 via-purple-50 to-pink-50 border border-primary/20 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-dark">Complete your health profile</p>
              <p className="text-xs text-brand-gray mt-0.5">Add your height, weight &amp; cycle data for personalised wellness insights</p>
            </div>
          </div>
          <Link href="/onboarding"
            className="flex-shrink-0 flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors">
            Set up <ArrowRight size={12} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── WELLNESS DASHBOARD CARD ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <h2 className="font-bold text-brand-dark">Your Wellness Dashboard</h2>
              {latestScore && (
                <span className="text-xs text-brand-gray">{formatDate(latestScore.created_at)}</span>
              )}
            </div>

            {latestScore ? (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Circular gauge */}
                  <div className="flex flex-col items-center">
                    <p className="text-xs font-semibold text-brand-gray mb-3">Wellness Score</p>
                    <CircleGauge score={overallScore ?? 0} />
                  </div>

                  {/* Score cards */}
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                    {latestScore.energy_score > 0 && (
                      <ScoreCard label="Energy Score" score={latestScore.energy_score} />
                    )}
                    {latestScore.stress_score > 0 && (
                      <ScoreCard label="Stress Level" score={latestScore.stress_score} isStress />
                    )}
                    {latestScore.hormone_score > 0 && (
                      <ScoreCard label="Hormone Balance" score={latestScore.hormone_score} />
                    )}
                    {scores.length === 1 && (
                      <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center items-center text-center border border-gray-100">
                        <p className="text-xs text-brand-gray mb-1">More scores</p>
                        <p className="text-xs text-primary font-medium">Take full quiz →</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs text-brand-gray">
                    Based on your last wellness check-in
                  </p>
                  <Link href="/?quiz=1" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Retake Quiz <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ) : (
              /* No quiz taken yet */
              <div className="px-6 pb-6 pt-4">
                <div className="bg-gradient-to-br from-primary-light to-purple-50 rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Sparkles size={28} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-brand-dark text-lg mb-2">Discover Your Wellness Score</h3>
                  <p className="text-brand-gray text-sm mb-5 max-w-sm mx-auto">
                    Take a quick 2-minute AI check-in to see your Sleep, Energy, Stress and Hormone scores — personalised just for you.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Sleep Score', icon: '😴' },
                      { label: 'Energy Score', icon: '⚡' },
                      { label: 'Stress Level', icon: '🧘' },
                      { label: 'Hormone Balance', icon: '🌸' },
                    ].map((m) => (
                      <div key={m.label} className="bg-white/70 rounded-xl p-3 text-center backdrop-blur-sm">
                        <p className="text-xl mb-1">{m.icon}</p>
                        <p className="text-xs font-medium text-brand-dark">{m.label}</p>
                        <p className="text-xs text-brand-gray mt-0.5">—</p>
                      </div>
                    ))}
                  </div>
                  <Link href="/?quiz=1"
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors text-sm shadow-lg shadow-primary/20">
                    <Sparkles size={15} /> Start AI Wellness Check-in
                  </Link>
                  <p className="text-xs text-brand-gray mt-3">Takes 2 minutes · Free · No credit card</p>
                </div>
              </div>
            )}
          </div>

          {/* ── PERIOD TRACKER ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-dark flex items-center gap-2">
                <Droplets size={17} className="text-primary" /> Period Tracker
              </h2>
              <Link href="/account/period-calendar" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                Full view <ArrowRight size={12} />
              </Link>
            </div>
            <AccountPeriodWidget />
          </div>

          {/* ── RECENT ORDERS ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-dark flex items-center gap-2">
                <ShoppingBag size={17} className="text-primary" /> Recent Orders
              </h2>
              <Link href="/account/orders" className="text-xs text-primary hover:underline font-medium">View all</Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-brand-dark">{order.order_number}</p>
                      <p className="text-xs text-brand-gray">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-brand-dark">₹{order.total}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-brand-gray">
                <ShoppingBag size={28} className="mx-auto opacity-30 mb-2" />
                <p className="text-sm mb-2">No orders yet</p>
                <Link href="/shop" className="text-primary text-xs font-medium hover:underline">Start Shopping →</Link>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">

          {/* ── NEOPULSE CARD ── */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-pink-100">
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-[#D4236A] via-[#9B2D8B] to-[#7B35A8] px-5 pt-5 pb-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Zap size={15} className="text-yellow-300" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">NeoPulse</span>
                </div>
                {checkedInToday && (
                  <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-medium">✓ Checked in</span>
                )}
              </div>
              <p className="text-4xl font-black leading-none">{npBalance}</p>
              <p className="text-sm opacity-70 mt-0.5">Points Balance</p>
              {npBalance >= 100 && (
                <p className="text-xs mt-2 bg-white/15 rounded-lg px-3 py-1.5 inline-block">
                  🎁 Redeem {Math.floor(npBalance / 100) * 100} NP → ₹{Math.floor(npBalance / 100) * 10} off your next order
                </p>
              )}
            </div>

            {/* Body */}
            <div className="bg-white px-5 py-4 space-y-3">
              {/* 7-day streak */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-gray">7-day check-ins</span>
                <div className="flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${i < streakDays ? 'bg-primary' : 'bg-gray-100'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Today's wellness score if checked in */}
              {checkedInToday && todayCheckin && (
                <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base">🌙</p>
                    <p className="text-xs font-bold text-brand-dark">{todayCheckin.sleep_score}/10</p>
                    <p className="text-xs text-brand-gray">Sleep</p>
                  </div>
                  <div>
                    <p className="text-base">⚡</p>
                    <p className="text-xs font-bold text-brand-dark">{todayCheckin.energy_score}/10</p>
                    <p className="text-xs text-brand-gray">Energy</p>
                  </div>
                  <div>
                    <p className="text-base">🧘</p>
                    <p className="text-xs font-bold text-brand-dark">{todayCheckin.stress_level}/10</p>
                    <p className="text-xs text-brand-gray">Stress</p>
                  </div>
                </div>
              )}

              {/* CTA */}
              {!checkedInToday ? (
                <Link href="/neopulse"
                  className="flex items-center justify-center gap-2 w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
                  <Zap size={14} /> Check In — Earn 10 NP
                </Link>
              ) : (
                <Link href="/neopulse"
                  className="flex items-center justify-center gap-2 w-full border border-primary text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
                  View NeoPulse Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* ── NEO TWIN TEASER ── */}
          <div className={`rounded-2xl overflow-hidden shadow-sm border ${twinUnlocked ? 'border-yellow-200' : 'border-purple-100'}`}>
            {twinUnlocked ? (
              /* Unlocked state */
              <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 px-5 py-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={16} className="text-white" fill="white" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-90">Neo Twin</span>
                </div>
                <p className="font-bold text-lg leading-tight">Your AI Twin is Ready!</p>
                <p className="text-xs opacity-80 mt-1 mb-4">
                  {totalCheckins} check-ins completed — your personalised wellness insights await.
                </p>
                <Link href="/neo-twin"
                  className="flex items-center justify-center gap-2 w-full bg-white text-orange-600 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-50 transition-colors">
                  Open Neo Twin Dashboard <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              /* Locked state — motivational teaser */
              <div className="bg-gradient-to-br from-[#2D1B69] via-[#4A2086] to-[#1E1040] px-5 pt-5 pb-5 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Lock size={13} className="text-purple-300" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Neo Twin</span>
                  </div>
                  <span className="text-xs bg-white/15 rounded-full px-2 py-0.5 font-medium text-purple-200">
                    {totalCheckins}/30
                  </span>
                </div>

                <p className="font-bold text-base leading-snug">Something special is waiting for you...</p>
                <p className="text-xs text-purple-200 mt-1.5 leading-relaxed">
                  Check in daily and unlock your personal AI Wellness Twin — body pattern analysis, monthly wellness letters, and insights built just for you.
                </p>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-purple-300 mb-1.5">
                    <span>{totalCheckins} check-ins done</span>
                    <span>{30 - totalCheckins} to go</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (totalCheckins / 30) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Dots preview */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < totalCheckins ? 'bg-pink-400' : 'bg-white/10'}`}
                    />
                  ))}
                </div>

                <Link href="/neopulse"
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-white/15 hover:bg-white/25 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors border border-white/10">
                  <Zap size={12} /> Check In Today — Keep the streak alive
                </Link>
              </div>
            )}
          </div>

          {/* ── WELLNESS TOOLS ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-brand-dark mb-4 text-sm uppercase tracking-wide text-brand-gray">Wellness Tools</h2>
            <div className="space-y-1.5">
              {tools.map((tool) => {
                const Icon = tool.icon
                const colors: Record<string, string> = {
                  primary: 'bg-primary-light text-primary',
                  'neo-orange': 'bg-neo-orange-light text-neo-orange',
                  'neo-purple': 'bg-neo-purple-light text-neo-purple',
                }
                return (
                  <Link key={tool.href} href={tool.href}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg ${colors[tool.color]} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={15} />
                    </div>
                    <span className="text-sm font-medium text-brand-dark group-hover:text-primary transition-colors">{tool.title}</span>
                    <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-primary transition-colors" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── SVG circular gauge ── */
function CircleGauge({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const { label, colorClass } = gaugeLabel(score)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor"
          className={colorClass}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-brand-dark leading-none">{score}</p>
        <p className="text-xs text-brand-gray">/100</p>
      </div>
      <p className={`absolute -bottom-5 text-xs font-semibold ${colorClass.replace('stroke-', 'text-')}`}>{label}</p>
    </div>
  )
}

function gaugeLabel(score: number): { label: string; colorClass: string } {
  if (score >= 75) return { label: 'Good', colorClass: 'stroke-green-500 text-green-500' }
  if (score >= 50) return { label: 'Average', colorClass: 'stroke-neo-orange text-neo-orange' }
  return { label: 'Needs Care', colorClass: 'stroke-primary text-primary' }
}

/* ── Score metric card ── */
function ScoreCard({ label, score, isStress = false }: { label: string; score: number; isStress?: boolean }) {
  const getColor = (s: number, stress: boolean) => {
    if (stress) {
      if (s <= 30) return { text: 'Low', color: 'text-green-600' }
      if (s <= 55) return { text: 'Moderate', color: 'text-neo-orange' }
      return { text: 'High', color: 'text-red-500' }
    }
    if (s >= 75) return { text: 'Good', color: 'text-green-600' }
    if (s >= 50) return { text: 'Average', color: 'text-neo-orange' }
    return { text: 'Low', color: 'text-red-500' }
  }

  const { text, color } = getColor(score, isStress)

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <p className="text-xs text-brand-gray mb-1">{label}</p>
      {isStress ? (
        <p className={`text-lg font-bold ${color}`}>{text}</p>
      ) : (
        <>
          <p className={`text-2xl font-bold ${color}`}>{score}</p>
          <p className={`text-xs font-semibold ${color} mt-0.5`}>{text}</p>
        </>
      )}
    </div>
  )
}
