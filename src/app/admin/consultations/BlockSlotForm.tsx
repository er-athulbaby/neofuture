'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'

interface Doctor { id: number; name: string; specialisation: string }

export default function BlockSlotForm({ doctors }: { doctors: Doctor[] }) {
  const [doctorId, setDoctorId] = useState('')
  const [datetime, setDatetime] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!doctorId || !datetime) return
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/admin/consultations/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_id: Number(doctorId), slot_datetime: new Date(datetime).toISOString(), note }),
    })
    setSaving(false)
    const data = await res.json()
    if (res.ok) { setMsg('Slot blocked successfully'); setDatetime(''); setNote('') }
    else setMsg(data.error ?? 'Failed')
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mt-6">
      <h2 className="font-semibold text-brand-dark flex items-center gap-2 mb-4">
        <Lock size={16} className="text-primary" /> Block a Slot
      </h2>
      <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-brand-gray mb-1">Doctor</label>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <option value="">— Select doctor —</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.specialisation})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-brand-gray mb-1">Date & Time</label>
          <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
        <div className="flex-1 min-w-40">
          <label className="block text-xs text-brand-gray mb-1">Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Doctor unavailable"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
        <button type="submit" disabled={saving || !doctorId || !datetime}
          className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary-dark transition-colors">
          {saving ? 'Blocking...' : 'Block Slot'}
        </button>
      </form>
      {msg && <p className={`text-sm mt-3 ${msg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  )
}
