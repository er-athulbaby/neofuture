'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface Props {
  delaySeconds: number
  title: string
  prize: string
  coupon: string
  cta: string
  ctaUrl: string
}

const SESSION_KEY = 'nf_wheel_shown'
const SEGMENTS = 8
// Decoy labels for non-winning segments
const DECOYS = ['Try Again', 'Better Luck!', 'Try Again', 'Almost!', 'Try Again', 'Oops!', 'Try Again']
// Prize segment is always index 0 (top after spin)
const COLORS = ['#D4236A', '#f3f4f6', '#D4236A', '#f3f4f6', '#D4236A', '#f3f4f6', '#D4236A', '#f3f4f6']
const TEXT_COLORS = ['#ffffff', '#6b7280', '#ffffff', '#6b7280', '#ffffff', '#6b7280', '#ffffff', '#6b7280']

export default function SpinWheel({ delaySeconds, title, prize, coupon, cta, ctaUrl }: Props) {
  const [visible, setVisible] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [won, setWon] = useState(false)
  const [copied, setCopied] = useState(false)
  const [rotation, setRotation] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    try { if (sessionStorage.getItem(SESSION_KEY)) return } catch { return }
    const t = setTimeout(() => setVisible(true), delaySeconds * 1000)
    return () => clearTimeout(t)
  }, [delaySeconds])

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const r = size / 2 - 6
    const labels = [prize, ...DECOYS]
    const arc = (2 * Math.PI) / SEGMENTS

    labels.forEach((label, i) => {
      // Offset by -arc/2 so segment 0 is centred at top (12 o'clock)
      const start = i * arc - Math.PI / 2 - arc / 2
      const end = start + arc
      // Slice
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end)
      ctx.closePath()
      ctx.fillStyle = COLORS[i]
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = TEXT_COLORS[i]
      ctx.font = `bold ${size / 20}px sans-serif`
      ctx.fillText(label.length > 10 ? label.slice(0, 10) : label, r - 8, 5)
      ctx.restore()
    })

    // Center pin
    ctx.beginPath()
    ctx.arc(cx, cy, 16, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#D4236A'
    ctx.lineWidth = 3
    ctx.stroke()
  }, [prize])

  useEffect(() => {
    if (visible) drawWheel()
  }, [visible, drawWheel])

  function spin() {
    if (spinning || won) return
    setSpinning(true)
    // Segment 0 is centred at top (0°) in the drawing, so we just spin
    // 5-7 full rotations and land within ±12° of centre to look natural.
    const fullRotations = (5 + Math.floor(Math.random() * 3)) * 360
    const prizeJitter = (Math.random() - 0.5) * 24 // ±12° inside the 45° slice
    setRotation((r) => r + fullRotations + prizeJitter)
    setTimeout(() => {
      setSpinning(false)
      setWon(true)
      try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* private mode */ }
    }, 4200)
  }

  function copy() {
    navigator.clipboard.writeText(coupon).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function close() {
    setVisible(false)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* private mode */ }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary-dark px-5 py-4 text-white flex items-center justify-between">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={close} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>

        {!won ? (
          <div className="p-5 flex flex-col items-center gap-4">
            <p className="text-sm text-brand-gray text-center">Spin the wheel to reveal your exclusive offer!</p>

            {/* Pointer triangle above wheel */}
            <div className="relative">
              <div
                className="absolute left-1/2 -top-1 -translate-x-1/2 z-10"
                style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '22px solid #D4236A' }}
              />
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                  borderRadius: '50%',
                  display: 'block',
                  marginTop: '10px',
                }}
              />
            </div>

            <button
              onClick={spin}
              disabled={spinning}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-base disabled:opacity-60 hover:bg-primary-dark transition-colors"
            >
              {spinning ? 'Spinning…' : 'SPIN!'}
            </button>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl">🎉</div>
            <div>
              <p className="text-xs text-brand-gray uppercase tracking-wide mb-1">You won</p>
              <p className="text-2xl font-bold text-primary">{prize}</p>
            </div>
            {coupon && (
              <div className="w-full flex items-center gap-2 bg-primary-light rounded-xl px-4 py-3 border border-primary/20">
                <span className="flex-1 font-mono font-bold text-primary tracking-widest text-sm">{coupon}</span>
                <button onClick={copy} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-primary">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            )}
            <div className="flex gap-2 w-full">
              <Link
                href={ctaUrl}
                onClick={close}
                className="flex-1 bg-primary text-white text-center py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                {cta}
              </Link>
              <button
                onClick={close}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-brand-gray hover:bg-gray-50 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
