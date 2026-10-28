'use client'

import { useState, useEffect, useCallback } from 'react'
import { Lock, Trash2 } from 'lucide-react'

interface Doctor { id: number; name: string; specialisation: string }
interface Slot { datetime: string; available: boolean }
interface Blocked { id: number; slot_datetime: string; block_note: string | null }

export default function BlockSlotForm({ doctors }: { doctors: Doctor[] }) {
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [blocked, setBlocked] = useState<Blocked[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const loadBlocked = useCallback(async (dId: string, d: string) => {
    if (!dId || !d) { setBlocked([]); return }
    const res = await fetch(`/api/admin/consultations/block?doctor_id=${dId}&date=${d}`)
    if (res.ok) { const data = await res.json(); setBlocked(data.rows ?? []) }
  }, [])

  useEffect(() => {
    if (!doctorId || !date) { setSlots([]); setSelected(new Set()); setBlocked([]); return }
    setLoadingSlots(true)
    setSelected(new Set())
    Promise.all([
      fetch(`/api/consult/doctors/${doctorId}/slots?date=${date}`).then((r) => r.json()),
      fetch(`/api/admin/consultations/block?doctor_id=${doctorId}&date=${date}`).then((r) => r.json()),
    ]).then(([slotData, blockData]) => {
      setSlots(Array.isArray(slotData) ? slotData : [])
      setBlocked(blockData.rows ?? [])
    }).catch(() => {}).finally(() => setLoadingSlots(false))
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
    let failed = 0; let lastError = ''
    for (const dt of selected) {
      const res = await fetch('/api/admin/consultations/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: Number(doctorId), slot_datetime: dt, note }),
      })
      if (!res.ok) { failed++; const d = await res.json(); lastError = d.error ?? 'Failed' }
    }
    setSaving(false)
    if (failed === 0) {
      setMsg(`${selected.size} slot(s) blocked`)
      setSlots((s) => s.map((sl) => selected.has(sl.datetime) ? { ...sl, available: false } : sl))
      setSelected(new Set())
      setNote('')
      loadBlocked(doctorId, date)
    } else {
      setMsg(`${failed} slot(s) failed: ${lastError}`)
    }
  }

  async function unblock(id: number) {
    await fetch('/api/admin/consultations/block', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setBlocked((b) => b.filter((x) => x.id !== id))
    // re-fetch slots so the unblocked slot turns available again
    fetch(`/api/consult/doctors/${doctorId}/slots?date=${date}`)
      .then((r) => r.json()).then((d) => setSlots(Array.isArray(d) ? d : [])).catch(() => {})
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mt-6 space-y-5">
      <h2 className="font-semibold text-brand-dark flex items-center gap-2">
        <Lock size={16} className="text-primary" /> Block / Unblock Slots
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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

      {/* Slot picker */}
      {slots.length > 0 && (
        <div>
          <p className="text-xs text-brand-gray mb-2">Select available slots to block (tap multiple). Strikethrough = already blocked/booked.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {slots.map((sl) => (
              <button key={sl.datetime} type="button" disabled={!sl.available}
                onClick={() => toggle(sl.datetime)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  !sl.available
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                    : selected.has(sl.datetime)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-brand-dark border-gray-200 hover:border-primary hover:text-primary'
                }`}>
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
          {msg && <p className={`text-sm mt-2 ${msg.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
        </div>
      )}

      {/* Blocked slots list */}
      {blocked.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-2">Blocked Slots on this date</p>
          <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
            {blocked.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-2.5 bg-gray-50/60">
                <div>
                  <span className="text-sm font-medium text-brand-dark">{fmt(b.slot_datetime)}</span>
                  {b.block_note && <span className="ml-2 text-xs text-brand-gray">— {b.block_note}</span>}
                </div>
                <button onClick={() => unblock(b.id)} title="Unblock"
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
