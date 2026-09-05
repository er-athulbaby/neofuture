'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Calendar, Clock, Zap, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Doctor { id: number; name: string; photo_url: string; qualification: string; specialisation: string; bio: string; consultation_fee: number; registration_no: string; state_medical_council: string }
interface Slot { datetime: string; available: boolean }
interface FreeFollowup { id: number; followup_expires_at: string }

declare global { interface Window { Razorpay: new (opts: object) => { open(): void } } }

function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function fmtDate(d: Date) { return d.toISOString().slice(0, 10) }
function fmtDisplay(d: Date) { return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) }

export default function ConsultBookPage() {
  const { doctorId } = useParams<{ doctorId: string }>()
  const router = useRouter()
  const { data: session } = useSession()

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [neopulseBalance, setNeopulseBalance] = useState(0)
  const [useNeopulse, setUseNeopulse] = useState(false)
  const [freeFollowup, setFreeFollowup] = useState<FreeFollowup | null>(null)
  const [loading, setLoading] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    fetch(`/api/consult/doctors`).then(r => r.json()).then((docs: Doctor[]) => {
      const d = docs.find(d => String(d.id) === doctorId)
      if (d) setDoctor(d)
    })
  }, [doctorId])

  useEffect(() => {
    if (!session?.user?.id) return
    fetch('/api/neopulse/balance').then(r => r.json()).then(d => setNeopulseBalance(d.balance ?? 0))
    fetch(`/api/consult/appointments`).then(r => r.json()).then((appts: { doctor_id: number; followup_expires_at: string; status: string; id: number }[]) => {
      const fu = appts.find(a => String(a.doctor_id) === doctorId && a.followup_expires_at && new Date(a.followup_expires_at) > new Date() && a.status === 'completed')
      if (fu) setFreeFollowup({ id: fu.id, followup_expires_at: fu.followup_expires_at })
    })
  }, [session, doctorId])

  const loadSlots = useCallback(async (date: Date) => {
    const res = await fetch(`/api/consult/doctors/${doctorId}/slots?date=${fmtDate(date)}`)
    const data = await res.json()
    setSlots(Array.isArray(data) ? data : [])
  }, [doctorId])

  useEffect(() => { loadSlots(selectedDate) }, [selectedDate, loadSlots])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), weekOffset * 7 + i))

  // 10 NeoПulse points = ₹1, max ₹99 discount
  const neopulseRupees = Math.floor(neopulseBalance / 10)
  const neopulseDiscount = useNeopulse && doctor ? Math.min(99, doctor.consultation_fee - 1, neopulseRupees) : 0
  const finalFee = doctor ? (freeFollowup ? 0 : doctor.consultation_fee - neopulseDiscount) : 0

  async function handleBook() {
    if (!selectedSlot || !doctor) return
    if (!session?.user) { router.push('/login?callbackUrl=/consult/' + doctorId); return }
    setLoading(true)

    try {
      const res = await fetch('/api/consult/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: doctor.id, slot_datetime: selectedSlot, use_neopulse: useNeopulse }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        alert(data.error || 'Booking failed. Please try again.')
        setLoading(false)
        return
      }

      if (data.is_free) {
        router.push('/account/appointments?booked=1')
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      script.onerror = () => { alert('Payment gateway failed to load. Please try again.'); setLoading(false) }
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: finalFee * 100,
          currency: 'INR',
          name: 'NeoFuture',
          description: `Consultation with ${doctor.name}`,
          order_id: data.razorpay_order_id,
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            await fetch('/api/consult/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ consultation_id: data.consultation_id, ...response }),
            })
            router.push('/account/appointments?booked=1')
          },
          prefill: { name: session?.user?.name, email: session?.user?.email },
          theme: { color: '#D4236A' },
          modal: { ondismiss: () => setLoading(false) },
        })
        rzp.open()
        setLoading(false)
      }
    } catch {
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!doctor) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-brand-light py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/consult" className="flex items-center gap-1 text-brand-gray text-sm mb-4 hover:text-primary"><ChevronLeft size={14} /> All Doctors</Link>

        {/* Doctor Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex gap-5 items-start">
          {doctor.photo_url
            ? <img src={doctor.photo_url} className="w-20 h-20 rounded-full object-cover flex-shrink-0" alt={doctor.name} />
            : <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">{doctor.name.charAt(0)}</div>}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-brand-dark">{doctor.name}</h1>
            <p className="text-brand-gray text-sm">{doctor.qualification}</p>
            <span className="inline-block mt-1 bg-primary/10 text-primary text-xs font-semibold px-3 py-0.5 rounded-full">{doctor.specialisation}</span>
            {doctor.bio && <p className="text-sm text-brand-gray mt-2">{doctor.bio}</p>}
            {doctor.registration_no && <p className="text-xs text-brand-gray mt-1">Reg: {doctor.registration_no} · {doctor.state_medical_council}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-brand-gray">Fee</p>
            <p className="text-2xl font-bold text-brand-dark">₹{doctor.consultation_fee}</p>
          </div>
        </div>

        {/* Free followup banner */}
        {freeFollowup && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-green-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            You have a <strong>free follow-up</strong> available until {new Date(freeFollowup.followup_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}. Booking this slot will use it.
          </div>
        )}

        {/* Date picker */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-brand-dark flex items-center gap-2"><Calendar size={16} className="text-primary" /> Select Date</h2>
            <div className="flex gap-1">
              <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map(d => {
              const isSelected = fmtDate(d) === fmtDate(selectedDate)
              return (
                <button key={d.toISOString()} onClick={() => { setSelectedDate(d); setSelectedSlot(null) }}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs transition-colors ${isSelected ? 'bg-primary text-white' : 'hover:bg-gray-50 text-brand-dark'}`}>
                  <span className="font-medium">{fmtDisplay(d).split(' ')[0]}</span>
                  <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-brand-dark'}`}>{d.getDate()}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time slots */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="font-semibold text-brand-dark flex items-center gap-2 mb-3"><Clock size={16} className="text-primary" /> Available Slots</h2>
          {slots.length === 0 && <p className="text-sm text-brand-gray">No slots available on this day.</p>}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {slots.map(s => {
              const t = new Date(s.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              const isSelected = selectedSlot === s.datetime
              return (
                <button key={s.datetime} disabled={!s.available} onClick={() => setSelectedSlot(s.datetime)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${!s.available ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : isSelected ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:border-primary hover:text-primary'}`}>
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pricing & Book */}
        {!freeFollowup && session?.user && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <h2 className="font-semibold text-brand-dark flex items-center gap-2 mb-3"><Zap size={16} className="text-primary" /> NeoPulse</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-gray">Balance: <span className="font-semibold text-brand-dark">{neopulseBalance} pts</span></p>
                {neopulseBalance > 0 && <p className="text-xs text-brand-gray mt-0.5">Save up to ₹{Math.min(99, neopulseRupees)} on this consultation (10 pts = ₹1)</p>}
              </div>
              {neopulseBalance > 0 && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={useNeopulse} onChange={e => setUseNeopulse(e.target.checked)} className="rounded" />
                  Use NeoPulse (save ₹{Math.min(99, neopulseRupees)})
                </label>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-brand-gray">Consultation Fee</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-brand-dark">₹{finalFee}</p>
                {neopulseDiscount > 0 && <span className="text-sm text-green-600 font-medium">(-₹{neopulseDiscount} NeoPulse)</span>}
                {freeFollowup && <span className="text-sm text-green-600 font-medium">Free follow-up</span>}
              </div>
            </div>
            {selectedSlot && (
              <p className="text-sm text-brand-gray">
                {new Date(selectedSlot).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}<br />
                <span className="font-semibold text-brand-dark">{new Date(selectedSlot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            )}
          </div>
          <button onClick={handleBook} disabled={!selectedSlot || loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Processing…' : !selectedSlot ? 'Select a Time Slot' : freeFollowup ? 'Book Free Follow-up' : `Pay ₹${finalFee} & Book`}
          </button>
          {!session?.user && (
            <p className="text-xs text-center text-brand-gray mt-2">You'll be asked to log in before payment</p>
          )}
        </div>
      </div>
    </div>
  )
}
