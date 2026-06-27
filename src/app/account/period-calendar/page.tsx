'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import { addDays } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PeriodLog { id: number; start_date: string; end_date: string | null; notes: string | null }
interface Prediction { predicted_start: string; predicted_end: string; avg_cycle_length: number }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
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

  // Compute highlighted date ranges
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

  // Build calendar
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
              const isToday = dateStr === todayStr

              return (
                <div key={d}
                  className={cn(
                    'relative aspect-square flex items-center justify-center text-xs font-medium rounded-lg cursor-default transition-all',
                    isPeriod ? 'bg-primary text-white' : isPredict ? 'bg-primary/20 text-primary' : '',
                    isToday && !isPeriod ? 'ring-2 ring-primary ring-offset-1' : '',
                    !isPeriod && !isPredict ? 'text-brand-dark hover:bg-gray-50' : ''
                  )}>
                  {d}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs text-brand-gray">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary inline-block" /> Period</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/20 inline-block" /> Predicted</span>
          </div>
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
