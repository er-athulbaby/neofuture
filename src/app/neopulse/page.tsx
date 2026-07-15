'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface Transaction {
  id: number
  action: string
  points: number
  description: string
  created_at: string
}

interface WellnessDay {
  check_in_date: string
  sleep_score: number
  energy_score: number
  stress_level: number
  wellness_score: string
}

type CheckinStep = 'idle' | 'sleep' | 'energy' | 'stress' | 'hydration' | 'mood' | 'done'

const SLEEP_LABELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😩', label: 'Terrible' }, 2: { emoji: '😩', label: 'Very Poor' },
  3: { emoji: '😴', label: 'Poor' }, 4: { emoji: '😕', label: 'Below Average' },
  5: { emoji: '😐', label: 'Average' }, 6: { emoji: '🙂', label: 'Fair' },
  7: { emoji: '😊', label: 'Good' }, 8: { emoji: '😌', label: 'Great' },
  9: { emoji: '🌙', label: 'Excellent' }, 10: { emoji: '⭐', label: 'Perfect' },
}

const ENERGY_LABELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '🪫', label: 'Drained' }, 2: { emoji: '😔', label: 'Very Low' },
  3: { emoji: '😓', label: 'Low' }, 4: { emoji: '😐', label: 'Below Average' },
  5: { emoji: '🙂', label: 'Average' }, 6: { emoji: '😊', label: 'Moderate' },
  7: { emoji: '💪', label: 'Good' }, 8: { emoji: '⚡', label: 'High' },
  9: { emoji: '🔥', label: 'Very High' }, 10: { emoji: '🚀', label: 'Peak' },
}

const STRESS_LABELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😌', label: 'Very Calm' }, 2: { emoji: '🧘', label: 'Calm' },
  3: { emoji: '🙂', label: 'Relaxed' }, 4: { emoji: '😊', label: 'Mild' },
  5: { emoji: '😐', label: 'Moderate' }, 6: { emoji: '😤', label: 'Noticeable' },
  7: { emoji: '😰', label: 'High' }, 8: { emoji: '😟', label: 'Very High' },
  9: { emoji: '😱', label: 'Intense' }, 10: { emoji: '🤯', label: 'Overwhelming' },
}

const ACTION_ICONS: Record<string, string> = {
  daily_checkin: '🏃',
  referral: '🤝',
  first_purchase: '🛍️',
  product_review: '⭐',
  profile_complete: '👤',
  social_share: '📣',
  redemption: '🎁',
}

function ScoreSlider({ value, onChange, labelMap, color }: {
  value: number
  onChange: (v: number) => void
  labelMap: Record<number, { emoji: string; label: string }>
  color: string
}) {
  const info = labelMap[value]
  return (
    <div className="space-y-5">
      <div className="text-center">
        <span className="text-6xl">{info.emoji}</span>
        <p className="text-xl font-bold mt-2" style={{ color }}>{info.label}</p>
        <p className="text-4xl font-black text-gray-900 mt-1">{value}<span className="text-lg text-gray-400">/10</span></p>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  )
}

