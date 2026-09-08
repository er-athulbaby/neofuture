'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit3, Save, X, FileText, Activity,
  Calendar, Clock, ChevronRight, User, Pill,
  FlaskConical, StickyNote, Heart, Zap
} from 'lucide-react'

/* ─── Types ─── */
interface Vitals { dob: string | null; weight_kg: number | null; height_cm: number | null; blood_pressure: string | null; pulse_bpm: number | null; updated_at: string | null }
interface Consultation {
  id: number; slot_datetime: string; status: string; is_followup: boolean
  lab_reports: { key: string; name: string; size: number; type: string }[]
  diagnosis: string | null; notes: string | null; prescription: PrescriptionItem[] | null
  additional_instructions: string | null; report_date: string | null
}
interface PrescriptionItem { medicine: string; strength: string; dosage_route: string; frequency: string; duration: string; quantity: string }
interface PatientDetail {
  patient: { id: string; name: string; email: string; phone: string | null }
  vitals: Vitals | null
  consultations: Consultation[]
}

const TEAL = '#0EA5C8'
const DARK = '#0D1B35'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function age(dob: string | null) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let y = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--
  const months = ((now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth())
  return { years: y, months: months % 12 }
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ─── Nav items (no chat/calls/messages) ─── */
type Tab = 'overview' | 'history' | 'medications' | 'results' | 'files' | 'billing'
const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'results', label: 'Lab Results', icon: FlaskConical },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'billing', label: 'Billing', icon: Activity },
]

