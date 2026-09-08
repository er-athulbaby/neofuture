'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Settings } from 'lucide-react'

const TEAL = '#0EA5C8'
const DARK = '#0D1B35'

const FIELDS = [
  { key: 'medicine',     label: 'Medicines',      placeholder: 'e.g. Metformin, Clomiphene' },
  { key: 'strength',     label: 'Strengths',       placeholder: 'e.g. 500mg, 50mg, 100IU' },
  { key: 'dosage_route', label: 'Dosage Routes',   placeholder: 'e.g. Oral, Topical, IV' },
  { key: 'frequency',    label: 'Frequencies',     placeholder: 'e.g. Once daily, Twice daily' },
  { key: 'duration',     label: 'Durations',       placeholder: 'e.g. 7 days, 30 days, 3 months' },
  { key: 'quantity',     label: 'Quantities',      placeholder: 'e.g. 10 tablets, 1 strip, 30ml' },
]

type Options = Record<string, { id: number; value: string }[]>

export default function PrescriptionSettingsPage() {
  const router = useRouter()
  const [options, setOptions] = useState<Options>({})
  const [loading, setLoading] = useState(true)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/doctor/prescription-options')
      .then(r => r.json())
      .then(d => { if (!d.error) setOptions(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function addOption(field: string) {
    const value = (inputs[field] ?? '').trim()
    if (!value) return
    setAdding(a => ({ ...a, [field]: true }))
    setError('')
    const res = await fetch('/api/doctor/prescription-options', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_type: field, value }),
    })
    const data = await res.json()
    setAdding(a => ({ ...a, [field]: false }))
    if (res.ok && data.id) {
      setOptions(o => ({ ...o, [field]: [...(o[field] ?? []), { id: data.id, value }] }))
      setInputs(i => ({ ...i, [field]: '' }))
    } else {
      setError(data.error ?? 'Failed to add')
    }
  }

  async function removeOption(field: string, id: number) {
    await fetch('/api/doctor/prescription-options', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setOptions(o => ({ ...o, [field]: (o[field] ?? []).filter(x => x.id !== id) }))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E9F0', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <button onClick={() => router.push('/doctor/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E9F0', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: TEAL + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} color={TEAL} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: DARK }}>Prescription Settings</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Manage dropdown options for prescription fields</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626' }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E9F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: TEAL }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>{(options[key] ?? []).length} options</span>
                </div>

                <div style={{ padding: '14px 18px' }}>
                  {/* Add input */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <input
                      value={inputs[key] ?? ''}
                      onChange={e => setInputs(i => ({ ...i, [key]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addOption(key)}
                      placeholder={placeholder}
                      style={{ flex: 1, border: '1px solid #E5E9F0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: DARK, outline: 'none', background: '#fff' }}
                    />
                    <button
                      onClick={() => addOption(key)}
                      disabled={adding[key] || !inputs[key]?.trim()}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 8, border: 'none', background: TEAL, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: adding[key] || !inputs[key]?.trim() ? 0.5 : 1 }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>

                  {/* Option chips */}
                  {(options[key] ?? []).length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0, textAlign: 'center', padding: '12px 0' }}>No options yet — add one above</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(options[key] ?? []).map(opt => (
                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', borderRadius: 20, background: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: 13, color: '#0369A1' }}>
                          {opt.value}
                          <button onClick={() => removeOption(key, opt.id)} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, lineHeight: 1 }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
