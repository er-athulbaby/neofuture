import { query } from '@/lib/db'
import Link from 'next/link'
import { Stethoscope, Calendar, Clock } from 'lucide-react'

interface Doctor { id: number; name: string; photo_url: string; qualification: string; specialisation: string; bio: string; consultation_fee: number }

export default async function ConsultPage() {
  const doctors = await query<Doctor>('SELECT id, name, photo_url, qualification, specialisation, bio, consultation_fee FROM doctors WHERE is_active = true ORDER BY id')

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-pink-600 text-white py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Stethoscope size={14} /> Online Tele-Consultation
          </div>
          <h1 className="text-3xl font-bold mb-3">Talk to a Specialist</h1>
          <p className="text-white/80 text-base">Expert consultations from the comfort of your home. Video call, prescription, and follow-up included.</p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-white/80">
            <span className="flex items-center gap-1"><Calendar size={14} /> Flexible Slots</span>
            <span className="flex items-center gap-1"><Clock size={14} /> 30-min Sessions</span>
            <span>🔒 Private & Secure</span>
          </div>
        </div>
      </div>

      {/* Doctors */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-brand-dark mb-6">Our Specialists</h2>
        {doctors.length === 0 && (
          <div className="text-center py-16 text-brand-gray">No doctors available at the moment. Please check back soon.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-br from-primary/10 to-pink-50 p-6 flex flex-col items-center text-center">
                {doc.photo_url
                  ? <img src={doc.photo_url} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm mb-3" alt={doc.name} />
                  : <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl border-4 border-white shadow-sm mb-3">{doc.name.charAt(0)}</div>}
                <h3 className="font-bold text-brand-dark text-lg">{doc.name}</h3>
                <p className="text-xs text-brand-gray mt-0.5">{doc.qualification}</p>
                <span className="mt-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">{doc.specialisation}</span>
              </div>
              <div className="p-4">
                {doc.bio && <p className="text-sm text-brand-gray line-clamp-2 mb-4">{doc.bio}</p>}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-brand-gray">Consultation Fee</p>
                    <p className="font-bold text-xl text-brand-dark">₹{doc.consultation_fee}</p>
                  </div>
                  <Link href={`/consult/${doc.id}`}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🎥', title: 'Google Meet Video Call', desc: 'Secure, high-quality video consultation directly in your browser' },
            { icon: '📋', title: 'Digital Prescription', desc: 'Receive a signed digital prescription PDF via email after your consultation' },
            { icon: '🔄', title: '7-Day Free Follow-up', desc: 'Ask follow-up questions for free within 7 days of your consultation' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-2xl mb-2">{f.icon}</p>
              <h4 className="font-semibold text-brand-dark mb-1">{f.title}</h4>
              <p className="text-xs text-brand-gray">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
