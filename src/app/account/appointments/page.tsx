import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import Link from 'next/link'
import { Video, FileText, Calendar, Clock, Download, AlertCircle } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function canJoin(slot: string) {
  const t = new Date(slot).getTime()
  const now = Date.now()
  return now >= t - 15 * 60000 && now <= t + 60 * 60000
}

export default async function AppointmentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/account/appointments')

  const rows = await query<{
    id: number; slot_datetime: string; duration_minutes: number; status: string; meet_link: string;
    is_followup: boolean; followup_expires_at: string;
    doctor_name: string; specialisation: string; doctor_photo: string; qualification: string; consultation_fee: number;
    report_id: number | null; diagnosis: string | null; prescription: unknown; pdf_url: string | null; report_date: string | null;
    neopulse_redeemed: number;
  }>(`
    SELECT c.*, d.name AS doctor_name, d.specialisation, d.photo_url AS doctor_photo,
      d.qualification, d.consultation_fee,
      r.id AS report_id, r.diagnosis, r.prescription, r.pdf_url, r.created_at AS report_date
    FROM consultations c
    JOIN doctors d ON d.id = c.doctor_id
    LEFT JOIN consultation_reports r ON r.consultation_id = c.id
    WHERE c.patient_id = $1 ORDER BY c.slot_datetime DESC
  `, [session.user.id])

  const upcoming = rows.filter(r => new Date(r.slot_datetime) > new Date() && r.status !== 'cancelled')
  const past = rows.filter(r => new Date(r.slot_datetime) <= new Date() || r.status === 'completed')

  // Active free followups
  const freeFollowups = rows.filter(r => r.followup_expires_at && new Date(r.followup_expires_at) > new Date() && r.status === 'completed')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-dark mb-6 flex items-center gap-2"><Calendar size={22} className="text-primary" /> My Appointments</h1>

      {/* Free followup banners */}
      {freeFollowups.map(f => (
        <div key={f.id} className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>Free follow-up with <strong>{f.doctor_name}</strong> available until {new Date(f.followup_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
          </div>
          <Link href={`/consult/${rows.find(r => r.id === f.id)?.id ?? ''}`}
            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 whitespace-nowrap">
            Book Now
          </Link>
        </div>
      ))}

      {rows.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-3xl mb-3">🩺</p>
          <h3 className="font-bold text-brand-dark mb-2">No consultations yet</h3>
          <p className="text-brand-gray text-sm mb-5">Book your first consultation with one of our specialists.</p>
          <Link href="/consult" className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90">Book Consultation</Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-brand-dark mb-3">Upcoming ({upcoming.length})</h2>
          <div className="space-y-3">
            {upcoming.map(r => <AppointmentCard key={r.id} r={r} isUpcoming />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="font-semibold text-brand-dark mb-3">Past Consultations</h2>
          <div className="space-y-3">
            {past.map(r => <AppointmentCard key={r.id} r={r} isUpcoming={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function AppointmentCard({ r, isUpcoming }: { r: {
  id: number; slot_datetime: string; duration_minutes: number; status: string; meet_link: string;
  is_followup: boolean; doctor_name: string; specialisation: string; doctor_photo: string; consultation_fee: number;
  report_id: number | null; pdf_url: string | null; neopulse_redeemed: number; diagnosis: string | null;
}, isUpcoming: boolean }) {
  const dateStr = new Date(r.slot_datetime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = new Date(r.slot_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const joinable = canJoin(r.slot_datetime)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start gap-4">
        {r.doctor_photo
          ? <img src={r.doctor_photo} className="w-12 h-12 rounded-full object-cover flex-shrink-0" alt="" />
          : <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">{r.doctor_name.charAt(0)}</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-brand-dark">{r.doctor_name}</h3>
              <p className="text-xs text-brand-gray">{r.specialisation}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${STATUS_COLOR[r.status] ?? 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-brand-gray">
            <span className="flex items-center gap-1"><Calendar size={11} /> {dateStr}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {timeStr} · {r.duration_minutes} min</span>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-brand-gray">
              {r.is_followup ? 'Free follow-up' : `₹${r.consultation_fee}${r.neopulse_redeemed > 0 ? ` (-₹${r.neopulse_redeemed} NP)` : ''}`}
            </span>

            {r.meet_link && r.status === 'confirmed' && (
              <Link href={`/consult/room/${r.id}`}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${joinable ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-500'}`}>
                <Video size={11} /> {joinable ? 'Join Meeting' : 'Meeting Link'}
              </Link>
            )}

            {r.report_id && r.pdf_url && (
              <Link href={`/api/consult/appointments/${r.id}/report`}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
                <Download size={11} /> Download Prescription
              </Link>
            )}

            {r.status === 'completed' && !r.report_id && (
              <span className="text-xs text-brand-gray flex items-center gap-1"><FileText size={11} /> Report pending from doctor</span>
            )}
          </div>

          {r.diagnosis && (
            <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-brand-gray">Diagnosis</p>
              <p className="text-sm text-brand-dark mt-0.5">{r.diagnosis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
