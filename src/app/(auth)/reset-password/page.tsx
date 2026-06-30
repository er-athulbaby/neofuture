'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, KeyRound } from 'lucide-react'

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">Invalid reset link. Please request a new one.</p>
        <Link href="/forgot-password" className="text-primary font-medium hover:underline">Request New Link</Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setDone(true)
        setTimeout(() => router.push('/login'), 2500)
      } else {
        setError(data.error ?? 'Something went wrong')
      }
    } catch {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl mb-4 text-sm">
          ✅ Password reset successfully! Redirecting you to sign in…
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
          {error.includes('expired') && (
            <> — <Link href="/forgot-password" className="underline font-medium">Request a new link</Link></>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1.5">Confirm Password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
        >
          {loading ? 'Resetting...' : 'Set New Password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
            <KeyRound size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-brand-dark">Set a new password</h1>
          <p className="text-brand-gray text-sm mt-2">Choose a strong password for your account.</p>
        </div>
        <Suspense fallback={<div className="text-center text-brand-gray">Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
