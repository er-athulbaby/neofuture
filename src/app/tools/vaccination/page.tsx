'use client'

import { useState, useMemo } from 'react'
import { addDays, formatDate } from '@/lib/utils'
import { Baby, CheckCircle, Clock } from 'lucide-react'

interface Vaccine {
  name: string
  disease: string
  daysFromBirth: number
  label: string
  mandatory: boolean
}

const VACCINES: Vaccine[] = [
  { name: 'BCG', disease: 'Tuberculosis', daysFromBirth: 0, label: 'At Birth', mandatory: true },
  { name: 'OPV 0', disease: 'Polio', daysFromBirth: 0, label: 'At Birth', mandatory: true },
  { name: 'Hepatitis B (Birth)', disease: 'Hepatitis B', daysFromBirth: 0, label: 'At Birth', mandatory: true },
  { name: 'DTwP 1 + IPV 1 + Hib 1', disease: 'Diphtheria / Tetanus / Pertussis / Polio / Hib', daysFromBirth: 42, label: '6 Weeks', mandatory: true },
  { name: 'Rotavirus 1', disease: 'Rotavirus', daysFromBirth: 42, label: '6 Weeks', mandatory: true },
  { name: 'PCV 1', disease: 'Pneumococcal', daysFromBirth: 42, label: '6 Weeks', mandatory: true },
  { name: 'Hepatitis B 2', disease: 'Hepatitis B', daysFromBirth: 42, label: '6 Weeks', mandatory: true },
  { name: 'DTwP 2 + IPV 2 + Hib 2', disease: 'Diphtheria / Tetanus / Pertussis / Polio / Hib', daysFromBirth: 70, label: '10 Weeks', mandatory: true },
  { name: 'Rotavirus 2', disease: 'Rotavirus', daysFromBirth: 70, label: '10 Weeks', mandatory: true },
  { name: 'PCV 2', disease: 'Pneumococcal', daysFromBirth: 70, label: '10 Weeks', mandatory: true },
  { name: 'DTwP 3 + IPV 3 + Hib 3', disease: 'Diphtheria / Tetanus / Pertussis / Polio / Hib', daysFromBirth: 98, label: '14 Weeks', mandatory: true },
  { name: 'Rotavirus 3', disease: 'Rotavirus', daysFromBirth: 98, label: '14 Weeks', mandatory: true },
  { name: 'PCV 3', disease: 'Pneumococcal', daysFromBirth: 98, label: '14 Weeks', mandatory: true },
  { name: 'OPV 1', disease: 'Polio', daysFromBirth: 98, label: '14 Weeks', mandatory: true },
  { name: 'OPV 2', disease: 'Polio', daysFromBirth: 180, label: '6 Months', mandatory: true },
  { name: 'Hepatitis B 3', disease: 'Hepatitis B', daysFromBirth: 180, label: '6 Months', mandatory: true },
  { name: 'MMR 1', disease: 'Measles / Mumps / Rubella', daysFromBirth: 274, label: '9 Months', mandatory: true },
  { name: 'Vitamin A (1st)', disease: 'Vitamin A Deficiency', daysFromBirth: 274, label: '9 Months', mandatory: true },
  { name: 'OPV 3', disease: 'Polio', daysFromBirth: 274, label: '9 Months', mandatory: true },
  { name: 'Hepatitis A 1', disease: 'Hepatitis A', daysFromBirth: 365, label: '12 Months', mandatory: false },
  { name: 'Chickenpox 1', disease: 'Varicella', daysFromBirth: 365, label: '12 Months', mandatory: false },
  { name: 'MMR 2', disease: 'Measles / Mumps / Rubella', daysFromBirth: 456, label: '15 Months', mandatory: true },
  { name: 'PCV Booster', disease: 'Pneumococcal', daysFromBirth: 456, label: '15 Months', mandatory: true },
  { name: 'DTwP Booster + Hib Booster', disease: 'Diphtheria / Tetanus / Pertussis / Hib', daysFromBirth: 548, label: '18 Months', mandatory: true },
  { name: 'IPV Booster', disease: 'Polio', daysFromBirth: 548, label: '18 Months', mandatory: true },
  { name: 'Hepatitis A 2', disease: 'Hepatitis A', daysFromBirth: 548, label: '18 Months', mandatory: false },
  { name: 'Vitamin A (2nd)', disease: 'Vitamin A Deficiency', daysFromBirth: 548, label: '18 Months', mandatory: true },
  { name: 'Typhoid Conjugate Vaccine', disease: 'Typhoid', daysFromBirth: 730, label: '2 Years', mandatory: false },
  { name: 'DTwP Booster 2 + OPV Booster', disease: 'Diphtheria / Tetanus / Pertussis / Polio', daysFromBirth: 1460, label: '4–6 Years', mandatory: true },
  { name: 'Tdap / Td', disease: 'Tetanus / Diphtheria', daysFromBirth: 3650, label: '10–12 Years', mandatory: true },
  { name: 'HPV (Girls)', disease: 'Human Papillomavirus', daysFromBirth: 3650, label: '10–12 Years', mandatory: false },
]

