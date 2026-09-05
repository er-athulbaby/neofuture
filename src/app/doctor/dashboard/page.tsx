'use client'

import { useState, useEffect } from 'react'
import { Video, FileText, AlertCircle, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Consultation {
  id: number; patient_name: string; patient_email: string; slot_datetime: string;
  duration_minutes: number; meet_link: string; status: string; report_id: number | null;
  is_followup: boolean;
}
interface ReportForm {
  diagnosis: string; notes: string; additional_instructions: string;
  followup_weeks: number; followup_date: string;
  prescription: { medicine: string; strength: string; dosage_route: string; frequency: string; duration: string; quantity: string }[]
}

const EMPTY_RX = { medicine: '', strength: '', dosage_route: '', frequency: '', duration: '', quantity: '' }
const INIT_FORM: ReportForm = { diagnosis: '', notes: '', additional_instructions: '', followup_weeks: 6, followup_date: '', prescription: [{ ...EMPTY_RX }] }

export default function DoctorDashboard() {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [hasGoogle, setHasGoogle] = useState(true)
  const [activeReport, setActiveReport] = useState<number | null>(null)
  const [form, setForm] = useState<ReportForm>(INIT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [connected, setConnected] = useState<string | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('connected')) setConnected('Google Calendar connected successfully!')
    if (p.get('error')) setConnected('Google Calendar connection failed. Please try again.')

    fetch('/api/doctor/consultations').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setConsultations(data)
    })
  }, [])

  const today = consultations.filter(c => {
    const d = new Date(c.slot_datetime)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const upcoming = consultations.filter(c => new Date(c.slot_datetime) > new Date())
  const past = consultations.filter(c => new Date(c.slot_datetime) <= new Date())

  function canJoin(slot: string) {
    const t = new Date(slot).getTime()
    const now = Date.now()
    return now >= t - 15 * 60000 && now <= t + 60 * 60000
  }

  async function submitReport(consultationId: number) {
    setSubmitting(true)
    const res = await fetch(`/api/doctor/consultations/${consultationId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (res.ok) {
      setActiveReport(null)
      setForm(INIT_FORM)
      const updated = await fetch('/api/doctor/consultations').then(r => r.json())
      if (Array.isArray(updated)) setConsultations(updated)
    }
  }

  function updateRx(i: number, field: string, value: string) {
    setForm(f => {
      const rx = [...f.prescription]
      rx[i] = { ...rx[i], [field]: value }
      return { ...f, prescription: rx }
    })
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="font-bold text-brand-dark text-lg">Doctor Dashboard</h1>
        <Link href="/api/doctor/google/connect"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
          🔗 Connect Google Calendar
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {connected && (
          <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${connected.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <AlertCircle size={16} />{connected}
          </div>
        )}

        {/* Today */}
        <div>
          <h2 className="font-bold text-brand-dark mb-3">Today&apos;s Appointments ({today.length})</h2>
          {today.length === 0 && <p className="text-sm text-brand-gray bg-white rounded-xl px-4 py-6 text-center border border-gray-100">No appointments today.</p>}
          <div className="space-y-3">
            {today.map(c => (
              <ConsultCard key={c.id} c={c} onReport={() => { setActiveReport(c.id); setForm(INIT_FORM) }} canJoin={canJoin(c.slot_datetime)} />
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="font-bold text-brand-dark mb-3">Upcoming ({upcoming.filter(c => !today.includes(c)).length})</h2>
          <div className="space-y-3">
            {upcoming.filter(c => !today.includes(c)).map(c => (
              <ConsultCard key={c.id} c={c} onReport={() => {}} canJoin={false} />
            ))}
            {upcoming.filter(c => !today.includes(c)).length === 0 && (
              <p className="text-sm text-brand-gray bg-white rounded-xl px-4 py-6 text-center border border-gray-100">No upcoming appointments.</p>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-brand-dark text-lg flex items-center gap-2"><FileText size={18} className="text-primary" /> Post-Consultation Report</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide">Diagnosis / Clinical Assessment *</label>
                <textarea value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} rows={2}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide">Doctor Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              {/* Prescription */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide">Prescription</label>
                  <button onClick={() => setForm(f => ({ ...f, prescription: [...f.prescription, { ...EMPTY_RX }] }))}
                    className="flex items-center gap-1 text-primary text-xs font-semibold hover:underline">
                    <Plus size={12} /> Add Medicine
                  </button>
                </div>
                <div className="space-y-2">
                  {form.prescription.map((rx, i) => (
                    <div key={i} className="grid grid-cols-6 gap-1.5 bg-gray-50 p-2 rounded-xl">
                      {['medicine', 'strength', 'dosage_route', 'frequency', 'duration', 'quantity'].map(f => (
                        <input key={f} value={(rx as Record<string, string>)[f]} onChange={e => updateRx(i, f, e.target.value)}
                          placeholder={f.replace('_', ' ')}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                      ))}
                      {form.prescription.length > 1 && (
                        <button onClick={() => setForm(f => ({ ...f, prescription: f.prescription.filter((_, j) => j !== i) }))}
                          className="col-span-6 flex items-center justify-end gap-1 text-red-400 text-xs hover:text-red-600">
                          <Trash2 size={11} /> Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide">Additional Instructions (one per line)</label>
                <textarea value={form.additional_instructions} onChange={e => setForm(f => ({ ...f, additional_instructions: e.target.value }))} rows={2} placeholder="Take medicines after food&#10;Avoid stress"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide">Follow-up after (weeks)</label>
                  <input type="number" value={form.followup_weeks} onChange={e => setForm(f => ({ ...f, followup_weeks: Number(e.target.value) }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide">Follow-up Date</label>
                  <input type="date" value={form.followup_date} onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setActiveReport(null)} className="flex-1 border border-gray-200 text-brand-gray py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={() => submitReport(activeReport)} disabled={!form.diagnosis || submitting}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                {submitting ? 'Generating PDF…' : 'Submit & Send to Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConsultCard({ c, onReport, canJoin }: { c: Consultation; onReport: () => void; canJoin: boolean }) {
  const time = new Date(c.slot_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const date = new Date(c.slot_datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-brand-dark">{c.patient_name}</p>
        <p className="text-xs text-brand-gray">{c.patient_email} · {date} at {time} · {c.duration_minutes} min</p>
        {c.is_followup && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Free Follow-up</span>}
      </div>
      <div className="flex items-center gap-2">
        {c.report_id
          ? <span className="text-xs text-green-600 font-medium flex items-center gap-1"><FileText size={12} /> Report Sent</span>
          : c.status === 'confirmed' && <button onClick={onReport} className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-100"><FileText size={12} /> Fill Report</button>}
        {c.meet_link && (
          <a href={`/consult/room/${c.id}`} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${canJoin ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'}`}>
            <Video size={12} /> Join Meet
          </a>
        )}
      </div>
    </div>
  )
}
