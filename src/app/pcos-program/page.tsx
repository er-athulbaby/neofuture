'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Stethoscope, ClipboardList, Video, MessageCircle, Salad,
  BarChart2, Smartphone, Trophy, ArrowLeft, Check, Sparkles, Heart
} from 'lucide-react'

const FEATURE_ICONS = [Stethoscope, ClipboardList, Video, MessageCircle, Salad, BarChart2, Smartphone, Trophy]
const FEATURE_COLORS = ['#0EA5C8','#7C3AED','#fa4505','#10B981','#F59E0B','#3B82F6','#EC4899','#F59E0B']

interface ProgramSettings {
  pcos_price: string
  pcos_original_price: string
  pcos_detail_title: string
  pcos_detail_description: string
  pcos_features: string
}

declare global { interface Window { Razorpay: new (opts: Record<string, unknown>) => { open(): void } } }

export default function PcosProgramPage() {
  const [settings, setSettings] = useState<ProgramSettings | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [step, setStep] = useState<'details' | 'paying' | 'success'>('details')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/pcos-program/settings').then(r => r.json()).then(setSettings)
    // Load Razorpay script
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(s)
  }, [])

  const features: string[] = settings?.pcos_features ? JSON.parse(settings.pcos_features) : []
  const price = Number(settings?.pcos_price ?? 899)
  const originalPrice = Number(settings?.pcos_original_price ?? 1200)

  async function handleEnroll() {
    if (!form.name || !form.email) { setError('Please fill your name and email'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/pcos-program/enroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); setLoading(false); return }

      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'NeoFuture',
        description: '90 Days PCOS/PCOD Reset Journey',
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#7C3AED' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const vRes = await fetch('/api/pcos-program/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          if (vRes.ok) setStep('success')
          else setError('Payment verification failed. Please contact support.')
          setLoading(false)
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      rzp.open()
      setStep('paying')
    } catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-brand-dark mb-3">You&apos;re Enrolled!</h2>
          <p className="text-brand-gray mb-6">Welcome to the 90 Days PCOS Reset Journey. Our team will reach out to you shortly with next steps.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-white to-purple-50">
      {/* Back nav */}
      <div className="px-4 pt-5">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-gray hover:text-brand-dark text-sm transition-colors">
          <ArrowLeft size={15} /> Back to Home
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 bg-purple-100 text-neo-purple border border-purple-200">
          <Heart size={13} /> Limited spots available
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-brand-dark leading-tight mb-4">
          {settings?.pcos_detail_title ?? '90 Days. One Journey. You\'re Not Alone.'}
        </h1>
        <p className="text-lg text-brand-gray leading-relaxed">
          {settings?.pcos_detail_description}
        </p>
      </div>

      {/* Features + Enroll card */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Features */}
          <div className="p-8 border-b border-gray-100">
            <h2 className="font-bold text-brand-dark text-lg mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> What&apos;s included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feat, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]
                const color = FEATURE_COLORS[i % FEATURE_COLORS.length]
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: color + '0d' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '1a' }}>
                      <Icon size={17} style={{ color }} />
                    </div>
                    <span className="text-sm font-medium text-brand-dark">{feat}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pricing + form */}
          <div className="p-8">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-brand-dark">₹{price}</span>
              {originalPrice > price && (
                <span className="text-xl text-brand-gray line-through">₹{originalPrice}</span>
              )}
              <span className="text-brand-gray text-sm">/month</span>
              {originalPrice > price && (
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Save {Math.round((1 - price / originalPrice) * 100)}%
                </span>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'you@email.com' },
                { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <button
              onClick={handleEnroll}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-base bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {loading ? 'Processing…' : `Enroll Now — ₹${price}/month`}
            </button>
            <p className="text-center text-xs text-brand-gray mt-3">Secure payment via Razorpay · Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  )
}
