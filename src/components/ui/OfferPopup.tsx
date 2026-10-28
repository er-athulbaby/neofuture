'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check, Tag } from 'lucide-react'
import Link from 'next/link'

interface Props {
  delaySeconds: number
  title: string
  body: string
  coupon: string
  cta: string
  ctaUrl: string
}

const SESSION_KEY = 'nf_popup_shown'

export default function OfferPopup({ delaySeconds, title, body, coupon, cta, ctaUrl }: Props) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try { if (sessionStorage.getItem(SESSION_KEY)) return } catch { return }
    const t = setTimeout(() => {
      setVisible(true)
      try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* private mode */ }
    }, delaySeconds * 1000)
    return () => clearTimeout(t)
  }, [delaySeconds])

  function close() { setVisible(false) }

  function copy() {
    navigator.clipboard.writeText(coupon).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
          <button onClick={close} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <Tag size={20} />
          </div>
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-brand-gray leading-relaxed">{body}</p>

          {coupon && (
            <div className="flex items-center gap-2 bg-primary-light rounded-xl px-4 py-3 border border-primary/20">
              <span className="flex-1 font-mono font-bold text-primary tracking-widest text-sm">{coupon}</span>
              <button onClick={copy} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-primary">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <Link href={ctaUrl} onClick={close}
              className="flex-1 bg-primary text-white text-center py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
              {cta}
            </Link>
            <button onClick={close}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-brand-gray hover:bg-gray-50 transition-colors">
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
