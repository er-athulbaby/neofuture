'use client'

import { useState, useEffect } from 'react'
import { Stethoscope, Video, FileText, ChevronRight, ArrowLeft, Download, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Report {
  id: number
  diagnosis: string
  prescription: { medicine: string; strength: string; dosage_route: string; frequency: string; duration: string; quantity: string }[]
  pdf_url: string | null
  created_at: string
}

interface Appointment {
  id: number
  slot_datetime: string
  status: string
  doctor_name: string
  specialisation: string
  doctor_photo: string | null
  qualification: string
  is_followup: boolean
  meet_link: string | null
  neopulse_redeemed: number
  consultation_fee: number
  report_id: number | null
  diagnosis: string | null
  prescription: Report['prescription'] | null
  pdf_url: string | null
  report_date: string | null
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending: { label: 'Payment Pending', class: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', class: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', class: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-600' },
}

function canJoin(slot: string) {
  const t = new Date(slot).getTime()
  const now = Date.now()
  return now >= t - 15 * 60000 && now <= t + 60 * 60000
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/consult/appointments')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAppointments(data) })
      .finally(() => setLoading(false))
  }, [])

  const upcoming = appointments.filter(a => new Date(a.slot_datetime) > new Date() && a.status !== 'cancelled')
  const past = appointments.filter(a => new Date(a.slot_datetime) <= new Date() || a.status === 'cancelled')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-brand-gray" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" /> My Consultations
          </h1>
          <p className="text-xs text-brand-gray mt-0.5">Appointments, prescriptions, and doctor reports</p>
        </div>
      </div>

      <Link href="/consult"
        className="flex items-center gap-3 mb-6 bg-gradient-to-r from-primary to-neo-purple text-white rounded-2xl p-4 hover:opacity-95 transition-opacity">
        <Stethoscope size={20} />
        <div>
          <p className="font-semibold text-sm">Book a New Consultation</p>
          <p className="text-xs opacity-80">HD video · Digital prescription · Free 7-day follow-up</p>
        </div>
        <ChevronRight size={18} className="ml-auto" />
      </Link>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-bold text-brand-gray uppercase tracking-wide mb-3 flex items-center gap-2">
                <Calendar size={14} /> Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map(a => (
                  <AppointmentCard key={a.id} a={a} expanded={expanded === a.id} onToggle={() => setExpanded(prev => prev === a.id ? null : a.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-brand-gray uppercase tracking-wide mb-3">
                Past Consultations ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map(a => (
                  <AppointmentCard key={a.id} a={a} expanded={expanded === a.id} onToggle={() => setExpanded(prev => prev === a.id ? null : a.id)} />
                ))}
              </div>
            </section>
          )}

          {appointments.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Stethoscope size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="font-semibold text-brand-dark mb-1">No consultations yet</p>
              <p className="text-sm text-brand-gray mb-5">Book your first consultation with our specialist doctors</p>
              <Link href="/consult"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
                Book Consultation
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AppointmentCard({ a, expanded, onToggle }: { a: Appointment; expanded: boolean; onToggle: () => void }) {
  const dt = new Date(a.slot_datetime)
  const dateStr = dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const statusInfo = STATUS_LABELS[a.status] ?? { label: a.status, class: 'bg-gray-100 text-gray-600' }
  const joinable = canJoin(a.slot_datetime)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={onToggle}>
        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 overflow-hidden">
          {a.doctor_photo
            ? <img src={a.doctor_photo} alt={a.doctor_name} className="w-full h-full object-cover" />
            : <Stethoscope size={16} className="text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-brand-dark text-sm truncate">Dr. {a.doctor_name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusInfo.class}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-brand-gray mt-0.5">{a.specialisation} · {a.qualification}</p>
          <p className="text-xs text-brand-gray mt-1 flex items-center gap-1">
            <Calendar size={11} /> {dateStr} at {timeStr}
            {a.is_followup && <span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Free Follow-up</span>}
          </p>
          {/* Join button always visible on card face */}
          {a.status === 'confirmed' && (
            <div className="mt-2" onClick={e => e.stopPropagation()}>
              {a.meet_link
                ? <a href={a.meet_link} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${joinable ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                    <Video size={12} /> {joinable ? 'Join Google Meet' : `Opens at ${timeStr}`}
                  </a>
                : <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <Video size={12} /> Meeting link pending
                  </span>
              }
            </div>
          )}
        </div>
        <ChevronRight size={16} className={`text-gray-300 flex-shrink-0 transition-transform mt-0.5 ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {a.meet_link && a.status === 'confirmed' && (
              <a href={a.meet_link} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold transition-colors ${joinable ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'}`}>
                <Video size={13} /> {joinable ? 'Join Google Meet' : 'Not open yet'}
              </a>
            )}
            {a.pdf_url && (
              <a href={a.pdf_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                <Download size={13} /> Download Prescription
              </a>
            )}
          </div>

          {/* Diagnosis and prescription */}
          {a.diagnosis && (
            <div className="bg-blue-50 rounded-xl px-3 py-3">
              <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1"><FileText size={11} /> Diagnosis</p>
              <p className="text-xs text-blue-900">{a.diagnosis}</p>
            </div>
          )}

          {a.prescription && Array.isArray(a.prescription) && a.prescription.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-2">Prescription</p>
              <div className="space-y-1.5">
                {a.prescription.map((rx, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-brand-dark">{rx.medicine}</span>
                    {rx.strength && <span className="text-brand-gray">{rx.strength}</span>}
                    {rx.frequency && <span className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-brand-gray">{rx.frequency}</span>}
                    {rx.duration && <span className="text-brand-gray">for {rx.duration}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!a.report_id && a.status === 'confirmed' && (
            <p className="text-xs text-brand-gray bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              Your doctor's report will appear here after the consultation is completed.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
