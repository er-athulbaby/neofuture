'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import { addDays } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, Trash2, Droplets, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PeriodLog { id: number; start_date: string; end_date: string | null; notes: string | null }
interface Prediction { predicted_start: string; predicted_end: string; avg_cycle_length: number }

type FertilityLevel = 'period' | 'predicted_period' | 'ovulation' | 'high_fertile' | 'low' | 'none'

interface DayInfo {
  cycleDay: number | null
  level: FertilityLevel
  label: string
  icon?: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

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

  // Period / predicted period
  if (periodDates.has(dateStr)) {
    const log = logs
      .filter((l) => new Date(l.start_date + 'T00:00:00') <= date)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0]
    if (log) {
      const periodStart = new Date(log.start_date + 'T00:00:00')
      const cycleDay = Math.floor((date.getTime() - periodStart.getTime()) / 86400000) + 1
      return { cycleDay, level: 'period', label: 'Menstruation', icon: '🩸' }
    }
  }
  if (predictDates.has(dateStr)) {
    return { cycleDay: null, level: 'predicted_period', label: 'Predicted Period', icon: '📅' }
  }

  // Find most recent period start before this date
  const recentLog = logs
    .filter((l) => new Date(l.start_date + 'T00:00:00') <= date)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0]

  if (!recentLog) return { cycleDay: null, level: 'none', label: '' }

  const periodStart = new Date(recentLog.start_date + 'T00:00:00')
  const cycleDay = Math.floor((date.getTime() - periodStart.getTime()) / 86400000) + 1

  // Stop if beyond 2 cycles
  if (cycleDay > avgCycleLength + 5) return { cycleDay: null, level: 'none', label: '' }

  // Ovulation date: cycle_length - 14 days after period start
  const ovulationDate = addDays(periodStart, avgCycleLength - 14)
  const ovulationStr = ovulationDate.toISOString().split('T')[0]

  // Fertile window: 5 days before ovulation to 1 day after
  const fertileStart = addDays(ovulationDate, -5)
  const fertileEnd = addDays(ovulationDate, 1)

  if (dateStr === ovulationStr) {
    return { cycleDay, level: 'ovulation', label: 'Ovulation Day, High - chance of getting pregnant', icon: '🟣' }
  }
  if (date >= fertileStart && date <= fertileEnd) {
    return { cycleDay, level: 'high_fertile', label: 'High - chance of getting pregnant', icon: '✨' }
  }
  return { cycleDay, level: 'low', label: 'Low - chance of getting pregnant' }
}

