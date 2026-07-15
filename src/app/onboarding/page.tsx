'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, SkipForward } from 'lucide-react'

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({ height_cm: '', weight_kg: '', date_of_birth: '', last_period_date: '' })
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return }
    if (status !== 'authenticated') return

    fetch('/api/onboarding')
      .then((r) => r.json())
      .then((d) => {
        // Pre-fill with existing data if any
        if (d.profile) {
          setForm({
            height_cm: d.profile.height_cm ? String(d.profile.height_cm) : '',
            weight_kg: d.profile.weight_kg ? String(d.profile.weight_kg) : '',
            date_of_birth: d.profile.date_of_birth ? d.profile.date_of_birth.slice(0, 10) : '',
            last_period_date: d.profile.last_period_date ? d.profile.last_period_date.slice(0, 10) : '',
          })
        }
        setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [status, router])

  async function submit(skip = false) {
    setLoading(true)
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skip
        ? { skip: true }
        : {
            height_cm: form.height_cm ? Number(form.height_cm) : null,
            weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
            date_of_birth: form.date_of_birth || null,
            last_period_date: form.last_period_date || null,
          }),
    })
    setLoading(false)
    router.replace('/account')
  }

  if (checking || status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-brand-dark">Your Health Profile</h1>
          <p className="text-brand-gray text-sm mt-2 leading-relaxed">
            Help us personalise your wellness journey. Your data stays private and is used only to give you better recommendations.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">Height (cm)</label>
              <input
                type="number"
                min="50"
                max="250"
                step="0.1"
                value={form.height_cm}
                onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
                placeholder="e.g. 162"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">Weight (kg)</label>
              <input
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={form.weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                placeholder="e.g. 58"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">
              Last Period Date <span className="text-brand-gray font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={form.last_period_date}
              onChange={(e) => setForm((f) => ({ ...f, last_period_date: e.target.value }))}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-brand-gray mt-1">Used to track your cycle day in the Neo Twin dashboard.</p>
          </div>

          <button
            onClick={() => submit(false)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Save & Continue <ArrowRight size={18} /></>
            )}
          </button>

          <button
            onClick={() => submit(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-brand-gray hover:text-brand-dark transition-colors"
          >
            <SkipForward size={14} />
            Skip for now
          </button>
        </div>

        <p className="text-xs text-brand-gray text-center mt-6 leading-relaxed">
          You can update this information anytime from your account settings.
        </p>
      </div>
    </div>
  )
}
