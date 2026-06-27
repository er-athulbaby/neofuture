'use client'

import { useState } from 'react'
import { addDays, formatDate, getGestationalAge, getTrimester } from '@/lib/utils'
import { Calendar, Info } from 'lucide-react'

export default function DueDatePage() {
  const [method, setMethod] = useState<'lmp' | 'conception' | 'ivf3' | 'ivf5'>('lmp')
  const [date, setDate] = useState('')
  const [result, setResult] = useState<{
    edd: Date; gestWeeks: number; gestDays: number; trimester: number
  } | null>(null)

  function calculate() {
    if (!date) return
    const input = new Date(date)
    let edd: Date

    switch (method) {
      case 'lmp': edd = addDays(input, 280); break
      case 'conception': edd = addDays(input, 266); break
      case 'ivf3': edd = addDays(input, 263); break
      case 'ivf5': edd = addDays(input, 261); break
    }

    const { weeks, days } = getGestationalAge(input)
    setResult({ edd, gestWeeks: weeks, gestDays: days, trimester: getTrimester(weeks) })
  }

  const milestones = result ? [
    { label: '1st Trimester Ends', date: addDays(new Date(date), method === 'lmp' ? 91 : 78) },
    { label: '2nd Trimester Ends', date: addDays(new Date(date), method === 'lmp' ? 189 : 176) },
    { label: 'Anatomy Scan (20 wk)', date: addDays(new Date(date), method === 'lmp' ? 140 : 127) },
    { label: 'Glucose Test (24-28 wk)', date: addDays(new Date(date), method === 'lmp' ? 175 : 162) },
    { label: 'Estimated Due Date', date: result.edd },
  ] : []

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="text-primary" size={28} />
        </div>
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Due Date Calculator</h1>
        <p className="text-brand-gray">Calculate your estimated due date (EDD)</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Method selector */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-brand-dark mb-2">Calculation Method</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'lmp', label: 'Last Menstrual Period' },
              { value: 'conception', label: 'Conception Date' },
              { value: 'ivf3', label: 'IVF Day-3 Transfer' },
              { value: 'ivf5', label: 'IVF Day-5 Transfer' },
            ] as const).map((m) => (
              <button key={m.value} onClick={() => { setMethod(m.value); setResult(null) }}
                className={`border-2 rounded-xl py-2.5 px-3 text-sm font-medium transition-all ${method === m.value ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-brand-dark hover:border-primary'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date input */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-brand-dark mb-2">
            {method === 'lmp' ? 'First day of last period' : method === 'conception' ? 'Conception date' : 'Transfer date'}
          </label>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setResult(null) }}
            max={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
        </div>

        <button onClick={calculate} disabled={!date}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
          Calculate Due Date
        </button>

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="bg-primary-light border border-primary/20 rounded-2xl p-5 text-center">
              <p className="text-sm text-brand-gray mb-1">Your Estimated Due Date</p>
              <p className="text-3xl font-bold text-primary">{formatDate(result.edd)}</p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <span className="text-brand-gray">
                  Gestational age: <strong className="text-brand-dark">{result.gestWeeks}w {result.gestDays}d</strong>
                </span>
                <span className="text-brand-gray">
                  Trimester: <strong className="text-brand-dark">{result.trimester}</strong>
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-brand-dark mb-3 flex items-center gap-2">
                <Info size={16} className="text-primary" /> Key Milestones
              </h3>
              <div className="space-y-2">
                {milestones.map((m) => (
                  <div key={m.label} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-brand-dark">{m.label}</span>
                    <span className="text-sm font-medium text-brand-dark">{formatDate(m.date)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neo-orange-light border border-neo-orange/20 rounded-xl p-4 text-sm text-brand-gray">
              <strong className="text-brand-dark">Note:</strong> This is an estimate. Only 5% of babies are born exactly on their due date. Always consult your healthcare provider.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
