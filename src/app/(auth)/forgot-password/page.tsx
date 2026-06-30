'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const d = await res.json()
        setError(d.error ?? 'Something went wrong')
      }
    } catch {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-brand-dark">Forgot your password?</h1>
          <p className="text-brand-gray text-sm mt-2">Enter your email and we'll send you a reset link.</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl mb-6 text-sm">
              ✅ If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox (and spam folder).
            </div>
            <Link href="/login" className="text-primary text-sm font-medium hover:underline flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="text-center text-sm text-brand-gray mt-5">
              <Link href="/login" className="text-primary font-medium hover:underline flex items-center justify-center gap-1">
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
