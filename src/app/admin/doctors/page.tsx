import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import Link from 'next/link'
import { Plus, Stethoscope, Edit, CheckCircle, XCircle } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function AdminDoctorsPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/')

  const doctors = await query(`
    SELECT d.*, u.email,
      (SELECT COUNT(*) FROM consultations c WHERE c.doctor_id = d.id) AS total_consultations
    FROM doctors d LEFT JOIN users u ON u.id = d.user_id ORDER BY d.created_at DESC
  `)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <Stethoscope size={24} className="text-primary" /> Doctors
        </h1>
        <Link href="/admin/doctors/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90">
          <Plus size={16} /> Add Doctor
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Doctor</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Specialisation</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Fee</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Consultations</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-brand-gray">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(doctors as { id: number; name: string; photo_url: string; qualification: string; specialisation: string; consultation_fee: number; total_consultations: number; is_active: boolean; email: string }[]).map(doc => (
              <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {doc.photo_url
                      ? <img src={doc.photo_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                      : <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{doc.name.charAt(0)}</div>}
                    <div>
                      <p className="font-semibold text-brand-dark">{doc.name}</p>
                      <p className="text-xs text-brand-gray">{doc.qualification}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-brand-gray">{doc.specialisation}</td>
                <td className="px-4 py-3 font-semibold text-brand-dark">₹{doc.consultation_fee}</td>
                <td className="px-4 py-3 text-brand-gray">{doc.total_consultations}</td>
                <td className="px-4 py-3">
                  {doc.is_active
                    ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={14} /> Active</span>
                    : <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle size={14} /> Inactive</span>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/doctors/${doc.id}`}
                    className="flex items-center gap-1 text-primary text-xs font-semibold hover:underline">
                    <Edit size={13} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-brand-gray">No doctors yet. Add your first doctor.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
