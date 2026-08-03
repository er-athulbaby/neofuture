'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Phone, MapPin, Plus, Edit2, Trash2, Check, X, ChevronLeft, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserProfile { name: string; email: string; phone: string | null }

interface Address {
  id: number
  label: string
  name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  is_default: boolean
}

const BLANK_ADDR: Omit<Address, 'id' | 'is_default'> = {
  label: 'Home', name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '',
}

const LABELS = ['Home', 'Work', 'Other']

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [addresses, setAddresses] = useState<Address[]>([])
  const [addingAddr, setAddingAddr] = useState(false)
  const [editingAddr, setEditingAddr] = useState<Address | null>(null)
  const [addrForm, setAddrForm] = useState({ ...BLANK_ADDR, is_default: false })
  const [savingAddr, setSavingAddr] = useState(false)
  const [addrMsg, setAddrMsg] = useState('')

  const loadProfile = useCallback(async () => {
    const res = await fetch('/api/user/profile')
    if (res.ok) {
      const d = await res.json()
      setProfile(d)
      setProfileForm({ name: d.name, phone: d.phone ?? '' })
    }
  }, [])

  const loadAddresses = useCallback(async () => {
    const res = await fetch('/api/user/addresses')
    if (res.ok) {
      const d = await res.json()
      setAddresses(d.addresses ?? [])
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') { loadProfile(); loadAddresses() }
  }, [status, router, loadProfile, loadAddresses])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg('')
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileForm),
    })
    setSavingProfile(false)
    if (res.ok) {
      setProfileMsg('Saved!')
      setEditingProfile(false)
      loadProfile()
      setTimeout(() => setProfileMsg(''), 3000)
    } else {
      setProfileMsg('Failed to save')
    }
  }

  function startEditAddr(addr: Address) {
    setEditingAddr(addr)
    setAddrForm({
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 ?? '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      is_default: addr.is_default,
    })
    setAddingAddr(false)
  }

  function startAddAddr() {
    setAddrForm({ ...BLANK_ADDR, is_default: addresses.length === 0 })
    setEditingAddr(null)
    setAddingAddr(true)
  }

  async function saveAddr(e: React.FormEvent) {
    e.preventDefault()
    setSavingAddr(true)
    setAddrMsg('')

    const url = editingAddr ? `/api/user/addresses/${editingAddr.id}` : '/api/user/addresses'
    const method = editingAddr ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addrForm),
    })
    setSavingAddr(false)
    if (res.ok) {
      setAddrMsg('Saved!')
      setAddingAddr(false)
      setEditingAddr(null)
      loadAddresses()
      setTimeout(() => setAddrMsg(''), 3000)
    } else {
      setAddrMsg('Failed to save')
    }
  }

  async function deleteAddr(id: number) {
    if (!confirm('Delete this address?')) return
    await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' })
    loadAddresses()
  }

  if (status === 'loading' || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-brand-gray text-sm">Loading...</div>
      </div>
    )
  }

  const showForm = addingAddr || editingAddr

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/account" className="flex items-center gap-1.5 text-sm text-brand-gray hover:text-primary mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-brand-dark mb-6">My Profile</h1>

        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-brand-dark text-lg">Personal Details</h2>
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                <Edit2 size={14} /> Edit
              </button>
            )}
          </div>

          {!editingProfile ? (
            <div className="space-y-4">
              <InfoRow icon={<User size={16} />} label="Name" value={profile.name} />
              <InfoRow icon={<Mail size={16} />} label="Email" value={profile.email} />
              <InfoRow icon={<Phone size={16} />} label="Phone" value={profile.phone ?? 'Not set'} muted={!profile.phone} />
            </div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1.5 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-brand-gray cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1.5 block">Phone Number</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEditingProfile(false); setProfileForm({ name: profile.name, phone: profile.phone ?? '' }) }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-brand-gray hover:bg-gray-50 transition-colors">
                  <X size={14} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
                  <Check size={14} /> {savingProfile ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
              {profileMsg && <p className={cn('text-sm text-center font-medium', profileMsg === 'Saved!' ? 'text-success' : 'text-danger')}>{profileMsg}</p>}
            </form>
          )}
          {!editingProfile && profileMsg && (
            <p className="text-sm text-success font-medium mt-3">{profileMsg}</p>
          )}
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-brand-dark text-lg">Saved Addresses</h2>
            {!showForm && (
              <button
                onClick={startAddAddr}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                <Plus size={14} /> Add New
              </button>
            )}
          </div>

          {/* Address form */}
          {showForm && (
            <form onSubmit={saveAddr} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-brand-dark mb-4">{editingAddr ? 'Edit Address' : 'New Address'}</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {LABELS.map((l) => (
                  <button type="button" key={l} onClick={() => setAddrForm((f) => ({ ...f, label: l }))}
                    className={cn('py-2 rounded-xl text-sm font-medium border-2 transition-all',
                      addrForm.label === l ? 'border-primary bg-primary text-white' : 'border-gray-200 text-brand-gray hover:border-primary')}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name *" required value={addrForm.name} onChange={(v) => setAddrForm((f) => ({ ...f, name: v }))} />
                <Field label="Phone *" required value={addrForm.phone} onChange={(v) => setAddrForm((f) => ({ ...f, phone: v }))} />
                <div className="col-span-2">
                  <Field label="Address Line 1 *" required value={addrForm.address_line1} onChange={(v) => setAddrForm((f) => ({ ...f, address_line1: v }))} />
                </div>
                <div className="col-span-2">
                  <Field label="Address Line 2" value={addrForm.address_line2 ?? ''} onChange={(v) => setAddrForm((f) => ({ ...f, address_line2: v }))} />
                </div>
                <Field label="City *" required value={addrForm.city} onChange={(v) => setAddrForm((f) => ({ ...f, city: v }))} />
                <Field label="State *" required value={addrForm.state} onChange={(v) => setAddrForm((f) => ({ ...f, state: v }))} />
                <Field label="Pincode *" required value={addrForm.pincode} onChange={(v) => setAddrForm((f) => ({ ...f, pincode: v }))} />
                <div className="flex items-center gap-2 col-span-1 self-end pb-0.5">
                  <input type="checkbox" id="is_default" checked={addrForm.is_default}
                    onChange={(e) => setAddrForm((f) => ({ ...f, is_default: e.target.checked }))}
                    className="w-4 h-4 accent-primary" />
                  <label htmlFor="is_default" className="text-sm text-brand-dark cursor-pointer">Set as default</label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button"
                  onClick={() => { setAddingAddr(false); setEditingAddr(null) }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-brand-gray hover:bg-white transition-colors">
                  <X size={14} /> Cancel
                </button>
                <button type="submit" disabled={savingAddr}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
                  <Check size={14} /> {savingAddr ? 'Saving…' : 'Save Address'}
                </button>
              </div>
              {addrMsg && <p className={cn('text-sm text-center font-medium mt-2', addrMsg === 'Saved!' ? 'text-success' : 'text-danger')}>{addrMsg}</p>}
            </form>
          )}

          {/* Address list */}
          {addresses.length === 0 && !showForm && (
            <div className="text-center py-8 text-brand-gray">
              <MapPin size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No saved addresses yet.</p>
              <button onClick={startAddAddr} className="mt-3 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                Add your first address →
              </button>
            </div>
          )}

          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id}
                className={cn('rounded-xl border p-4 transition-all',
                  addr.is_default ? 'border-primary bg-primary/5' : 'border-gray-100')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wide bg-gray-100 text-brand-gray px-2.5 py-0.5 rounded-full">
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded-full">
                        <Star size={9} fill="currentColor" /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => startEditAddr(addr)}
                      className="p-1.5 text-brand-gray hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteAddr(addr.id)}
                      className="p-1.5 text-brand-gray hover:text-danger rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-2.5 text-sm text-brand-dark leading-relaxed">
                  <p className="font-semibold">{addr.name}</p>
                  <p className="text-brand-gray">{addr.phone}</p>
                  <p className="mt-1">
                    {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}
                  </p>
                  <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, muted = false }: { icon: React.ReactNode; label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-brand-gray font-medium uppercase tracking-wide">{label}</p>
        <p className={cn('text-sm font-medium mt-0.5', muted ? 'text-brand-gray italic' : 'text-brand-dark')}>{value}</p>
      </div>
    </div>
  )
}

function Field({ label, required = false, value, onChange }: { label: string; required?: boolean; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1.5 block">{label}</label>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
      />
    </div>
  )
}