function WellnessChart({ history }: { history: WellnessDay[] }) {
  if (!history.length) return (
    <div className="text-center py-8 text-gray-400 text-sm">No data yet — start checking in daily!</div>
  )

  const max = 10
  const w = 100 / Math.max(history.length, 1)

  return (
    <div className="space-y-3">
      <div className="relative h-40 flex items-end gap-1">
        {history.map((d, i) => {
          const score = parseFloat(d.wellness_score)
          const heightPct = (score / max) * 100
          const color = score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444'
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
              <div
                className="w-full rounded-t-sm transition-all duration-300 cursor-pointer"
                style={{ height: `${heightPct}%`, backgroundColor: color, minHeight: 4 }}
              />
              <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                {new Date(d.check_in_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: {score}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{new Date(history[0].check_in_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span>30-day wellness trend</span>
        <span>{new Date(history[history.length - 1].check_in_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}

export default function NeoPulsePage() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState(0)
  const [referralCode, setReferralCode] = useState('')
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [history, setHistory] = useState<WellnessDay[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Checkin state
  const [step, setStep] = useState<CheckinStep>('idle')
  const [sleep, setSleep] = useState(7)
  const [energy, setEnergy] = useState(7)
  const [stress, setStress] = useState(4)
  const [hydration, setHydration] = useState(6)
  const [mood, setMood] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ wellness_score: number; np_awarded: number } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [balRes, histRes] = await Promise.all([
      fetch('/api/neopulse/balance').then((r) => r.json()).catch(() => ({})),
      fetch('/api/wellness/history').then((r) => r.json()).catch(() => ({ history: [] })),
    ])
    setBalance(balRes.balance ?? 0)
    setReferralCode(balRes.referral_code ?? '')
    setCheckedInToday(balRes.checked_in_today ?? false)
    setTransactions(balRes.transactions ?? [])
    setHistory(histRes.history ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { if (session) loadData() }, [session, loadData])

  async function submitCheckin() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/wellness/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sleep_score: sleep, energy_score: energy, stress_level: stress, hydration_score: hydration, mood_score: mood }),
      })
      const data = await res.json()
      setSubmitting(false)
      if (!res.ok) {
        alert(data.error || 'Failed to save check-in. Please try again.')
        return
      }
      setResult({ wellness_score: data.wellness_score, np_awarded: data.np_awarded })
      setStep('done')
      loadData()
    } catch (err) {
      setSubmitting(false)
      alert('Network error. Please check your connection and try again.')
    }
  }

  function copyReferral() {
    navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareOnSocial() {
    await fetch('/api/neopulse/earn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'social_share' }),
    })
    loadData()
  }

  const avgWellness = history.length
    ? (history.reduce((s, d) => s + parseFloat(d.wellness_score), 0) / history.length).toFixed(1)
    : null

  const latestWellness = history.length ? parseFloat(history[history.length - 1].wellness_score) : null

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-brand-dark mb-2">NeoPulse Rewards</h1>
          <p className="text-brand-gray mb-6">Sign in to earn points and track your wellness</p>
          <Link href="/login" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
            Sign In to Continue
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#D4236A] via-[#9B2D8B] to-[#7B35A8] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Your Rewards Balance</p>
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-6xl font-black">{loading ? '…' : balance}</span>
            <div className="text-left">
              <p className="text-2xl font-bold leading-tight">NP</p>
              <p className="text-xs opacity-70">NeoPulse</p>
            </div>
          </div>
          <p className="text-sm opacity-80 mb-6">
            {balance >= 100
              ? `Redeem ${Math.floor(balance / 100) * 100} NP for ₹${Math.floor(balance / 100) * 10} off your next order`
              : `Earn ${100 - (balance % 100)} more NP to unlock your first discount`}
          </p>
          {!checkedInToday && (
            <button
              onClick={() => setStep('sleep')}
              className="bg-white text-primary font-bold px-8 py-3 rounded-full hover:bg-primary-light transition-colors shadow-lg"
            >
              ⚡ Check In Today — Earn 10 NP
            </button>
          )}
          {checkedInToday && (
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-6 py-2.5 text-sm font-semibold">
              ✓ Checked in today
              {latestWellness && <span className="bg-white/30 rounded-full px-2 py-0.5 text-xs">Wellness: {latestWellness}/10</span>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Check-in modal */}
        {step !== 'idle' && step !== 'done' && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl">
              {/* Progress */}
              {(() => {
                const steps = ['sleep', 'energy', 'stress', 'hydration', 'mood'] as const
                const idx = steps.indexOf(step as typeof steps[number])
                return (
                  <div className="flex gap-2 mb-8">
                    {steps.map((s, i) => (
                      <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
                        s === step ? 'bg-primary' : i < idx ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                )
              })()}

              {step === 'sleep' && (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">How did you sleep?</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">Rate last night's sleep quality</p>
                  <ScoreSlider value={sleep} onChange={setSleep} labelMap={SLEEP_LABELS} color="#7B35A8" />
                  <button onClick={() => setStep('energy')} className="mt-8 w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
                    Next →
                  </button>
                </>
              )}

              {step === 'energy' && (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">Energy level today?</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">How energetic do you feel right now?</p>
                  <ScoreSlider value={energy} onChange={setEnergy} labelMap={ENERGY_LABELS} color="#D4236A" />
                  <div className="flex gap-3 mt-8">
                    <button onClick={() => setStep('sleep')} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">← Back</button>
                    <button onClick={() => setStep('stress')} className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">Next →</button>
                  </div>
                </>
              )}

              {step === 'stress' && (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">Stress level today?</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">1 = very calm, 10 = overwhelmed</p>
                  <ScoreSlider value={stress} onChange={setStress} labelMap={STRESS_LABELS} color="#E07B2A" />
                  <div className="flex gap-3 mt-8">
                    <button onClick={() => setStep('energy')} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">← Back</button>
                    <button onClick={() => setStep('hydration')} className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">Next →</button>
                  </div>
                </>
              )}

              {step === 'hydration' && (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">Hydration today?</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">How well have you been drinking water?</p>
                  <ScoreSlider value={hydration} onChange={setHydration}
                    labelMap={{
                      1: { emoji: '🏜️', label: 'Dehydrated' }, 2: { emoji: '😵', label: 'Very Low' },
                      3: { emoji: '😓', label: 'Low' }, 4: { emoji: '😐', label: 'Below Average' },
                      5: { emoji: '🙂', label: 'Average' }, 6: { emoji: '💧', label: 'Fair' },
                      7: { emoji: '😊', label: 'Good' }, 8: { emoji: '🌊', label: 'Well Hydrated' },
                      9: { emoji: '💦', label: 'Excellent' }, 10: { emoji: '⭐', label: 'Perfect' },
                    }}
                    color="#0ea5e9"
                  />
                  <div className="flex gap-3 mt-8">
                    <button onClick={() => setStep('stress')} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">← Back</button>
                    <button onClick={() => setStep('mood')} className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">Next →</button>
                  </div>
                </>
              )}

              {step === 'mood' && (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">Mood today?</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">How are you feeling emotionally?</p>
                  <ScoreSlider value={mood} onChange={setMood}
                    labelMap={{
                      1: { emoji: '😭', label: 'Very Low' }, 2: { emoji: '😢', label: 'Low' },
                      3: { emoji: '😔', label: 'Down' }, 4: { emoji: '😕', label: 'Below Average' },
                      5: { emoji: '😐', label: 'Neutral' }, 6: { emoji: '🙂', label: 'OK' },
                      7: { emoji: '😊', label: 'Good' }, 8: { emoji: '😄', label: 'Happy' },
                      9: { emoji: '🥰', label: 'Great' }, 10: { emoji: '🤩', label: 'Amazing' },
                    }}
                    color="#ec4899"
                  />
                  <div className="flex gap-3 mt-8">
                    <button onClick={() => setStep('hydration')} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">← Back</button>
                    <button onClick={submitCheckin} disabled={submitting} className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors">
                      {submitting ? 'Saving…' : 'Submit ✓'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Done modal */}
        {step === 'done' && result && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Check-in Complete!</h3>
              <div className="bg-gradient-to-br from-primary-light to-purple-50 rounded-2xl p-5 mb-5">
                <p className="text-sm text-gray-500 mb-1">Today's Wellness Score</p>
                <p className="text-5xl font-black text-primary">{result.wellness_score}</p>
                <p className="text-sm text-gray-500 mt-1">out of 10</p>
              </div>
              {result.np_awarded > 0 && (
                <div className="flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5">
                  <span className="text-2xl">⚡</span>
                  <span className="text-lg font-bold text-yellow-700">+{result.np_awarded} NeoPulse earned!</span>
                </div>
              )}
              <button onClick={() => { setStep('idle'); setCheckedInToday(true) }} className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
                View Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Balance', value: `${balance} NP`, sub: '100 NP = ₹10 off', color: '#D4236A' },
            { label: '30-day Avg', value: avgWellness ? `${avgWellness}/10` : '—', sub: 'Wellness score', color: '#7B35A8' },
            { label: 'Check-ins', value: String(history.length), sub: 'Last 30 days', color: '#E07B2A' },
            { label: 'Max Discount', value: balance >= 100 ? `₹${Math.floor(balance / 100) * 10}` : '—', sub: `Need ${100 - (balance % 100)} more NP`, color: '#22c55e' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.color }}>{loading ? '…' : s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Wellness chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Wellness Trend</h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> 7–10</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> 5–7</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> &lt;5</span>
            </div>
          </div>
          {loading ? <div className="h-40 bg-gray-50 rounded-xl animate-pulse" /> : <WellnessChart history={history} />}

          {history.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3 pt-5 border-t border-gray-100">
              {[
                { label: 'Avg Sleep', value: (history.reduce((s, d) => s + d.sleep_score, 0) / history.length).toFixed(1), icon: '🌙', color: '#7B35A8' },
                { label: 'Avg Energy', value: (history.reduce((s, d) => s + d.energy_score, 0) / history.length).toFixed(1), icon: '⚡', color: '#D4236A' },
                { label: 'Avg Stress', value: (history.reduce((s, d) => s + d.stress_level, 0) / history.length).toFixed(1), icon: '🧘', color: '#E07B2A' },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-lg">{m.icon}</p>
                  <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}/10</p>
                  <p className="text-xs text-gray-400">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* How to earn */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">How to Earn NP</h2>
            <div className="space-y-3">
              {[
                { icon: '🏃', label: 'Daily Check-in', pts: '+10 NP', sub: 'Every day' },
                { icon: '🔥', label: 'Weekly Streak', pts: '+35 NP', sub: '7 check-ins in a row' },
                { icon: '🌸', label: 'NeoCycle Log', pts: '+90 NP', sub: 'Log your period (monthly)' },
                { icon: '⭐', label: 'Neo Twin Unlock', pts: '+300 NP', sub: 'Reach 30 check-ins (one time)' },
                { icon: '🤝', label: 'Refer a Friend', pts: '+15 NP', sub: 'Per referral' },
                { icon: '🛍️', label: 'First Purchase', pts: '+50 NP', sub: 'One time' },
                { icon: '✍️', label: 'Write a Review', pts: '+20 NP', sub: 'Per review' },
                { icon: '👤', label: 'Complete Profile', pts: '+25 NP', sub: 'One time' },
                { icon: '📣', label: 'Share on Social', pts: '+10 NP', sub: 'Per day' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{item.pts}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Redeem */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-1">Redeem Points</h2>
              <p className="text-xs text-gray-500 mb-4">100 NP = ₹10 off your order. Use at checkout.</p>
              <div className="bg-gradient-to-br from-primary-light to-purple-50 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[100, 200, 300, 500, 750, 1000].filter((v) => v <= Math.max(balance, 100)).slice(0, 6).map((pts) => (
                    <div key={pts} className={`rounded-lg p-2 text-center text-xs border ${balance >= pts ? 'border-primary bg-white' : 'border-gray-200 bg-gray-50 opacity-40'}`}>
                      <p className="font-bold text-primary">{pts} NP</p>
                      <p className="text-gray-500">₹{(pts / 100) * 10} off</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center">Applied automatically at checkout</p>
              </div>
              <Link href="/shop" className="mt-3 block text-center bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
                Shop & Redeem →
              </Link>
            </div>

            {/* Referral */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-1">Your Referral Code</h2>
              <p className="text-xs text-gray-500 mb-3">Share with friends. Earn 15 NP when they join.</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 font-mono font-bold text-primary tracking-widest text-center">
                  {loading ? '…' : referralCode || '—'}
                </div>
                <button onClick={copyReferral} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'}`}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Social share */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-1">Share & Earn 10 NP</h2>
              <p className="text-xs text-gray-500 mb-3">Share NeoFuture today to earn daily social points.</p>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=I'm using NeoFuture for women's wellness. Join me! https://neofuture.in?ref=${referralCode}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={shareOnSocial}
                  className="flex-1 text-center bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.instagram.com/`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={shareOnSocial}
                  className="flex-1 text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Points History</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : transactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No transactions yet. Start your first check-in!</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-xl w-8 text-center">{ACTION_ICONS[t.action] ?? '⚡'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${t.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {t.points > 0 ? `+${t.points}` : t.points} NP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
