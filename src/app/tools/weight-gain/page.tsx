'use client'

import { useState } from 'react'
import { Scale } from 'lucide-react'

const bmiCategories = [
  { label: 'Underweight', max: 18.4, single: { min: 12.5, max: 18 }, twin: { min: 22.7, max: 28.1 } },
  { label: 'Normal weight', max: 24.9, single: { min: 11.5, max: 16 }, twin: { min: 16.8, max: 24.5 } },
  { label: 'Overweight', max: 29.9, single: { min: 7, max: 11.5 }, twin: { min: 14.1, max: 22.7 } },
  { label: 'Obese', max: 99, single: { min: 5, max: 9 }, twin: { min: 11.3, max: 19.1 } },
]

export default function WeightGainPage() {
  const [form, setForm] = useState({ height: '', preWeight: '', currentWeight: '', weeks: '', twins: false })
  const [result, setResult] = useState<{ bmi: number; bmiCat: string; recommended: { min: number; max: number }; actual: number; status: string } | null>(null)

  function calculate() {
    const h = Number(form.height) / 100
    const pre = Number(form.preWeight)
    const curr = Number(form.currentWeight)
    const weeks = Number(form.weeks)
    if (!h || !pre || !curr || !weeks) return

    const bmi = pre / (h * h)
    const cat = bmiCategories.find((c) => bmi <= c.max) ?? bmiCategories[3]
    const recommended = form.twins ? cat.twin : cat.single

    const expectedGainAtWeek = ((recommended.min + recommended.max) / 2) * (weeks / 40)
    const actual = curr - pre
    let status = 'On track'
    if (actual < recommended.min * (weeks / 40) - 1) status = 'Below recommended range'
    else if (actual > recommended.max * (weeks / 40) + 1) status = 'Above recommended range'

    setResult({ bmi: Math.round(bmi * 10) / 10, bmiCat: cat.label, recommended, actual: Math.round(actual * 10) / 10, status })
  }

  const statusColors: Record<string, string> = {
    'On track': 'text-success bg-green-50 border-green-200',
    'Below recommended range': 'text-warning bg-yellow-50 border-yellow-200',
    'Above recommended range': 'text-danger bg-red-50 border-red-200',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-neo-orange-light rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Scale className="text-neo-orange" size={28} />
        </div>
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Pregnancy Weight Gain Calculator</h1>
        <p className="text-brand-gray">Check if your weight gain aligns with guidelines</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Height (cm)" value={form.height} onChange={(v) => setForm((f) => ({ ...f, height: v }))} placeholder="e.g. 160" />
          <Field label="Pre-pregnancy weight (kg)" value={form.preWeight} onChange={(v) => setForm((f) => ({ ...f, preWeight: v }))} placeholder="e.g. 58" />
          <Field label="Current weight (kg)" value={form.currentWeight} onChange={(v) => setForm((f) => ({ ...f, currentWeight: v }))} placeholder="e.g. 65" />
          <Field label="Current week of pregnancy" value={form.weeks} onChange={(v) => setForm((f) => ({ ...f, weeks: v }))} placeholder="e.g. 24" />
        </div>

        <label className="flex items-center gap-2 mb-5 cursor-pointer">
          <input type="checkbox" checked={form.twins} onChange={(e) => setForm((f) => ({ ...f, twins: e.target.checked }))}
            className="w-4 h-4 accent-primary" />
          <span className="text-sm text-brand-dark">I am carrying twins</span>
        </label>

        <button onClick={calculate}
          disabled={!form.height || !form.preWeight || !form.currentWeight || !form.weeks}
          className="w-full bg-neo-orange text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
          Calculate
        </button>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Your BMI" value={result.bmi.toString()} sub={result.bmiCat} />
              <StatCard label="Total Gained" value={`${result.actual} kg`} sub="so far" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-brand-gray mb-1">Recommended total gain (full term)</p>
              <p className="font-semibold text-brand-dark">{result.recommended.min}–{result.recommended.max} kg</p>
            </div>
            <div className={`border rounded-xl px-4 py-3 text-sm font-semibold ${statusColors[result.status]}`}>
              {result.status}
            </div>
            <p className="text-xs text-brand-gray">Based on IOM/NRC 2009 guidelines. Always consult your OB/GYN.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-brand-dark mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neo-orange" />
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-neo-orange-light rounded-xl p-4 text-center">
      <p className="text-xs text-brand-gray">{label}</p>
      <p className="text-2xl font-bold text-neo-orange">{value}</p>
      <p className="text-xs text-brand-gray">{sub}</p>
    </div>
  )
}
