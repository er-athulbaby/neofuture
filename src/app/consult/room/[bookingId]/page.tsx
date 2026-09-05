import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { queryOne } from '@/lib/db'
import { Video, Clock, User } from 'lucide-react'

export default async function ConsultRoomPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const consult = await queryOne<{
    id: number; patient_id: number; doctor_id: number; slot_datetime: string;
    duration_minutes: number; meet_link: string; status: string;
  }>('SELECT * FROM consultations WHERE id = $1', [bookingId])

  if (!consult) redirect('/account/appointments')

  const isPatient = String(consult.patient_id) === session.user.id
  const isDoctor = session.user.is_doctor || session.user.is_admin

  if (!isPatient && !isDoctor) redirect('/account/appointments')
  if (!consult.meet_link) redirect('/account/appointments')

  const doctor = await queryOne<{ name: string; specialisation: string }>(
    'SELECT name, specialisation FROM doctors WHERE id=$1', [consult.doctor_id]
  )
  const patient = await queryOne<{ name: string }>(
    'SELECT name FROM users WHERE id=$1', [consult.patient_id]
  )

  const slotTime = new Date(consult.slot_datetime)
  const dateStr = slotTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = slotTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm"><span className="text-pink-400">neo</span>future™</span>
          <span className="text-gray-400 text-xs">|</span>
          <span className="text-gray-300 text-sm">Consultation #{bookingId}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1"><User size={13} /> {isPatient ? doctor?.name : patient?.name}</span>
          <span className="flex items-center gap-1"><Clock size={13} /> {timeStr} · {consult.duration_minutes} min</span>
        </div>
      </div>

      {/* Meet iframe */}
      <div className="flex-1 relative">
        <iframe
          src={consult.meet_link}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full absolute inset-0"
          style={{ minHeight: 'calc(100vh - 56px)' }}
        />
      </div>

      {/* Fallback link */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-2 text-center">
        <p className="text-gray-400 text-xs">
          Having trouble? <a href={consult.meet_link} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline flex items-center gap-1 inline-flex"><Video size={12} /> Open in Google Meet</a>
        </p>
      </div>
    </div>
  )
}
