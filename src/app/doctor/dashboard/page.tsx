'use client'

import { useState, useEffect } from 'react'
import {
  Video, FileText, Plus, Trash2, Calendar, Users, Clock, Bell,
  LogOut, Settings, LayoutDashboard, X, AlertCircle,
  Activity, TrendingUp, Link as LinkIcon, Edit
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/* ─────────── Types ─────────── */
interface DoctorProfile {
  id: number; name: string; photo_url: string | null
  qualification: string | null; specialisation: string | null; registration_no: string | null
  google_refresh_token: string | null
}
interface Consultation {
  id: number; patient_id: string; patient_name: string; patient_email: string; slot_datetime: string
  duration_minutes: number; meet_link: string; status: string; report_id: number | null; report_pdf_url: string | null
  is_followup: boolean; lab_reports: { key: string; name: string; size: number; type: string }[]
}
interface ReportForm {
  diagnosis: string; notes: string; additional_instructions: string
  followup_weeks: number; followup_date: string
  prescription: { medicine: string; strength: string; dosage_route: string; frequency: string; duration: string; quantity: string }[]
}

const EMPTY_RX = { medicine: '', strength: '', dosage_route: '', frequency: '', duration: '', quantity: '' }
const INIT_FORM: ReportForm = {
  diagnosis: '', notes: '', additional_instructions: '', followup_weeks: 6, followup_date: '',
  prescription: [{ ...EMPTY_RX }],
}

/* ─────────── Helpers ─────────── */
function fmt(slot: string) {
  const d = new Date(slot)
  return {
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    shortDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    isToday: d.toDateString() === new Date().toDateString(),
    isPast: d < new Date(),
    isFuture: d > new Date(),
  }
}
function canJoin(slot: string) {
  const t = new Date(slot).getTime()
  const now = Date.now()
  return now >= t - 15 * 60000 && now <= t + 60 * 60000
}
function meetingOver(slot: string) {
  return Date.now() > new Date(slot).getTime() + 60 * 60000
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

/* ─────────── Stat Card ─────────── */
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#0F1B2D', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

/* ─────────── Appointment Card ─────────── */
function AppointCard({
  c, onReport, onEditReport, onMeetGenerated
}: {
  c: Consultation
  onReport: () => void
  onEditReport: () => void
  onMeetGenerated: (id: number, link: string) => void
}) {
  const router = useRouter()
  const f = fmt(c.slot_datetime)
  const join = canJoin(c.slot_datetime)
  const ended = meetingOver(c.slot_datetime)
  const [genMeet, setGenMeet] = useState(false)
  const [meetErr, setMeetErr] = useState('')
  const [genPdf, setGenPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(c.report_pdf_url)

  async function viewLab(key: string) {
    const res = await fetch(`/api/doctor/lab-report?key=${encodeURIComponent(key)}`)
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  async function generatePdf() {
    setGenPdf(true)
    const res = await fetch(`/api/doctor/consultations/${c.id}/report/pdf`, { method: 'POST' })
    const data = await res.json()
    setGenPdf(false)
    if (res.ok && data.pdf_url) setPdfUrl(data.pdf_url)
  }

  async function generateMeet() {
    setGenMeet(true); setMeetErr('')
    const res = await fetch(`/api/doctor/consultations/${c.id}/meet`, { method: 'POST' })
    const data = await res.json()
    setGenMeet(false)
    if (res.ok) onMeetGenerated(c.id, data.meet_link)
    else setMeetErr(data.error ?? 'Failed')
  }

  const statusColor = f.isToday ? '#0EA5C8' : f.isPast ? '#9CA3AF' : '#7C3AED'
  const statusLabel = f.isToday ? 'Today' : f.isPast ? 'Past' : 'Upcoming'

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #E5E9F0',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Top accent */}
      <div style={{ height: 3, background: statusColor }} />

      <div style={{ padding: '18px 20px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div
            onClick={() => c.patient_id && router.push(`/doctor/patients/${c.patient_id}`)}
            style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: c.patient_id ? 'pointer' : 'default', flex: 1 }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#E0F2FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#0369A1', flexShrink: 0
            }}>
              {initials(c.patient_name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0F1B2D', textDecoration: c.patient_id ? 'underline' : 'none', textDecorationColor: '#CBD5E0' }}>{c.patient_name}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{c.patient_email}</div>
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: statusColor + '1A', color: statusColor, letterSpacing: 0.3
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Time row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151' }}>
            <Calendar size={13} color="#0EA5C8" />
            <span>{f.shortDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151' }}>
            <Clock size={13} color="#0EA5C8" />
            <span>{f.time}</span>
          </div>
          {c.is_followup && (
            <span style={{ fontSize: 11, background: '#D1FAE5', color: '#065F46', borderRadius: 10, padding: '2px 8px', fontWeight: 600 }}>
              Follow-up
            </span>
          )}
        </div>

        {/* Lab reports */}
        {Array.isArray(c.lab_reports) && c.lab_reports.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Lab Reports</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {c.lab_reports.map((r, i) => (
                <button key={i} onClick={() => viewLab(r.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                  background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE',
                  borderRadius: 8, padding: '4px 10px', cursor: 'pointer'
                }}>
                  <FileText size={11} /> {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {meetErr && (
          <div style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 10px', marginBottom: 10 }}>
            {meetErr}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {c.meet_link && !ended ? (
          <a href={c.meet_link} target="_blank" rel="noopener noreferrer" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            background: join ? '#0EA5C8' : '#F3F4F6', color: join ? '#fff' : '#6B7280',
            transition: 'opacity 0.15s', minWidth: 0
          }}>
            <Video size={14} /> {join ? 'Join Meet' : 'Meet Link'}
          </a>
        ) : !ended ? (
          <button onClick={generateMeet} disabled={genMeet} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD',
            opacity: genMeet ? 0.6 : 1
          }}>
            <LinkIcon size={14} /> {genMeet ? 'Creating…' : 'Gen Meet'}
          </button>
        ) : null}

        {c.status === 'confirmed' && (
          c.report_id ? (
            <>
            {pdfUrl ? (
              <a href={`/api/pdf-link?url=${encodeURIComponent(pdfUrl)}`} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0'
              }}>
                <FileText size={14} /> Download PDF
              </a>
            ) : (
              <button onClick={generatePdf} disabled={genPdf} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA',
                opacity: genPdf ? 0.6 : 1
              }}>
                <FileText size={14} /> {genPdf ? 'Generating…' : 'Generate PDF'}
              </button>
            )}
            <button onClick={onEditReport} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE'
            }}>
              <Edit size={14} /> Edit
            </button>
            </>
          ) : (
            <button onClick={onReport} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA'
            }}>
              <FileText size={14} /> Fill Report
            </button>
          )
        )}
      </div>
    </div>
  )
}

