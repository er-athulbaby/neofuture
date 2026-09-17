'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, X, Users, Settings } from 'lucide-react'

interface Enrollment {
  id: number; name: string; email: string; phone: string | null
  amount_paid: number; status: string; razorpay_payment_id: string | null; enrolled_at: string
}

interface ProgramSettings {
  pcos_price: string; pcos_original_price: string
  pcos_slide_title: string; pcos_slide_subtitle: string
  pcos_detail_title: string; pcos_detail_description: string; pcos_features: string
}

const IST = 'Asia/Kolkata'

export default function AdminPcosProgramPage() {
  const [tab, setTab] = useState<'settings' | 'enrolled'>('settings')
  const [settings, setSettings] = useState<ProgramSettings | null>(null)
  const [features, setFeatures] = useState<string[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    fetch('/api/admin/pcos-program').then(r => r.json()).then(data => {
      setSettings(data.settings)
      setFeatures(data.settings.pcos_features ? JSON.parse(data.settings.pcos_features) : [])
      setEnrollments(data.enrollments ?? [])
    })
  }, [])

  async function save() {
    if (!settings) return
    setSaving(true)
    await fetch('/api/admin/pcos-program', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, pcos_features: JSON.stringify(features) }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function set(key: keyof ProgramSettings, val: string) {
    setSettings(s => s ? { ...s, [key]: val } : s)
  }

  if (!settings) return <div className="p-8 text-brand-gray">Loading…</div>

  const activeCount = enrollments.filter(e => e.status === 'active').length

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">PCOS Program</h1>
        <p className="text-sm text-brand-gray mt-1">Manage the 90-day PCOS/PCOD Reset Journey program</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Enrolled', value: enrollments.length, color: '#7C3AED' },
          { label: 'Active Members', value: activeCount, color: '#10B981' },
          { label: 'Revenue (₹)', value: enrollments.filter(e => e.status === 'active').reduce((s, e) => s + Number(e.amount_paid), 0).toLocaleString('en-IN'), color: '#0EA5C8' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-sm text-brand-gray mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['settings', 'enrolled'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${tab === t ? 'bg-white text-brand-dark shadow-sm' : 'text-brand-gray hover:text-brand-dark'}`}>
            {t === 'settings' ? <Settings size={14} /> : <Users size={14} />}
            {t === 'settings' ? 'Program Settings' : `Enrolled (${enrollments.length})`}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Pricing */}
          <div>
            <h3 className="font-semibold text-brand-dark mb-4 text-sm uppercase tracking-wide">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1">Price (₹/month)</label>
                <input type="number" value={settings.pcos_price} onChange={e => set('pcos_price', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1">Original Price (struck-through)</label>
                <input type="number" value={settings.pcos_original_price} onChange={e => set('pcos_original_price', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Slide content */}
          <div>
            <h3 className="font-semibold text-brand-dark mb-4 text-sm uppercase tracking-wide">Homepage Slide</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1">Slide Title</label>
                <input value={settings.pcos_slide_title} onChange={e => set('pcos_slide_title', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1">Slide Subtitle</label>
                <textarea value={settings.pcos_slide_subtitle} onChange={e => set('pcos_slide_subtitle', e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none" />
              </div>
            </div>
          </div>

          {/* Detail page content */}
          <div>
            <h3 className="font-semibold text-brand-dark mb-4 text-sm uppercase tracking-wide">Program Detail Page</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1">Headline</label>
                <input value={settings.pcos_detail_title} onChange={e => set('pcos_detail_title', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1">Description</label>
                <textarea value={settings.pcos_detail_description} onChange={e => set('pcos_detail_description', e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none" />
              </div>
            </div>
          </div>

          {/* Features list */}
          <div>
            <h3 className="font-semibold text-brand-dark mb-4 text-sm uppercase tracking-wide">What&apos;s Included (features)</h3>
            <div className="space-y-2 mb-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={f} onChange={e => setFeatures(arr => arr.map((x, j) => j === i ? e.target.value : x))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  <button onClick={() => setFeatures(arr => arr.filter((_, j) => j !== i))}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newFeature} onChange={e => setNewFeature(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newFeature.trim()) { setFeatures(f => [...f, newFeature.trim()]); setNewFeature('') } }}
                placeholder="Add a feature…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              <button onClick={() => { if (newFeature.trim()) { setFeatures(f => [...f, newFeature.trim()]); setNewFeature('') } }}
                className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-60">
            <Save size={15} /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'enrolled' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {enrollments.length === 0 ? (
            <div className="p-12 text-center text-brand-gray">No enrollments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Name','Email','Phone','Amount','Status','Payment ID','Enrolled At'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-brand-gray text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {enrollments.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-brand-dark">{e.name}</td>
                      <td className="px-4 py-3 text-brand-gray">{e.email}</td>
                      <td className="px-4 py-3 text-brand-gray">{e.phone ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold text-brand-dark">₹{Number(e.amount_paid).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brand-gray text-xs font-mono">{e.razorpay_payment_id ?? '—'}</td>
                      <td className="px-4 py-3 text-brand-gray whitespace-nowrap">
                        {new Date(e.enrolled_at).toLocaleString('en-IN', { timeZone: IST, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