export default function PeriodCalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [logs, setLogs] = useState<PeriodLog[]>([])
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [addForm, setAddForm] = useState({ show: false, start_date: '', end_date: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/account/period-calendar')
  }, [status, router])

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/period')
    if (!res.ok) return
    const data = await res.json()
    setLogs(data.logs ?? [])
    setPrediction(data.prediction ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function addLog(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.start_date) { toast('Start date required', 'error'); return }
    const res = await fetch('/api/period', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: addForm.start_date, end_date: addForm.end_date || null, notes: addForm.notes || null }),
    })
    if (!res.ok) { toast('Failed to save', 'error'); return }
    toast('Period logged!')
    setAddForm({ show: false, start_date: '', end_date: '', notes: '' })
    fetchLogs()
  }

  async function deleteLog(id: number) {
    await fetch('/api/period', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setLogs((l) => l.filter((x) => x.id !== id))
    toast('Entry removed')
  }

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

  // Pre-compute ovulation & fertile dates for this month's calendar rendering
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

  const selectedInfo = selectedDate
    ? getDayInfo(selectedDate, logs, avgCycleLength, periodDates, predictDates)
    : null

  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null
  const selectedLabel = selectedDateObj
    ? selectedDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : ''

  if (loading) return <div className="py-20 text-center text-brand-gray">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/account" className="text-brand-gray hover:text-primary text-sm">Dashboard</Link>
        <span className="text-gray-300">/</span>
        <h1 className="font-bold text-brand-dark text-xl flex items-center gap-2">
          <Droplets size={20} className="text-primary" /> Period Tracker
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-semibold text-brand-dark">{MONTHS[viewMonth]} {viewYear}</h2>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-xs font-semibold text-brand-gray py-1">{w}</div>
            ))}
          </div>

          {/* Days grid */}
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
                    'relative aspect-square flex flex-col items-center justify-center text-xs font-medium rounded-lg transition-all',
                    isPeriod ? 'bg-primary text-white' :
                    isPredict ? 'bg-primary/20 text-primary' :
                    isOvulation ? 'bg-purple-600 text-white' :
                    isFertile ? 'bg-purple-100 text-purple-700' :
                    'text-brand-dark hover:bg-gray-50',
                    isSelected && !isPeriod && !isOvulation ? 'ring-2 ring-offset-1 ring-brand-dark' : '',
                    isSelected && isPeriod ? 'ring-2 ring-offset-1 ring-primary' : '',
                    isSelected && isOvulation ? 'ring-2 ring-offset-1 ring-purple-600' : '',
                    isToday && !isSelected ? 'ring-2 ring-primary/40' : '',
                  )}>
                  {d}
                  {isOvulation && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white opacity-80" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-brand-gray">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary inline-block" /> Period</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/20 inline-block" /> Predicted</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-600 inline-block" /> Ovulation</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-100 inline-block" /> Fertile</span>
          </div>

          {/* Selected day info panel */}
          {selectedDate && selectedInfo && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-brand-dark">{selectedLabel}</p>
                {selectedInfo.cycleDay && (
                  <span className="text-xs bg-gray-100 text-brand-gray px-2.5 py-1 rounded-full font-medium">
                    Cycle day {selectedInfo.cycleDay}
                  </span>
                )}
              </div>
              {selectedInfo.label ? (
                <div className={cn(
                  'flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2.5',
                  selectedInfo.level === 'period' ? 'bg-primary/10 text-primary' :
                  selectedInfo.level === 'predicted_period' ? 'bg-primary/10 text-primary' :
                  selectedInfo.level === 'ovulation' ? 'bg-purple-50 text-purple-700' :
                  selectedInfo.level === 'high_fertile' ? 'bg-purple-50 text-purple-600' :
                  'bg-gray-50 text-brand-gray'
                )}>
                  {selectedInfo.icon && <span className="text-base">{selectedInfo.icon}</span>}
                  <span>{selectedInfo.label}</span>
                </div>
              ) : (
                <p className="text-sm text-brand-gray">Log your first period to see predictions for this day.</p>
              )}
            </div>
          )}
        </div>

        {/* Info + log form */}
        <div className="space-y-4">
          {/* Prediction card */}
          {prediction && (
            <div className="bg-primary-light rounded-2xl p-4">
              <p className="font-semibold text-primary text-sm mb-1">Next Period Predicted</p>
              <p className="text-lg font-bold text-brand-dark">
                {new Date(prediction.predicted_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {' – '}
                {new Date(prediction.predicted_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-brand-gray mt-1">Avg cycle: {prediction.avg_cycle_length} days</p>

              {/* Ovulation info */}
              {logs.length > 0 && (() => {
                const lastLog = [...logs].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0]
                const lastStart = new Date(lastLog.start_date + 'T00:00:00')
                const nextOvulation = addDays(new Date(prediction.predicted_start + 'T00:00:00'), avgCycleLength - 14)
                const fertileFrom = addDays(nextOvulation, -5)
                return (
                  <div className="mt-3 pt-3 border-t border-primary/20 space-y-1">
                    <p className="text-xs text-brand-gray flex justify-between">
                      <span>Next ovulation</span>
                      <span className="font-semibold text-purple-600">
                        {nextOvulation.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </p>
                    <p className="text-xs text-brand-gray flex justify-between">
                      <span>Fertile window</span>
                      <span className="font-semibold text-purple-500">
                        {fertileFrom.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {' – '}
                        {addDays(nextOvulation, 1).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </p>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Add log */}
          {!addForm.show ? (
            <button onClick={() => setAddForm((f) => ({ ...f, show: true, start_date: todayStr }))}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
              <Plus size={18} /> Log Period
            </button>
          ) : (
            <form onSubmit={addLog} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-brand-dark">Log New Period</h3>
              <div>
                <label className="text-xs font-medium text-brand-gray mb-1 block">Start Date</label>
                <input type="date" value={addForm.start_date}
                  onChange={(e) => setAddForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-gray mb-1 block">End Date (optional)</label>
                <input type="date" value={addForm.end_date}
                  onChange={(e) => setAddForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-gray mb-1 block">Notes (optional)</label>
                <input type="text" value={addForm.notes} placeholder="Flow, symptoms..."
                  onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAddForm({ show: false, start_date: '', end_date: '', notes: '' })}
                  className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-brand-gray hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">Save</button>
              </div>
            </form>
          )}

          {/* Recent logs */}
          <div>
            <h3 className="font-semibold text-brand-dark text-sm mb-2">Recent Logs</h3>
            {logs.length === 0 ? (
              <p className="text-sm text-brand-gray text-center py-4">No periods logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-brand-dark">
                        {new Date(log.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {log.end_date && ` – ${new Date(log.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </p>
                      {log.notes && <p className="text-xs text-brand-gray">{log.notes}</p>}
                    </div>
                    <button onClick={() => deleteLog(log.id)} className="p-1.5 text-gray-400 hover:text-danger rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
