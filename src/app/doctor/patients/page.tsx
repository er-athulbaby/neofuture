'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, Calendar, Activity, ChevronRight, ArrowLeft } from 'lucide-react'

interface Patient {
  id: string; name: string; email: string
  consultation_count: number; last_consultation: string
  dob: string | null; weight_kg: number | null; height_cm: number | null
  blood_pressure: string | null; pulse_bpm: number | null
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const TEAL = '#0EA5C8'

export default function PatientListPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/doctor/patients')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPatients(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E5E9F0', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <button onClick={() => router.push('/doctor/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
          borderRadius: 8, border: '1px solid #E5E9F0', background: '#fff',
          color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer'
        }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0F1B2D' }}>My Patients</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{patients.length} total patients</div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 24, maxWidth: 400 }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              borderRadius: 10, border: '1px solid #E5E9F0', background: '#fff',
              fontSize: 14, color: '#0F1B2D', outline: 'none', boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9CA3AF', fontSize: 14 }}>
            Loading patients…
          </div>
        ) : filtered.length === 0 && !search ? (
          /* Empty state — show one demo card so design is visible */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FCD34D' }} />
              <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>Demo preview — no confirmed consultations yet</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, opacity: 0.55, pointerEvents: 'none' }}>
              {[
                { name: 'Priya Sharma', email: 'priya.sharma@example.com', visits: 3, lastDate: '12 Jan 2025', bp: '118/76', pulse: 72, weight: 58 },
                { name: 'Ananya Menon', email: 'ananya.m@example.com', visits: 1, lastDate: '5 Feb 2025', bp: null, pulse: null, weight: null },
              ].map((p, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E9F0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: 3, background: TEAL }} />
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#0369A1' }}>
                        {initials(p.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F1B2D' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{p.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: p.bp ? 12 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280' }}>
                        <Activity size={12} color={TEAL} />{p.visits} visits
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280' }}>
                        <Calendar size={12} color={TEAL} />Last: {p.lastDate}
                      </div>
                    </div>
                    {p.bp && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>BP {p.bp}</span>
                        <span style={{ fontSize: 11, background: '#FCE7F3', color: '#9D174D', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>♥ {p.pulse} BPM</span>
                        <span style={{ fontSize: 11, background: '#F0FDF4', color: '#166534', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>{p.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid #E5E9F0' }}>
            <p style={{ color: '#374151', fontWeight: 600, margin: '0 0 8px' }}>No patients match your search</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(p => {
              const lastDate = new Date(p.last_consultation).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              const hasVitals = p.blood_pressure || p.pulse_bpm || p.weight_kg
              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/doctor/patients/${p.id}`)}
                  style={{
                    background: '#fff', borderRadius: 16, border: '1px solid #E5E9F0',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', cursor: 'pointer', overflow: 'hidden',
                    transition: 'box-shadow 0.2s, transform 0.2s'
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(14,165,200,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                >
                  <div style={{ height: 3, background: TEAL }} />
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%', background: '#E0F2FE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: '#0369A1', flexShrink: 0
                      }}>
                        {initials(p.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F1B2D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email}</div>
                      </div>
                      <ChevronRight size={16} color="#CBD5E0" />
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: hasVitals ? 12 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280' }}>
                        <Activity size={12} color={TEAL} />
                        <span>{p.consultation_count} {p.consultation_count === 1 ? 'visit' : 'visits'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280' }}>
                        <Calendar size={12} color={TEAL} />
                        <span>Last: {lastDate}</span>
                      </div>
                    </div>

                    {hasVitals && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {p.blood_pressure && (
                          <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>
                            BP {p.blood_pressure}
                          </span>
                        )}
                        {p.pulse_bpm && (
                          <span style={{ fontSize: 11, background: '#FCE7F3', color: '#9D174D', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>
                            ♥ {p.pulse_bpm} BPM
                          </span>
                        )}
                        {p.weight_kg && (
                          <span style={{ fontSize: 11, background: '#F0FDF4', color: '#166534', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>
                            {p.weight_kg} kg
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
