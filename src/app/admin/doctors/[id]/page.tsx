'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Availability { id: number; day_of_week: number; start_time: string; end_time: string; slot_duration: number }
interface Doctor { name: string; qualification: string; specialisation: string; bio: string; consultation_fee: number; registration_no: string; state_medical_council: string; photo_url: string; signature_url: string; is_active: boolean; user_id: string; availability: Availability[] }

export default function AdminDoctorEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const isNew = id === 'new'

  const [doc, setDoc] = useState<Doctor>({ name: '', qualification: '', specialisation: '', bio: '', consultation_fee: 299, registration_no: '', state_medical_council: '', photo_url: '', signature_url: '', is_active: true, user_id: '', availability: [] })
  const [saving, setSaving] = useState(false)
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, start_time: '09:00', end_time: '13:00', slot_duration: 30 })

  const load = useCallback(async () => {
    if (isNew) return
    const res = await fetch(`/api/admin/doctors/${id}`)
    const data = await res.json()
    setDoc({ ...data, availability: data.availability ?? [] })
  }, [id, isNew])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    const url = isNew ? '/api/admin/doctors' : `/api/admin/doctors/${id}`
    const method = isNew ? 'POST' : 'PUT'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc) })
    if (res.ok) { router.push('/admin/doctors') } else { setSaving(false) }
  }

  async function addSlot() {
    const res = await fetch(`/api/admin/doctors/${id}/availability`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSlot) })
    if (res.ok) load()
  }

  async function removeSlot(availId: number) {
    await fetch(`/api/admin/doctors/${id}/availability`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ availability_id: availId }) })
    load()
  }

  const field = (label: string, key: keyof Doctor, type = 'text') => (
    <div>
      <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide">{label}</label>
      <input type={type} value={String(doc[key] ?? '')}
        onChange={e => setDoc(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/admin/doctors" className="flex items-center gap-1 text-brand-gray text-sm mb-4 hover:text-primary"><ArrowLeft size={14} /> Back to Doctors</Link>
      <h1 className="text-xl font-bold text-brand-dark mb-6">{isNew ? 'Add Doctor' : 'Edit Doctor'}</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {field('Full Name', 'name')}
          {field('Qualification', 'qualification')}
          {field('Specialisation', 'specialisation')}
          {field('Consultation Fee (₹)', 'consultation_fee', 'number')}
          {field('Registration No.', 'registration_no')}
          {field('State Medical Council', 'state_medical_council')}
          {field('Photo URL', 'photo_url')}
          {field('Signature URL', 'signature_url')}
        </div>
        <div>
          <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide">Bio</label>
          <textarea value={doc.bio} onChange={e => setDoc(p => ({ ...p, bio: e.target.value }))} rows={3}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={doc.is_active} onChange={e => setDoc(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
          Active
        </label>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
          <Save size={15} /> {saving ? 'Saving…' : 'Save Doctor'}
        </button>
      </div>

      {!isNew && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-brand-dark mb-4">Availability Slots</h2>
          <div className="space-y-2 mb-4">
            {doc.availability.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2 text-sm">
                <span className="font-medium">{DAYS[a.day_of_week]}</span>
                <span className="text-brand-gray">{a.start_time} – {a.end_time} ({a.slot_duration} min slots)</span>
                <button onClick={() => removeSlot(a.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
            {doc.availability.length === 0 && <p className="text-xs text-brand-gray">No slots configured yet.</p>}
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-3">Add Slot</p>
            <div className="grid grid-cols-4 gap-2">
              <select value={newSlot.day_of_week} onChange={e => setNewSlot(p => ({ ...p, day_of_week: Number(e.target.value) }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              <input type="time" value={newSlot.start_time} onChange={e => setNewSlot(p => ({ ...p, start_time: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <input type="time" value={newSlot.end_time} onChange={e => setNewSlot(p => ({ ...p, end_time: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <input type="number" value={newSlot.slot_duration} onChange={e => setNewSlot(p => ({ ...p, slot_duration: Number(e.target.value) }))}
                placeholder="Min" className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
            <button onClick={addSlot} className="mt-2 flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
              <Plus size={14} /> Add Slot
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
