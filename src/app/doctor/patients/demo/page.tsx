'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit3, Save, X, FileText, Activity,
  Calendar, Clock, ChevronRight, User, Pill,
  FlaskConical, StickyNote, Heart, Zap
} from 'lucide-react'

const TEAL = '#0EA5C8'
const DARK = '#0D1B35'

type Tab = 'overview' | 'history' | 'medications' | 'results' | 'files' | 'billing'

const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'results', label: 'Lab Results', icon: FlaskConical },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'billing', label: 'Billing', icon: Activity },
]

const DEMO = {
  patient: { name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 98765 43210' },
  vitals: { dob: '1995-03-13', weight_kg: 58, height_cm: 162, blood_pressure: '118/76', pulse_bpm: 72 },
  medications: [
    { medicine: 'Metformin', strength: '500mg', dosage_route: 'Oral', frequency: 'Twice daily', duration: '3 months', quantity: '180 tabs' },
    { medicine: 'Inositol', strength: '2g', dosage_route: 'Oral', frequency: 'Once daily', duration: '3 months', quantity: '90 sachets' },
    { medicine: 'Vitamin D3', strength: '60,000 IU', dosage_route: 'Oral', frequency: 'Weekly', duration: '2 months', quantity: '8 caps' },
  ],
  notes: [
    { date: '2025-01-12', diagnosis: 'PCOS — Polycystic Ovary Syndrome', notes: 'Patient presents with irregular cycles (35–45 days), mild hirsutism, and elevated androgen markers. BMI 22.1. Ultrasound confirms multiple small cysts on both ovaries. Starting Metformin for insulin resistance.' },
    { date: '2024-10-05', diagnosis: 'PCOS follow-up', notes: 'Cycles improved to 32 days. Androgen levels trending down. Continue current medication.' },
  ],
  consultations: [
    { date: '2025-01-12', status: 'completed', type: 'Consultation', followup: false },
    { date: '2024-10-05', status: 'completed', type: 'Follow-up', followup: true },
    { date: '2024-07-20', status: 'completed', type: 'Consultation', followup: false },
  ],
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function age(dob: string) {
  const d = new Date(dob)
  const y = new Date().getFullYear() - d.getFullYear()
  return `${y}y ${new Date().getMonth() - d.getMonth() + (y * 12)}m`
}

export default function DemoPatientPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F0F4F8', fontFamily: "'Geist', system-ui, sans-serif" }}>

      {/* Demo banner */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: '#FEF3C7', borderBottom: '1px solid #FCD34D',
        padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
      }}>
        <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
          Demo Preview — this is sample data. Real patient profiles load once confirmed consultations exist.
        </span>
        <button onClick={() => router.push('/doctor/patients')} style={{
          fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #D97706',
          background: '#fff', color: '#92400E', cursor: 'pointer', fontWeight: 600
        }}>Back</button>
      </div>

      {/* Slim icon strip */}
      <div style={{ width: 56, background: DARK, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '70px 0 20px', gap: 4, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Activity size={16} color="#fff" />
        </div>
        {NAV.map(({ id, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} title={id} style={{
            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: tab === id ? TEAL : 'transparent', color: tab === id ? '#fff' : '#64748B',
          }}>
            <Icon size={17} />
          </button>
        ))}
      </div>

      {/* Text nav */}
      <div style={{ width: 180, background: '#fff', borderRight: '1px solid #E5E9F0', padding: '70px 0 20px', flexShrink: 0 }}>
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #F3F4F6', marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#0369A1', margin: '0 auto 10px' }}>PS</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: DARK, textAlign: 'center', marginBottom: 2 }}>{DEMO.patient.name}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>3 consultations</div>
        </div>
        {NAV.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            width: '100%', padding: '10px 20px', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: 'transparent', fontSize: 13, fontWeight: tab === id ? 700 : 500,
            color: tab === id ? TEAL : '#374151',
            borderLeft: tab === id ? `3px solid ${TEAL}` : '3px solid transparent',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto', paddingTop: 44 }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E9F0', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: DARK, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {NAV.find(n => n.id === tab)?.label}
          </span>
          <button onClick={() => router.push('/doctor/patients')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E9F0', background: '#F9FAFB', color: '#374151', fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={13} /> All Patients
          </button>
        </div>

        <div style={{ padding: 24 }}>

          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Patient card */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E9F0', padding: 24 }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#E0F2FE', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#0369A1', border: `3px solid ${TEAL}` }}>PS</div>
                    <div>
                      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: DARK }}>{DEMO.patient.name}</h2>
                      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#94A3B8' }}>PCOS</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                          { label: 'DOB', value: fmtDate(DEMO.vitals.dob) },
                          { label: 'Age', value: '30y 5m' },
                          { label: 'Weight', value: `${DEMO.vitals.weight_kg} kg` },
                          { label: 'Height', value: `${DEMO.vitals.height_cm} cm` },
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
                      {[{ label: 'Email', value: DEMO.patient.email }, { label: 'Phone', value: DEMO.patient.phone }].map(({ label, value }) => (
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
                    <StickyNote size={16} color={TEAL} /><span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Notes</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {DEMO.notes.map((n, i) => (
                      <div key={i} style={{ borderLeft: `3px solid ${TEAL}`, paddingLeft: 12 }}>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{fmtDate(n.date)}</div>
                        <p style={{ margin: '0 0 4px', fontSize: 13, color: DARK, fontWeight: 600 }}>{n.diagnosis}</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{n.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right col */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Medications */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Pill size={15} color={TEAL} /><span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Current Medications</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {DEMO.medications.map((rx, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{rx.medicine}</span>
                          <span style={{ fontSize: 12, color: '#6B7280' }}> {rx.strength}</span>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{rx.frequency} · {rx.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vitals */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Vitals</span>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E9F0', background: '#F9FAFB', color: '#374151', fontSize: 12, cursor: 'pointer' }}>
                      <Edit3 size={12} /> Edit
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ textAlign: 'center', padding: '16px 12px', background: '#FEF3C7', borderRadius: 12 }}>
                      <Heart size={22} color="#D97706" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Blood Pressure</div>
                      <div style={{ fontWeight: 800, fontSize: 22, color: '#78350F' }}>{DEMO.vitals.blood_pressure}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px 12px', background: '#FCE7F3', borderRadius: 12 }}>
                      <Zap size={22} color="#BE185D" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 11, color: '#9D174D', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pulse</div>
                      <div style={{ fontWeight: 800, fontSize: 22, color: '#831843' }}>{DEMO.vitals.pulse_bpm} <span style={{ fontSize: 13, fontWeight: 400 }}>BPM</span></div>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Weight</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#14532D' }}>{DEMO.vitals.weight_kg} kg</span>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#EFF6FF', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>Height</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1E3A8A' }}>{DEMO.vitals.height_cm} cm</span>
                    </div>
                  </div>
                </div>

                {/* Lab results */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <FlaskConical size={15} color={TEAL} /><span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Lab Results</span>
                  </div>
                  {['Hormone Panel — FSH/LH', 'Fasting Insulin', 'Pelvic Ultrasound'].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: '1px solid #F3F4F6', background: '#F9FAFB', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={14} color={TEAL} />
                        <span style={{ fontSize: 13, color: DARK }}>{f}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>12/01/2025</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DEMO.consultations.map((c, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={18} color={TEAL} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{fmtDate(c.date)}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', gap: 8, marginTop: 2 }}>
                      <span style={{ textTransform: 'capitalize' }}>{c.status}</span>
                      {c.followup && <span style={{ color: '#059669', fontWeight: 600 }}>· Follow-up</span>}
                    </div>
                  </div>
                  <ChevronRight size={16} color="#CBD5E0" />
                </div>
              ))}
            </div>
          )}

          {tab === 'medications' && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Prescribed on {fmtDate('2025-01-12')}
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
                    {DEMO.medications.map((rx, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 12px', color: DARK, fontWeight: 600 }}>{rx.medicine}</td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{rx.strength}</td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{rx.dosage_route}</td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{rx.frequency}</td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{rx.duration}</td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{rx.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(tab === 'results' || tab === 'files') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {['Hormone Panel — FSH/LH', 'Fasting Insulin & C-Peptide', 'Pelvic Ultrasound Report'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, border: '1px solid #E5E9F0', background: '#fff' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={18} color={TEAL} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: DARK }}>{f}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>12/01/2025</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'billing' && (
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
                  {DEMO.consultations.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 16px', color: DARK, fontWeight: 500 }}>{fmtDate(c.date)}</td>
                      <td style={{ padding: '12px 16px', color: '#374151' }}>{c.type}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#ECFDF5', color: '#059669' }}>Completed</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: c.followup ? '#059669' : '#374151', fontWeight: c.followup ? 600 : 400 }}>{c.followup ? 'Free' : '₹299'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
