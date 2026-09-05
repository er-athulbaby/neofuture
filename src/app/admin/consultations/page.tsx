import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { Video } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function AdminConsultationsPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/')

  const rows = await query(`
    SELECT c.*, u.name AS patient_name, d.name AS doctor_name, d.specialisation
    FROM consultations c
    JOIN users u ON u.id = c.patient_id
    JOIN doctors d ON d.id = c.doctor_id
    ORDER BY c.slot_datetime DESC LIMIT 100
  `)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2 mb-6">
        <Video size={24} className="text-primary" /> Consultations
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Patient</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Doctor</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Date & Time</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Fee</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Status</th>
            </tr>
          </thead>
          <tbody>
            {(rows as { id: number; patient_name: string; doctor_name: string; specialisation: string; slot_datetime: string; consultation_fee: number; neopulse_redeemed: number; is_followup: boolean; status: string; meet_link: string }[]).map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-brand-dark">{r.patient_name}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{r.doctor_name}</p>
                  <p className="text-xs text-brand-gray">{r.specialisation}</p>
                </td>
                <td className="px-4 py-3 text-brand-gray">
                  {new Date(r.slot_datetime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br />
                  <span className="text-xs">{new Date(r.slot_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="px-4 py-3">
                  {r.is_followup ? <span className="text-green-600 font-medium text-xs">Free follow-up</span> : <span>₹{r.consultation_fee}{r.neopulse_redeemed > 0 ? <span className="text-xs text-brand-gray ml-1">(-₹{r.neopulse_redeemed} NP)</span> : null}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {r.is_followup ? 'Follow-up' : 'New'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-brand-gray">No consultations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
