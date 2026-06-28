'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addDays } from '@/lib/utils'
import Link from 'next/link'

interface PeriodLog { id: number; start_date: string; end_date: string | null }
interface Prediction { predicted_start: string; predicted_end: string; avg_cycle_length: number }

type FertilityLevel = 'period' | 'predicted_period' | 'ovulation' | 'high_fertile' | 'low' | 'none'
interface DayInfo { cycleDay: number | null; level: FertilityLevel; label: string; icon?: string }

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function getDayInfo(
  dateStr: string,
  logs: PeriodLog[],
  avgCycleLength: number,
  periodDates: Set<string>,
  predictDates: Set<string>,
): DayInfo {
  const date = new Date(dateStr + 'T00:00:00')
  if (periodDates.has(dateStr)) {
    const log = logs
      .filter((l) => new Date(l.start_date + 'T00:00:00') <= date)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0]
    const cycleDay = log ? Math.floor((date.getTime() - new Date(log.start_date + 'T00:00:00').getTime()) / 86400000) + 1 : null
    return { cycleDay, level: 'period', label: 'Menstruation', icon: '🩸' }
  }
  if (predictDates.has(dateStr)) return { cycleDay: null, level: 'predicted_period', label: 'Predicted Period', icon: '📅' }

  const recentLog = logs
    .filter((l) => new Date(l.start_date + 'T00:00:00') <= date)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0]
  if (!recentLog) return { cycleDay: null, level: 'none', label: '' }

  const periodStart = new Date(recentLog.start_date + 'T00:00:00')
  const cycleDay = Math.floor((date.getTime() - periodStart.getTime()) / 86400000) + 1
  if (cycleDay > avgCycleLength + 5) return { cycleDay: null, level: 'none', label: '' }

  const ovulationDate = addDays(periodStart, avgCycleLength - 14)
  const ovulationStr = ovulationDate.toISOString().split('T')[0]
  const fertileStart = addDays(ovulationDate, -5)
  const fertileEnd = addDays(ovulationDate, 1)

  if (dateStr === ovulationStr) return { cycleDay, level: 'ovulation', label: 'Ovulation Day, High - chance of getting pregnant', icon: '🟣' }
  if (date >= fertileStart && date <= fertileEnd) return { cycleDay, level: 'high_fertile', label: 'High - chance of getting pregnant', icon: '✨' }
  return { cycleDay, level: 'low', label: 'Low - chance of getting pregnant' }
}

export default function AccountPeriodWidget() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [logs, setLogs] = useState<PeriodLog[]>([])
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0])

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

  const avgCycleLength = prediction?.avg_cycle_length ?? 28

  const ovulationDates = new Set<string>()
  const fertileDates = new Set<string>()
  logs.forEach((log) => {
    const periodStart = new Date(log.start_date + 'T00:00:00')
    const ovulationDate = addDays(periodStart, avgCycleLength - 14)
    ovulationDates.add(ovulationDate.toISOString().split('T')[0])
    for (let i = -5; i <= 1; i++) {
      if (i !== 0) fertileDates.add(addDays(ovulationDate, i).toISOString().split('T')[0])
    }
  })

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

  const selectedInfo = selectedDate ? getDayInfo(selectedDate, logs, avgCycleLength, periodDates, predictDates) : null
  const selectedLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : ''

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
          const isOvulation = ovulationDates.has(dateStr)
          const isFertile = fertileDates.has(dateStr)
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          return (
            <button key={d} onClick={() => setSelectedDate(dateStr)}
              className={cn(
                'relative aspect-square flex items-center justify-center text-xs rounded-lg font-medium transition-all',
                isPeriod ? 'bg-primary text-white' :
                isOvulation ? 'bg-purple-600 text-white' :
                isFertile ? 'bg-purple-100 text-purple-700' :
                isPredict ? 'bg-primary/20 text-primary' :
                'text-brand-dark',
                isSelected ? 'ring-2 ring-offset-0.5 ring-brand-dark/50' : '',
                isToday && !isSelected && !isPeriod && !isOvulation ? 'ring-1 ring-primary' : '',
              )}>
              {d}
            </button>
          )
        })}
      </div>

      {/* Selected day info */}
      {selectedDate && selectedInfo && selectedInfo.label && (
        <div className={cn(
          'mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm',
          selectedInfo.level === 'period' ? 'bg-primary/10 text-primary' :
          selectedInfo.level === 'ovulation' ? 'bg-purple-50 text-purple-700' :
          selectedInfo.level === 'high_fertile' ? 'bg-purple-50 text-purple-600' :
          selectedInfo.level === 'predicted_period' ? 'bg-primary/10 text-primary' :
          'bg-gray-50 text-brand-gray'
        )}>
          <span className="text-base leading-tight">{selectedInfo.icon ?? '📍'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-brand-dark text-xs">{selectedLabel}</span>
              {selectedInfo.cycleDay && (
                <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full">Cycle day {selectedInfo.cycleDay}</span>
              )}
            </div>
            <p className="text-xs mt-0.5">{selectedInfo.label}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex flex-wrap gap-2 text-xs text-brand-gray">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary inline-block" /> Period</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block" /> Ovulation</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-100 inline-block" /> Fertile</span>
        </div>
        <Link href="/account/period-calendar"
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
          <Plus size={12} /> Log Period
        </Link>
      </div>
    </div>
  )
}
