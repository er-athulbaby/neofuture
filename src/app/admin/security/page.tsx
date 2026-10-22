'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldOff, RefreshCw } from 'lucide-react'

export default function AdminSecurityPage() {
  const [status, setStatus] = useState<'idle' | 'setup' | 'enabled'>('idle')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/totp?status=1').then(r => r.json()).then(d => {
      if (d.alreadyEnabled) setStatus('enabled')
    }).catch(() => {})
  }, [])

  async function startSetup() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/totp').then(r => r.json())
    setQrDataUrl(res.qrDataUrl)
    setSecret(res.secret)
    setStatus('setup')
    setLoading(false)
  }

  async function verifyAndEnable() {
    if (code.length !== 6) { setError('Enter the 6-digit code'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).then(r => r.json())
    setLoading(false)
    if (res.ok) {
      setStatus('enabled')
      setMsg('Two-factor authentication is now active.')
    } else {
      setError(res.error ?? 'Verification failed')
    }
  }

  async function disable2FA() {
    if (!confirm('Are you sure you want to disable 2FA? This will make your admin account less secure.')) return
    setLoading(true)
    await fetch('/api/admin/totp', { method: 'DELETE' })
    setStatus('idle')
    setMsg('')
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-brand-dark mb-1">Admin Security</h1>
      <p className="text-brand-gray text-sm mb-8">Protect your admin account with two-factor authentication.</p>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-6">
          {msg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {status === 'enabled' && (
        <div className="border border-green-200 bg-green-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck size={24} className="text-green-600" />
            <div>
              <p className="font-semibold text-green-800">2FA is active</p>
              <p className="text-sm text-green-600">Your account is protected with Google Authenticator.</p>
            </div>
          </div>
          <button
            onClick={disable2FA}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            <ShieldOff size={14} /> Disable 2FA
          </button>
        </div>
      )}

      {status === 'idle' && (
        <div className="border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldOff size={24} className="text-brand-gray" />
            <div>
              <p className="font-semibold text-brand-dark">2FA is not enabled</p>
              <p className="text-sm text-brand-gray">Add Google Authenticator to secure your login.</p>
            </div>
          </div>
          <button
            onClick={startSetup}
            disabled={loading}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {loading ? 'Loading...' : 'Enable 2FA'}
          </button>
        </div>
      )}

      {status === 'setup' && (
        <div className="border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <p className="font-semibold text-brand-dark mb-1">Step 1 — Scan this QR code</p>
            <p className="text-sm text-brand-gray mb-4">Open Google Authenticator → tap + → Scan QR code.</p>
            {qrDataUrl && <img src={qrDataUrl} alt="TOTP QR code" className="w-48 h-48 rounded-xl border border-gray-200" />}
          </div>

          <div>
            <p className="font-semibold text-brand-dark mb-1">Can't scan?</p>
            <p className="text-xs text-brand-gray mb-1">Enter this key manually in Google Authenticator:</p>
            <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg block break-all font-mono">{secret}</code>
          </div>

          <div>
            <p className="font-semibold text-brand-dark mb-1">Step 2 — Enter the 6-digit code</p>
            <div className="flex gap-3 items-start">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="border border-gray-200 rounded-xl px-4 py-3 text-center tracking-[0.5em] font-mono text-lg w-40 focus:outline-none focus:border-primary"
              />
              <button
                onClick={verifyAndEnable}
                disabled={loading || code.length !== 6}
                className="bg-primary text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>

          <button
            onClick={startSetup}
            className="flex items-center gap-1 text-xs text-brand-gray hover:text-brand-dark"
          >
            <RefreshCw size={12} /> Regenerate QR code
          </button>
        </div>
      )}
    </div>
  )
}