/* ─────────── Main Dashboard ─────────── */
export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [activeNav, setActiveNav] = useState<'today' | 'upcoming' | 'past'>('today')
  const [activeReport, setActiveReport] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<ReportForm>(INIT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [lastPdfUrl, setLastPdfUrl] = useState<string | null>(null)
  const [connected, setConnected] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rxOptions, setRxOptions] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('connected')) setConnected('Google Calendar connected!')
    if (p.get('error')) setConnected('Calendar connection failed.')

    Promise.all([
      fetch('/api/doctor/profile').then(r => r.json()),
      fetch('/api/doctor/consultations').then(r => r.json()),
      fetch('/api/doctor/prescription-options').then(r => r.json()),
    ]).then(([profile, cons, opts]) => {
      if (profile && !profile.error) setDoctor(profile)
      if (Array.isArray(cons)) setConsultations(cons)
      if (opts && !opts.error) {
        const flat: Record<string, string[]> = {}
        for (const [k, v] of Object.entries(opts)) flat[k] = (v as { value: string }[]).map(x => x.value)
        setRxOptions(flat)
      }
    })
  }, [])

  const today = consultations.filter(c => fmt(c.slot_datetime).isToday)
  const upcoming = consultations.filter(c => fmt(c.slot_datetime).isFuture && !fmt(c.slot_datetime).isToday)
  const past = consultations.filter(c => fmt(c.slot_datetime).isPast && !fmt(c.slot_datetime).isToday)

  const viewMap = { today, upcoming, past }
  const displayed = viewMap[activeNav]

  function updateRx(i: number, field: string, value: string) {
    setForm(f => {
      const rx = [...f.prescription]; rx[i] = { ...rx[i], [field]: value }
      return { ...f, prescription: rx }
    })
  }

  async function openEditReport(c: Consultation) {
    const res = await fetch(`/api/doctor/consultations/${c.id}/report`)
    if (res.ok) {
      const d = await res.json()
      setForm({
        diagnosis: d.diagnosis ?? '',
        notes: d.notes ?? '',
        additional_instructions: d.additional_instructions ?? '',
        followup_weeks: d.followup_weeks ?? 6,
        followup_date: d.followup_date ? d.followup_date.slice(0, 10) : '',
        prescription: Array.isArray(d.prescription) && d.prescription.length ? d.prescription : [{ ...EMPTY_RX }],
      })
    }
    setIsEditing(true)
    setActiveReport(c.id)
  }

  async function submitReport(consultationId: number) {
    setSubmitting(true); setSubmitError('')
    try {
      const res = await fetch(`/api/doctor/consultations/${consultationId}/report`, {
        method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setForm(INIT_FORM)
        if (data.pdf_url) setLastPdfUrl(data.pdf_url)
        else setActiveReport(null)
        const updated = await fetch('/api/doctor/consultations').then(r => r.json())
        if (Array.isArray(updated)) setConsultations(updated)
      } else {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error ?? `Error ${res.status}`)
      }
    } catch { setSubmitError('Network error — please try again') }
    finally { setSubmitting(false) }
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Geist', system-ui, sans-serif", background: '#F0F4F8' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0, overflow: 'hidden',
        background: '#0D1B35', display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s, min-width 0.25s', flexShrink: 0
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#0EA5C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>NeoFuture</div>
              <div style={{ color: '#64748B', fontSize: 11 }}>Doctor Portal</div>
            </div>
          </div>
        </div>

        {/* Doctor Profile */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {doctor?.photo_url ? (
              <img src={doctor.photo_url} alt={doctor.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0EA5C8' }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0EA5C8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {doctor ? initials(doctor.name) : 'Dr'}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Dr. {doctor?.name ?? '…'}
              </div>
              <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{doctor?.specialisation ?? doctor?.qualification ?? 'Specialist'}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          {[
            { id: 'today', label: "Today's Appointments", icon: LayoutDashboard, count: today.length },
            { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: upcoming.length },
            { id: 'past', label: 'Past Consultations', icon: Users, count: past.length },
          ].map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setActiveNav(id as typeof activeNav)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 2,
              background: activeNav === id ? '#0EA5C8' : 'transparent',
              color: activeNav === id ? '#fff' : '#94A3B8', textAlign: 'left',
              transition: 'background 0.15s, color 0.15s'
            }}>
              <Icon size={16} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: activeNav === id ? 'rgba(255,255,255,0.25)' : '#1E3A5F', color: '#fff'
                }}>{count}</span>
              )}
            </button>
          ))}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Link href="/doctor/patients" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#94A3B8', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
              <Users size={16} /> My Patients
            </Link>
            <Link href="/doctor/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#94A3B8', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
              <Settings size={16} /> Prescription Settings
            </Link>
            <a href="/api/doctor/google/connect" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 10, textDecoration: 'none', color: '#94A3B8', fontSize: 13,
              fontWeight: 500, marginBottom: 2
            }}>
              <LinkIcon size={16} /> Connect Calendar
            </a>
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent',
              color: '#94A3B8', textAlign: 'left', fontSize: 13, fontWeight: 500
            }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </nav>

        {/* Reg number */}
        {doctor?.registration_no && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Reg No.</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{doctor.registration_no}</div>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #E5E9F0', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E9F0',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 14, height: 2, background: '#6B7280', borderRadius: 1 }} />)}
            </div>
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0F1B2D' }}>
              {activeNav === 'today' ? "Today's Appointments"
                : activeNav === 'upcoming' ? 'Upcoming Appointments'
                  : 'Past Consultations'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{dateStr}</div>
          </div>

          {connected && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px', borderRadius: 8,
              background: connected.includes('connected') ? '#ECFDF5' : '#FEF2F2',
              color: connected.includes('connected') ? '#059669' : '#DC2626',
              border: `1px solid ${connected.includes('connected') ? '#A7F3D0' : '#FECACA'}`
            }}>
              <AlertCircle size={13} />{connected}
              <button onClick={() => setConnected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1 }}>
                <X size={13} />
              </button>
            </div>
          )}

          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#0EA5C8',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <Bell size={16} color="#fff" />
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            <StatCard label="Total Consultations" value={consultations.length} icon={Users} color="#0EA5C8" />
            <StatCard label="Today" value={today.length} icon={LayoutDashboard} color="#7C3AED" />
            <StatCard label="Upcoming" value={upcoming.length} icon={Calendar} color="#F59E0B" />
            <StatCard label="Reports Pending" value={consultations.filter(c => c.status === 'confirmed' && !c.report_id && fmt(c.slot_datetime).isPast).length} icon={TrendingUp} color="#EF4444" />
          </div>

          {/* Section heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: '#0F1B2D', margin: 0 }}>
                {activeNav === 'today' ? "Today's Schedule"
                  : activeNav === 'upcoming' ? 'Upcoming Schedule'
                    : 'Past Consultations'}
              </h2>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
                {displayed.length} {displayed.length === 1 ? 'appointment' : 'appointments'}
              </p>
            </div>
          </div>

          {/* Grid */}
          {displayed.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 16, padding: '60px 24px', textAlign: 'center',
              border: '1px solid #E5E9F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Calendar size={24} color="#0EA5C8" />
              </div>
              <p style={{ color: '#374151', fontWeight: 600, fontSize: 15, margin: '0 0 8px' }}>No appointments</p>
              <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>
                {activeNav === 'today' ? "You have no appointments scheduled for today."
                  : activeNav === 'upcoming' ? "No upcoming appointments at the moment."
                    : "No past consultations to display."}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16
            }}>
              {displayed.map(c => (
                <AppointCard
                  key={c.id}
                  c={c}
                  onReport={() => { setIsEditing(false); setActiveReport(c.id); setForm(INIT_FORM) }}
                  onEditReport={() => openEditReport(c)}
                  onMeetGenerated={(id, link) => setConsultations(prev => prev.map(x => x.id === id ? { ...x, meet_link: link } : x))}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Report Modal ── */}
      {lastPdfUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileText size={26} color="#059669" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#0F1B2D', marginBottom: 8 }}>Report Generated!</div>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px' }}>Prescription PDF has been generated and emailed to the patient.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={`/api/pdf-link?url=${encodeURIComponent(lastPdfUrl)}`} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px', borderRadius: 12, background: '#0EA5C8', color: '#fff',
                fontSize: 14, fontWeight: 700, textDecoration: 'none'
              }}>
                <FileText size={16} /> Download Prescription PDF
              </a>
              <button onClick={() => { setLastPdfUrl(null); setActiveReport(null) }} style={{
                padding: '12px', borderRadius: 12, border: '1px solid #E5E9F0', background: '#fff',
                color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {activeReport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto', padding: '32px 16px'
        }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="#C2410C" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0F1B2D' }}>Post-Consultation Report</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {consultations.find(c => c.id === activeReport)?.patient_name}
                  </div>
                </div>
              </div>
              <button onClick={() => { setIsEditing(false); setActiveReport(null); setSubmitError('') }} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E9F0',
                background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <X size={15} color="#6B7280" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Diagnosis / Clinical Assessment *">
                <textarea
                  value={form.diagnosis}
                  onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                  rows={2}
                  style={textareaStyle}
                />
              </Field>
              <Field label="Doctor Notes">
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={textareaStyle} />
              </Field>

              {/* Prescription */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={labelStyle}>Prescription</label>
                  <button
                    onClick={() => setForm(f => ({ ...f, prescription: [...f.prescription, { ...EMPTY_RX }] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0EA5C8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Plus size={13} /> Add Medicine
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.prescription.map((rx, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, background: '#F8FAFC', borderRadius: 10, padding: 10 }}>
                      {(['medicine', 'strength', 'dosage_route', 'frequency', 'duration', 'quantity'] as const).map(field => (
                        <div key={field}>
                          <datalist id={`dl-${field}`}>
                            {(rxOptions[field] ?? []).map(v => <option key={v} value={v} />)}
                          </datalist>
                          <input
                            list={`dl-${field}`}
                            value={(rx as Record<string, string>)[field]}
                            onChange={e => updateRx(i, field, e.target.value)}
                            placeholder={field.replace('_', ' ')}
                            style={inputStyle}
                          />
                        </div>
                      ))}
                      {form.prescription.length > 1 && (
                        <button
                          onClick={() => setForm(f => ({ ...f, prescription: f.prescription.filter((_, j) => j !== i) }))}
                          style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Field label="Additional Instructions (one per line)">
                <textarea
                  value={form.additional_instructions}
                  onChange={e => setForm(f => ({ ...f, additional_instructions: e.target.value }))}
                  rows={2}
                  placeholder={"Take medicines after food\nAvoid stress"}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Follow-up Date">
                <input type="date" value={form.followup_date} onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))} style={inputStyle} />
              </Field>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6' }}>
              {submitError && (
                <div style={{ fontSize: 13, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                  {submitError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setIsEditing(false); setActiveReport(null); setSubmitError('') }}
                  style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid #E5E9F0', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitReport(activeReport)}
                  disabled={!form.diagnosis || submitting}
                  style={{
                    flex: 2, padding: '10px', borderRadius: 12, border: 'none',
                    background: !form.diagnosis || submitting ? '#E5E9F0' : '#0EA5C8',
                    color: !form.diagnosis || submitting ? '#9CA3AF' : '#fff',
                    fontSize: 14, fontWeight: 700, cursor: !form.diagnosis || submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Generating PDF…' : 'Submit & Send to Patient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────── Style helpers ─────────── */
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', marginBottom: 6
}
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #E5E9F0', borderRadius: 8, padding: '8px 10px',
  fontSize: 13, color: '#0F1B2D', outline: 'none', background: '#fff', boxSizing: 'border-box'
}
const textareaStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #E5E9F0', borderRadius: 10, padding: '10px 12px',
  fontSize: 13, color: '#0F1B2D', outline: 'none', resize: 'vertical', background: '#fff', boxSizing: 'border-box'
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}
