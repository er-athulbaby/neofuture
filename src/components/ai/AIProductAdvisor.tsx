'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, SendHorizonal, X, ChevronDown, Loader2, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'I have PCOS and irregular periods',
  'Looking for menstrual hygiene products',
  'My baby needs vaccination tracking',
  'I feel tired and low on energy',
  'Pregnant and want support products',
]

const LS_KEY = 'nf_ai_recommendation'

interface Saved { response: string; product: string | null; concern: string }

export default function AIProductAdvisor() {
  const [open, setOpen] = useState(false)
  const [concern, setConcern] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [saved, setSaved] = useState<Saved | null>(null)
  const responseRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load previous recommendation from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) setSaved(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight
  }, [response])

  useEffect(() => {
    if (open && !saved && !done) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open, saved, done])

  async function ask(text?: string) {
    const q = (text ?? concern).trim()
    if (!q || loading) return
    setConcern(q)
    setResponse('')
    setDone(false)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concern: q }),
      })

      if (!res.ok || !res.body) {
        const errText = await res.text()
        setResponse(errText || 'Something went wrong. Please try again.')
        setDone(true)
        setLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) break
        full += decoder.decode(value, { stream: true })
        setResponse(full)
      }

      setDone(true)

      // Persist so panel won't restart on next open
      const product = full.match(/👉 I recommend:\s*\*?\*?([^*\n]+)\*?\*?/i)?.[1]?.trim() ?? null
      const entry: Saved = { response: full, product, concern: q }
      setSaved(entry)
      try { localStorage.setItem(LS_KEY, JSON.stringify(entry)) } catch {}
    } catch {
      setResponse('Could not reach the AI advisor. Please try again.')
      setDone(true)
    }
    setLoading(false)
  }

  function startFresh() {
    setConcern('')
    setResponse('')
    setDone(false)
    setLoading(false)
    setSaved(null)
    try { localStorage.removeItem(LS_KEY) } catch {}
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Determine what to show in the trigger button
  const buttonLabel = saved?.product
    ? `✓ Aria: ${saved.product.length > 22 ? saved.product.slice(0, 22) + '…' : saved.product}`
    : 'AI Advisor'

  // Active display: saved result or current streaming result
  const displayResponse = saved?.response ?? response
  const displayDone = !!saved || done
  const displayProduct = saved?.product ?? (done ? response.match(/👉 I recommend:\s*\*?\*?([^*\n]+)\*?\*?/i)?.[1]?.trim() : null)

  function renderResponse(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    )
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 whitespace-nowrap',
          open
            ? 'bg-primary text-white border-primary'
            : saved
              ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-white hover:border-primary'
              : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'
        )}
      >
        <Sparkles size={16} />
        {buttonLabel}
        <ChevronDown size={14} className={cn('transition-transform', open ? 'rotate-180' : '')} />
      </button>

      {/* Panel */}
      {open && (
        <div className="mt-3 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary-dark">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Aria — AI Wellness Advisor</p>
                <p className="text-white/70 text-xs">Powered by Claude AI</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Show questionnaire only if no previous recommendation */}
            {!saved && !response && !loading && (
              <div>
                <p className="text-sm text-brand-gray mb-3">
                  Hi! Tell me about your health concern or what you&apos;re looking for — I&apos;ll recommend the best NeoFuture product for you.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Streaming or saved response */}
            {(displayResponse || loading) && (
              <div
                ref={responseRef}
                className="bg-brand-light rounded-xl p-4 text-sm text-brand-dark leading-relaxed max-h-64 overflow-y-auto"
              >
                {loading && !displayResponse ? (
                  <div className="flex items-center gap-2 text-brand-gray">
                    <Loader2 size={15} className="animate-spin" />
                    <span>Aria is thinking...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {renderResponse(displayResponse)}
                    {loading && <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-0.5 align-middle" />}
                  </div>
                )}
              </div>
            )}

            {/* Previous concern label */}
            {saved && (
              <p className="text-xs text-brand-gray">
                Your concern: <em>&ldquo;{saved.concern}&rdquo;</em>
              </p>
            )}

            {/* CTA buttons once done */}
            {displayDone && displayProduct && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/shop?q=${encodeURIComponent(displayProduct)}`}
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Shop {displayProduct} →
                </Link>
                <button
                  onClick={startFresh}
                  title="Start a new recommendation"
                  className="p-2.5 border border-gray-200 rounded-xl text-brand-gray hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            )}

            {/* Input — only shown when not yet done and no saved result */}
            {!displayDone && (
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
                  placeholder="Describe your health concern or need..."
                  rows={2}
                  disabled={loading}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary disabled:bg-gray-50 transition-colors"
                />
                <button
                  onClick={() => ask()}
                  disabled={loading || !concern.trim()}
                  className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-40 transition-colors flex-shrink-0 self-end"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <SendHorizonal size={18} />}
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              AI guidance only — not a substitute for medical advice.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