export default function VaccinationPage() {
  const [dob, setDob] = useState('')
  const [given, setGiven] = useState<Set<string>>(new Set())

  const schedule = useMemo(() => {
    if (!dob) return []
    const birth = new Date(dob)
    const today = new Date()
    return VACCINES.map((v) => ({
      ...v,
      date: addDays(birth, v.daysFromBirth),
      isDue: addDays(birth, v.daysFromBirth) <= today,
      given: given.has(v.name),
    }))
  }, [dob, given])

  function toggleGiven(name: string) {
    setGiven((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name); else next.add(name)
      return next
    })
  }

  const dueCount = schedule.filter((v) => v.isDue && !v.given).length
  const givenCount = schedule.filter((v) => v.given).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-neo-purple-light rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Baby className="text-neo-purple" size={28} />
        </div>
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Vaccination Schedule</h1>
        <p className="text-brand-gray">India NIP schedule — enter your baby's birth date to get their personalized schedule</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <label className="block text-sm font-semibold text-brand-dark mb-2">Baby's Date of Birth</label>
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neo-purple" />

        {dob && (
          <div className="flex gap-4 mt-4">
            <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-danger">{dueCount}</p>
              <p className="text-xs text-brand-gray">Overdue / Due</p>
            </div>
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-success">{givenCount}</p>
              <p className="text-xs text-brand-gray">Given</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-brand-dark">{schedule.length - givenCount - dueCount}</p>
              <p className="text-xs text-brand-gray">Upcoming</p>
            </div>
          </div>
        )}
      </div>

      {schedule.length > 0 && (
        <div className="space-y-3">
          {schedule.map((v) => (
            <div key={v.name}
              className={`bg-white rounded-xl border-2 p-4 flex items-start gap-3 transition-all ${
                v.given ? 'border-green-200 bg-green-50/50' :
                v.isDue ? 'border-red-200 bg-red-50/30' :
                'border-gray-100'
              }`}>
              <button onClick={() => toggleGiven(v.name)} className="mt-0.5 flex-shrink-0">
                {v.given
                  ? <CheckCircle size={22} className="text-success" />
                  : <div className={`w-5 h-5 rounded-full border-2 ${v.isDue ? 'border-danger' : 'border-gray-300'}`} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-brand-dark text-sm">{v.name}</span>
                  {!v.mandatory && <span className="text-xs bg-gray-100 text-brand-gray px-2 py-0.5 rounded-full">Optional</span>}
                  {v.isDue && !v.given && <span className="text-xs bg-red-100 text-danger px-2 py-0.5 rounded-full font-medium">Due</span>}
                </div>
                <p className="text-xs text-brand-gray mt-0.5">{v.disease}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-brand-gray">
                  <span className="flex items-center gap-1"><Clock size={11} /> {v.label}</span>
                  <span>📅 {formatDate(v.date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
