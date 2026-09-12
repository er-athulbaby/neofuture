'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, FileText, Video, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface MyConsult {
  id: number
  slot_datetime: string
  status: string
  meet_link: string | null
  pdf_url: string | null
  diagnosis: string | null
  doctor_name: string
  specialisation: string
  doctor_photo: string | null
  is_followup: boolean
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
  })
}
function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  })
}

export default function MyConsultations() {
  const { data: session, status } = useSession()
  const [consultations, setConsultations] = useState<MyConsult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) { setLoading(false); return }
    fetch('/api/consult/appointments')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setConsultations(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session, status])

  if (status === 'loading' || loading) return null
  if (!session?.user?.id) return null
  if (consultations.length === 0) return null

  const upcoming = consultations.filter(c => new Date(c.slot_datetime) >= new Date() && c.status !== 'cancelled')
  const past = consultations.filter(c => new Date(c.slot_datetime) < new Date() || c.status === 'completed')

  function canJoin(slot: string) {
    const t = new Date(slot).getTime(); const now = Date.now()
    return now >= t - 15 * 60000 && now <= t + 60 * 60000
  }

  function statusChip(c: MyConsult) {
    if (c.status === 'completed') return { label: 'Completed', bg: '#ECFDF5', color: '#059669' }
    if (c.status === 'cancelled') return { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626' }
    if (c.status === 'confirmed') return { label: 'Confirmed', bg: '#EFF6FF', color: '#1D4ED8' }
    return { label: 'Pending', bg: '#FFFBEB', color: '#D97706' }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pb-12">
      <h2 className="text-xl font-bold text-brand-dark mb-6">My Consultations</h2>

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-brand-gray uppercase tracking-wider mb-3">Upcoming</h3>
          <div className="flex flex-col gap-3">
            {upcoming.map(c => {
              const chip = statusChip(c)
              const joinable = canJoin(c.slot_datetime)
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  {c.doctor_photo
                    ? <img src={c.doctor_photo} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" alt="" />
                    : <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">{c.doctor_name.charAt(0)}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-dark text-sm">{c.doctor_name}</div>
                    <div className="text-xs text-brand-gray">{c.specialisation}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-brand-gray">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(c.slot_datetime)}</span>
                      <span>{fmtTime(c.slot_datetime)}</span>
                      {c.is_followup && <span className="text-green-600 font-semibold">Follow-up</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: chip.bg, color: chip.color }}>{chip.label}</span>
                    {c.meet_link && (
                      <a href={c.meet_link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold no-underline"
                        style={{ background: joinable ? '#0EA5C8' : '#F3F4F6', color: joinable ? '#fff' : '#6B7280' }}>
                        <Video size={11} /> {joinable ? 'Join' : 'Link'}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-brand-gray uppercase tracking-wider mb-3">Past Consultations</h3>
          <div className="flex flex-col gap-3">
            {past.slice(0, 5).map(c => {
              const chip = statusChip(c)
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  {c.doctor_photo
                    ? <img src={c.doctor_photo} className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{c.doctor_name.charAt(0)}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-brand-dark text-sm">{c.doctor_name}</div>
                    <div className="text-xs text-brand-gray flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(c.slot_datetime)}</span>
                      {c.diagnosis && <span className="truncate max-w-xs">{c.diagnosis}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: chip.bg, color: chip.color }}>{chip.label}</span>
                    {c.pdf_url && (
                      <a href={`/api/pdf-link?url=${encodeURIComponent(c.pdf_url)}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold no-underline"
                        style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                        <FileText size={11} /> PDF
                      </a>
                    )}
                    <Link href={`/account/appointments`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold no-underline"
                      style={{ background: '#F3F4F6', color: '#374151' }}>
                      <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          {past.length > 5 && (
            <div className="text-center mt-4">
              <Link href="/account/appointments" className="text-sm text-primary font-semibold hover:underline">
                View all {past.length} past consultations →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