/* ─── Vitals Editor ─── */
function VitalsPanel({ vitals, patientId, onSaved }: { vitals: Vitals | null; patientId: string; onSaved: (v: Vitals) => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    dob: vitals?.dob ? vitals.dob.split('T')[0] : '',
    weight_kg: vitals?.weight_kg ?? '',
    height_cm: vitals?.height_cm ?? '',
    blood_pressure: vitals?.blood_pressure ?? '',
    pulse_bpm: vitals?.pulse_bpm ?? '',
  })

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/doctor/patients/${patientId}/vitals`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      onSaved({ ...form, dob: form.dob || null, weight_kg: Number(form.weight_kg) || null, height_cm: Number(form.height_cm) || null, blood_pressure: form.blood_pressure || null, pulse_bpm: Number(form.pulse_bpm) || null, updated_at: new Date().toISOString() })
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Edit Vitals</span>
          <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} color="#9CA3AF" /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Date of Birth', key: 'dob', type: 'date' },
            { label: 'Weight (kg)', key: 'weight_kg', type: 'number' },
            { label: 'Height (cm)', key: 'height_cm', type: 'number' },
            { label: 'Blood Pressure', key: 'blood_pressure', type: 'text', placeholder: '120/80' },
            { label: 'Pulse (BPM)', key: 'pulse_bpm', type: 'number' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type} value={(form as Record<string, string | number>)[key] as string} placeholder={placeholder}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', border: '1px solid #E5E9F0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #E5E9F0', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', background: TEAL, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Save size={14} /> {saving ? 'Saving…' : 'Save Vitals'}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Vitals</span>
        <button onClick={() => setEditing(true)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7,
          border: '1px solid #E5E9F0', background: '#F9FAFB', color: '#374151', fontSize: 12, cursor: 'pointer'
        }}>
          <Edit3 size={12} /> Edit
        </button>
      </div>

      {vitals?.blood_pressure || vitals?.pulse_bpm ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '16px 12px', background: '#FEF3C7', borderRadius: 12 }}>
            <Heart size={22} color="#D97706" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Blood Pressure</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#78350F', lineHeight: 1 }}>{vitals.blood_pressure ?? '—'}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px 12px', background: '#FCE7F3', borderRadius: 12 }}>
            <Zap size={22} color="#BE185D" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 11, color: '#9D174D', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pulse</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#831843', lineHeight: 1 }}>
              {vitals.pulse_bpm ?? '—'} <span style={{ fontSize: 13, fontWeight: 400 }}>BPM</span>
            </div>
          </div>
          {vitals.weight_kg && (
            <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Weight</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#14532D' }}>{vitals.weight_kg} kg</span>
            </div>
          )}
          {vitals.height_cm && (
            <div style={{ padding: '10px 14px', background: '#EFF6FF', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>Height</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1E3A8A' }}>{vitals.height_cm} cm</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
          <Activity size={28} color="#E5E9F0" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, margin: 0 }}>No vitals recorded yet</p>
          <p style={{ fontSize: 12, margin: '4px 0 0', color: '#CBD5E0' }}>Click Edit to add patient vitals</p>
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ─── */
export default function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = use(params)
  const router = useRouter()
  const [data, setData] = useState<PatientDetail | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/doctor/patients/${patientId}`).then(r => r.json()).then(d => {
      if (d.patient) setData(d)
      setLoading(false)
    })
  }, [patientId])

  async function viewLab(key: string) {
    const res = await fetch(`/api/doctor/lab-report?key=${encodeURIComponent(key)}`)
    const d = await res.json()
    if (d.url) window.open(d.url, '_blank')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F8' }}>
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading patient profile…</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F8' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#374151', fontWeight: 600 }}>Patient not found</p>
          <button onClick={() => router.push('/doctor/patients')} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E9F0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Back to Patients</button>
        </div>
      </div>
    )
  }

  const { patient, vitals: initVitals, consultations } = data
  const [vitals, setVitals] = useState<Vitals | null>(initVitals)

  const a = age(vitals?.dob ?? null)
  const latestRx = consultations.find(c => c.prescription && c.prescription.length > 0)?.prescription ?? []
  const allNotes = consultations.filter(c => c.diagnosis || c.notes)
  const allLabFiles = consultations.flatMap(c => (c.lab_reports ?? []).map(r => ({ ...r, date: c.slot_datetime })))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F0F4F8', fontFamily: "'Geist', system-ui, sans-serif" }}>

      {/* ── Slim icon strip ── */}
      <div style={{
        width: 56, background: DARK, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 0', gap: 4, flexShrink: 0
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Activity size={16} color="#fff" />
        </div>
        {NAV.map(({ id, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} title={id} style={{
            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: tab === id ? TEAL : 'transparent',
            color: tab === id ? '#fff' : '#64748B',
            transition: 'background 0.15s'
          }}>
            <Icon size={17} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push('/doctor/patients')} style={{
          width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', color: '#64748B'
        }}>
          <ArrowLeft size={17} />
        </button>
      </div>

      {/* ── Text nav ── */}
      <div style={{ width: 180, background: '#fff', borderRight: '1px solid #E5E9F0', padding: '20px 0', flexShrink: 0 }}>
        {/* Patient mini card */}
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #F3F4F6', marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: '#E0F2FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#0369A1', margin: '0 auto 10px'
          }}>
            {initials(patient.name)}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: DARK, textAlign: 'center', marginBottom: 2 }}>{patient.name}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
            {consultations.length} consultation{consultations.length !== 1 ? 's' : ''}
          </div>
        </div>

        {NAV.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            width: '100%', padding: '10px 20px', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: 'transparent', fontSize: 13, fontWeight: tab === id ? 700 : 500,
            color: tab === id ? TEAL : '#374151',
            borderLeft: tab === id ? `3px solid ${TEAL}` : '3px solid transparent',
            transition: 'all 0.15s'
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Topbar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #E5E9F0', padding: '0 24px',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: DARK, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {NAV.find(n => n.id === tab)?.label}
          </span>
          <button onClick={() => router.push('/doctor/patients')} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            borderRadius: 8, border: '1px solid #E5E9F0', background: '#F9FAFB',
            color: '#374151', fontSize: 12, cursor: 'pointer'
          }}>
            <ArrowLeft size={13} /> All Patients
          </button>
        </div>

        <div style={{ padding: 24 }}>

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
              {/* Left col */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Patient card */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E9F0', padding: 24 }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%', background: '#E0F2FE', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 700, color: '#0369A1',
                      border: `3px solid ${TEAL}`
                    }}>
                      {initials(patient.name)}
                    </div>
                    <div>
                      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: DARK }}>{patient.name}</h2>
                      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#94A3B8' }}>
                        {consultations[0]?.diagnosis ? consultations[0].diagnosis.split(' ').slice(0, 4).join(' ') : 'Patient'}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                          { label: 'DOB', value: vitals?.dob ? fmtDate(vitals.dob) : '—' },
                          { label: 'Age', value: a ? `${a.years}y ${a.months}m` : '—' },
                          { label: 'Weight', value: vitals?.weight_kg ? `${vitals.weight_kg} kg` : '—' },
                          { label: 'Height', value: vitals?.height_cm ? `${vitals.height_cm} cm` : '—' },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginTop: 2 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 20, paddingTop: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Email', value: patient.email },
                        { label: 'Phone', value: patient.phone ?? '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                          <div style={{ fontSize: 13, color: '#374151', marginTop: 3 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E9F0', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <StickyNote size={16} color={TEAL} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Notes</span>
                  </div>
                  {allNotes.length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>No consultation notes yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {allNotes.slice(0, 3).map(c => (
                        <div key={c.id} style={{ borderLeft: `3px solid ${TEAL}`, paddingLeft: 12 }}>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{fmtDate(c.slot_datetime)}</div>
                          {c.diagnosis && <p style={{ margin: '0 0 4px', fontSize: 13, color: DARK, fontWeight: 600 }}>{c.diagnosis}</p>}
                          {c.notes && <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{c.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right col */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Medications */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Pill size={15} color={TEAL} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Current Medications</span>
                  </div>
                  {latestRx.length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>No prescriptions yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {latestRx.map((rx, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{rx.medicine}</span>
                            {rx.strength && <span style={{ fontSize: 12, color: '#6B7280' }}> {rx.strength}</span>}
                            {rx.frequency && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{rx.frequency}{rx.duration ? ` · ${rx.duration}` : ''}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vitals */}
                <VitalsPanel vitals={vitals} patientId={patientId} onSaved={setVitals} />

                {/* Lab results */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <FlaskConical size={15} color={TEAL} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Lab Results</span>
                  </div>
                  {allLabFiles.length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>No lab files uploaded.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {allLabFiles.slice(0, 5).map((f, i) => (
                        <button key={i} onClick={() => viewLab(f.key)} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 10px', borderRadius: 8, border: '1px solid #F3F4F6',
                          background: '#F9FAFB', cursor: 'pointer', textAlign: 'left'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={14} color={TEAL} />
                            <span style={{ fontSize: 13, color: DARK }}>{f.name}</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtDate(f.date)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: DARK, margin: '0 0 16px' }}>Consultation History</h3>
              {consultations.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid #E5E9F0' }}>
                  <p style={{ color: '#9CA3AF', margin: 0 }}>No consultations found.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {consultations.map(c => (
                    <div key={c.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: c.diagnosis ? 12 : 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Calendar size={18} color={TEAL} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{fmtDate(c.slot_datetime)}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', gap: 8, marginTop: 2 }}>
                            <span style={{ textTransform: 'capitalize' }}>{c.status}</span>
                            {c.is_followup && <span style={{ color: '#059669', fontWeight: 600 }}>· Follow-up</span>}
                          </div>
                        </div>
                        <ChevronRight size={16} color="#CBD5E0" />
                      </div>
                      {c.diagnosis && (
                        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>DIAGNOSIS</div>
                          <p style={{ margin: 0, fontSize: 13, color: DARK }}>{c.diagnosis}</p>
                          {c.notes && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#374151' }}>{c.notes}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MEDICATIONS TAB ── */}
          {tab === 'medications' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: DARK, margin: '0 0 16px' }}>All Prescriptions</h3>
              {consultations.filter(c => c.prescription?.length).length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid #E5E9F0' }}>
                  <p style={{ color: '#9CA3AF', margin: 0 }}>No prescriptions on record.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {consultations.filter(c => c.prescription?.length).map(c => (
                    <div key={c.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20 }}>
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, fontWeight: 600 }}>
                        Prescribed on {fmtDate(c.slot_datetime)}
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC' }}>
                              {['Medicine', 'Strength', 'Route', 'Frequency', 'Duration', 'Qty'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E9F0' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {c.prescription!.map((rx, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                {[rx.medicine, rx.strength, rx.dosage_route, rx.frequency, rx.duration, rx.quantity].map((v, j) => (
                                  <td key={j} style={{ padding: '10px 12px', color: j === 0 ? DARK : '#374151', fontWeight: j === 0 ? 600 : 400 }}>{v || '—'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {c.additional_instructions && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFFBEB', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                          <strong>Instructions:</strong> {c.additional_instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RESULTS / FILES TAB ── */}
          {(tab === 'results' || tab === 'files') && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: DARK, margin: '0 0 16px' }}>
                {tab === 'results' ? 'Lab Results' : 'Uploaded Files'}
              </h3>
              {allLabFiles.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid #E5E9F0' }}>
                  <FlaskConical size={28} color="#E5E9F0" style={{ display: 'block', margin: '0 auto 12px' }} />
                  <p style={{ color: '#9CA3AF', margin: 0 }}>No files uploaded by this patient.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {allLabFiles.map((f, i) => (
                    <button key={i} onClick={() => viewLab(f.key)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 16,
                      borderRadius: 14, border: '1px solid #E5E9F0', background: '#fff', cursor: 'pointer', textAlign: 'left'
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={18} color={TEAL} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{fmtDate(f.date)}</div>
                      </div>
                      <ChevronRight size={14} color="#CBD5E0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BILLING TAB ── */}
          {tab === 'billing' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: DARK, margin: '0 0 16px' }}>Billing Summary</h3>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E9F0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Date', 'Type', 'Status', 'Amount'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E9F0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '12px 16px', color: DARK, fontWeight: 500 }}>{fmtDate(c.slot_datetime)}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{c.is_followup ? 'Follow-up' : 'Consultation'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                            background: c.status === 'completed' ? '#ECFDF5' : '#FFFBEB',
                            color: c.status === 'completed' ? '#059669' : '#D97706',
                            textTransform: 'capitalize'
                          }}>{c.status}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>
                          {c.is_followup ? <span style={{ color: '#059669', fontWeight: 600 }}>Free</span> : '—'}
                        </td>
                      </tr>
                    ))}
                    {consultations.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF' }}>No billing records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
