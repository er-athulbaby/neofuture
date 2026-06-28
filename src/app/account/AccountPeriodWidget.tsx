'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addDays } from '@/lib/utils'
import Link from 'next/link'

interface PeriodLog { id: number; start_date: string; end_date: string | null }
interface Prediction { predicted_start: string; predicted_end: string; avg_cycle_length: number }

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function AccountPeriodWidget() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [logs, setLogs] = useState<PeriodLog[]>([])
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/period')
    if (!res.ok) return
    const data = await res.json()
    setLogs(data.logs ?? [])
    setPrediction(data.prediction ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const periodDates = new Set<string>()
  const predictDates = new Set<string>()

  logs.forEach((log) => {
    const start = new Date(log.start_date)
    const end = log.end_date ? new Date(log.end_date) : addDays(start, 5)
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      periodDates.add(d.toISOString().split('T')[0])
    }
  })

  if (prediction) {
    const ps = new Date(prediction.predicted_start)
    const pe = new Date(prediction.predicted_end)
    for (let d = new Date(ps); d <= pe; d = addDays(d, 1)) {
      predictDates.add(d.toISOString().split('T')[0])
    }
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayStr = today.toISOString().split('T')[0]

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  if (loading) return <div className="py-8 text-center text-sm text-brand-gray">Loading...</div>

  return (
    <div>
      {/* Prediction pill */}
      {prediction && (
        <div className="flex items-center justify-between bg-primary-light rounded-xl px-4 py-2.5 mb-4">
          <div>
            <p className="text-xs font-semibold text-primary">Next Period</p>
            <p className="text-sm font-bold text-brand-dark mt-0.5">
              {new Date(prediction.predicted_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              {' – '}
              {new Date(prediction.predicted_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-brand-gray">Avg cycle</p>
            <p className="text-sm font-bold text-brand-dark">{prediction.avg_cycle_length} days</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
        <span className="font-semibold text-brand-dark text-sm">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={16} /></button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => <div key={i} className="text-center text-xs text-brand-gray py-0.5">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1
          const dateStr = toDateStr(viewYear, viewMonth, d)
          const isPeriod = periodDates.has(dateStr)
          const isPredict = predictDates.has(dateStr)
          const isToday = dateStr === todayStr
          return (
            <div key={d}
              className={cn(
                'aspect-square flex items-center justify-center text-xs rounded-lg font-medium',
                isPeriod ? 'bg-primary text-white' :
                isPredict ? 'bg-primary/20 text-primary' :
                isToday ? 'ring-2 ring-primary text-brand-dark' :
                'text-brand-dark'
              )}>
              {d}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-3 text-xs text-brand-gray">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary inline-block" /> Period</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary/20 inline-block" /> Predicted</span>
        </div>
        <Link href="/account/period-calendar"
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
          <Plus size={12} /> Log Period
        </Link>
      </div>
    </div>
  )
}
