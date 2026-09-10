'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('nf_cookie_consent')
      if (!consent) setVisible(true)
    } catch {
      // localStorage blocked (private mode etc)
    }
  }, [])

  function accept() {
    try { localStorage.setItem('nf_cookie_consent', 'accepted') } catch { /* ignore */ }
    setVisible(false)
  }

  function decline() {
    try { localStorage.setItem('nf_cookie_consent', 'declined') } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-brand-dark text-white rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 p-2 bg-primary/20 rounded-xl">
          <Cookie size={22} className="text-primary" />
        </div>
        <div className="flex-1 text-sm text-white/80 leading-relaxed">
          We use cookies to improve your experience, analyse traffic, and personalise content.
          By continuing, you agree to our{' '}
          <Link href="/privacy-policy" className="text-white underline underline-offset-2 hover:text-primary transition-colors">
            Privacy Policy
          </Link>.
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={decline}
            className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/20 rounded-xl transition-colors">
            Decline
          </button>
          <button onClick={accept}
            className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors">
            Accept
          </button>
          <button onClick={accept} className="p-1.5 text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
