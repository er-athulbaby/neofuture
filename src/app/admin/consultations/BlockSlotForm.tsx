'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

interface Doctor { id: number; name: string; specialisation: string }
interface Slot { datetime: string; available: boolean }

export default function BlockSlotForm({ doctors }: { doctors: Doctor[] }) {
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!doctorId || !date) { setSlots([]); setSelected(new Set()); return }
    setLoadingSlots(true)
    setSelected(new Set())
    fetch(`/api/consult/doctors/${doctorId}/slots?date=${date}`)
      .then((r) => r.json())
      .then((d) => setSlots(Array.isArray(d) ? d : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [doctorId, date])

  function toggle(dt: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(dt) ? next.delete(dt) : next.add(dt)
      return next
    })
  }

  async function block() {
    if (!doctorId || selected.size === 0) return
    setSaving(true); setMsg('')
    let failed = 0
    for (const dt of selected) {
      const res = await fetch('/api/admin/consultations/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: Number(doctorId), slot_datetime: dt, note }),
      })
      if (!res.ok) failed++
    }
    setSaving(false)
    if (failed === 0) {
      setMsg(`${selected.size} slot(s) blocked`)
      setSlots((s) => s.map((sl) => selected.has(sl.datetime) ? { ...sl, available: false } : sl))
      setSelected(new Set())
      setNote('')
    } else {
      setMsg(`${failed} slot(s) failed`)
    }
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mt-6">
      <h2 className="font-semibold text-brand-dark flex items-center gap-2 mb-4">
        <Lock size={16} className="text-primary" /> Block a Slot
      </h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="block text-xs text-brand-gray mb-1">Doctor</label>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <option value="">— Select doctor —</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.specialisation})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-brand-gray mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
      </div>

      {loadingSlots && <p className="text-sm text-brand-gray">Loading slots…</p>}

      {!loadingSlots && doctorId && date && slots.length === 0 && (
        <p className="text-sm text-brand-gray">No availability for this doctor on this date.</p>
      )}

      {slots.length > 0 && (
        <>
          <p className="text-xs text-brand-gray mb-2">Select slots to block (tap multiple):</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {slots.map((sl) => (
              <button
                key={sl.datetime}
                type="button"
                disabled={!sl.available}
                onClick={() => toggle(sl.datetime)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  !sl.available
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                    : selected.has(sl.datetime)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-brand-dark border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {fmt(sl.datetime)}
              </button>
            ))}
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="block text-xs text-brand-gray mb-1">Note (optional, applied to all)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Doctor unavailable"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <button onClick={block} disabled={saving}
                className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary-dark transition-colors">
                {saving ? 'Blocking…' : `Block ${selected.size} slot${selected.size > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </>
      )}

      {msg && <p className={`text-sm mt-3 ${msg === 'Slot blocked' ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  )
}
