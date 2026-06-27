'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Info } from 'lucide-react'

// WHO Child Growth Standards — Weight-for-Age (kg), boys & girls
// Percentiles: P3, P15, P50, P85, P97 | Age in months 0–24
type GrowthRow = { m: number; p3: number; p15: number; p50: number; p85: number; p97: number }

const WHO_WEIGHT_BOYS: GrowthRow[] = [
  {m:0,  p3:2.5,  p15:2.9,  p50:3.3,  p85:3.9,  p97:4.3},
  {m:1,  p3:3.4,  p15:3.9,  p50:4.5,  p85:5.1,  p97:5.7},
  {m:2,  p3:4.4,  p15:4.9,  p50:5.6,  p85:6.3,  p97:7.0},
  {m:3,  p3:5.0,  p15:5.7,  p50:6.4,  p85:7.2,  p97:7.9},
  {m:4,  p3:5.6,  p15:6.2,  p50:7.0,  p85:7.9,  p97:8.7},
  {m:5,  p3:6.0,  p15:6.7,  p50:7.5,  p85:8.4,  p97:9.3},
  {m:6,  p3:6.4,  p15:7.1,  p50:7.9,  p85:8.9,  p97:9.8},
  {m:7,  p3:6.7,  p15:7.4,  p50:8.3,  p85:9.3,  p97:10.2},
  {m:8,  p3:6.9,  p15:7.7,  p50:8.6,  p85:9.6,  p97:10.6},
  {m:9,  p3:7.1,  p15:7.9,  p50:8.9,  p85:9.9,  p97:10.9},
  {m:10, p3:7.4,  p15:8.2,  p50:9.2,  p85:10.2, p97:11.2},
  {m:11, p3:7.6,  p15:8.4,  p50:9.4,  p85:10.5, p97:11.5},
  {m:12, p3:7.7,  p15:8.6,  p50:9.6,  p85:10.8, p97:11.8},
  {m:15, p3:8.2,  p15:9.2,  p50:10.3, p85:11.5, p97:12.6},
  {m:18, p3:8.7,  p15:9.7,  p50:10.9, p85:12.2, p97:13.4},
  {m:21, p3:9.2,  p15:10.2, p50:11.5, p85:12.8, p97:14.2},
  {m:24, p3:9.7,  p15:10.8, p50:12.2, p85:13.6, p97:15.1},
]

const WHO_WEIGHT_GIRLS: GrowthRow[] = [
  {m:0,  p3:2.4,  p15:2.8,  p50:3.2,  p85:3.7,  p97:4.2},
  {m:1,  p3:3.2,  p15:3.6,  p50:4.2,  p85:4.8,  p97:5.4},
  {m:2,  p3:3.9,  p15:4.5,  p50:5.1,  p85:5.8,  p97:6.6},
  {m:3,  p3:4.5,  p15:5.2,  p50:5.8,  p85:6.6,  p97:7.4},
  {m:4,  p3:5.0,  p15:5.7,  p50:6.4,  p85:7.3,  p97:8.1},
  {m:5,  p3:5.4,  p15:6.1,  p50:6.9,  p85:7.8,  p97:8.7},
  {m:6,  p3:5.7,  p15:6.5,  p50:7.3,  p85:8.2,  p97:9.2},
  {m:7,  p3:5.9,  p15:6.7,  p50:7.6,  p85:8.6,  p97:9.6},
  {m:8,  p3:6.2,  p15:7.0,  p50:7.9,  p85:9.0,  p97:10.0},
  {m:9,  p3:6.4,  p15:7.2,  p50:8.2,  p85:9.3,  p97:10.4},
  {m:10, p3:6.6,  p15:7.5,  p50:8.5,  p85:9.6,  p97:10.7},
  {m:11, p3:6.8,  p15:7.7,  p50:8.7,  p85:9.9,  p97:11.0},
  {m:12, p3:6.9,  p15:7.8,  p50:8.9,  p85:10.1, p97:11.3},
  {m:15, p3:7.4,  p15:8.3,  p50:9.6,  p85:10.9, p97:12.1},
  {m:18, p3:7.8,  p15:8.9,  p50:10.2, p85:11.5, p97:12.9},
  {m:21, p3:8.2,  p15:9.4,  p50:10.9, p85:12.3, p97:13.7},
  {m:24, p3:8.7,  p15:9.8,  p50:11.5, p85:13.0, p97:14.5},
]

// WHO Length-for-Age (cm)
const WHO_HEIGHT_BOYS: GrowthRow[] = [
  {m:0,  p3:46.1, p15:47.9, p50:49.9, p85:51.8, p97:53.7},
  {m:1,  p3:50.8, p15:52.6, p50:54.7, p85:56.8, p97:58.6},
  {m:2,  p3:54.4, p15:56.4, p50:58.4, p85:60.5, p97:62.4},
  {m:3,  p3:57.3, p15:59.4, p50:61.4, p85:63.5, p97:65.5},
  {m:4,  p3:59.7, p15:61.8, p50:63.9, p85:66.0, p97:68.0},
  {m:5,  p3:61.7, p15:63.8, p50:65.9, p85:68.0, p97:70.1},
  {m:6,  p3:63.3, p15:65.5, p50:67.6, p85:69.8, p97:71.9},
  {m:7,  p3:64.8, p15:67.0, p50:69.2, p85:71.4, p97:73.5},
  {m:8,  p3:66.2, p15:68.4, p50:70.6, p85:72.9, p97:75.0},
  {m:9,  p3:67.5, p15:69.7, p50:72.0, p85:74.2, p97:76.4},
  {m:10, p3:68.7, p15:71.0, p50:73.3, p85:75.6, p97:77.8},
  {m:11, p3:69.9, p15:72.2, p50:74.5, p85:76.9, p97:79.1},
  {m:12, p3:71.0, p15:73.4, p50:75.7, p85:78.1, p97:80.4},
  {m:15, p3:73.9, p15:76.5, p50:79.1, p85:81.7, p97:84.1},
  {m:18, p3:76.9, p15:79.6, p50:82.3, p85:85.1, p97:87.7},
  {m:21, p3:79.4, p15:82.3, p50:85.1, p85:88.0, p97:90.8},
  {m:24, p3:81.7, p15:84.8, p50:87.8, p85:90.9, p97:93.9},
]

const WHO_HEIGHT_GIRLS: GrowthRow[] = [
  {m:0,  p3:45.6, p15:47.3, p50:49.1, p85:51.0, p97:52.7},
  {m:1,  p3:49.8, p15:51.7, p50:53.7, p85:55.6, p97:57.4},
  {m:2,  p3:53.0, p15:55.0, p50:57.1, p85:59.1, p97:61.1},
  {m:3,  p3:55.6, p15:57.7, p50:59.8, p85:61.9, p97:63.9},
  {m:4,  p3:57.8, p15:59.9, p50:62.1, p85:64.3, p97:66.3},
  {m:5,  p3:59.6, p15:61.8, p50:64.0, p85:66.3, p97:68.4},
  {m:6,  p3:61.2, p15:63.5, p50:65.7, p85:68.0, p97:70.2},
  {m:7,  p3:62.7, p15:65.0, p50:67.3, p85:69.6, p97:71.9},
  {m:8,  p3:64.0, p15:66.4, p50:68.7, p85:71.1, p97:73.4},
  {m:9,  p3:65.3, p15:67.7, p50:70.1, p85:72.6, p97:74.9},
  {m:10, p3:66.5, p15:69.0, p50:71.5, p85:73.9, p97:76.4},
  {m:11, p3:67.7, p15:70.3, p50:72.8, p85:75.3, p97:77.7},
  {m:12, p3:68.9, p15:71.5, p50:74.0, p85:76.6, p97:79.1},
  {m:15, p3:72.0, p15:74.8, p50:77.5, p85:80.3, p97:83.0},
  {m:18, p3:75.0, p15:77.8, p50:80.7, p85:83.7, p97:86.5},
  {m:21, p3:77.5, p15:80.5, p50:83.7, p85:86.8, p97:89.8},
  {m:24, p3:80.0, p15:83.2, p50:86.4, p85:89.8, p97:93.0},
]

function getPercentileCategory(value: number, data: GrowthRow[], month: number, _metric: 'weight' | 'height'): string {
  const row = data.find((r) => r.m === month)
  if (!row) return 'Unknown'
  if (value < row.p3) return 'Below 3rd percentile — Consult your doctor'
  if (value < row.p15) return '3rd–15th percentile — Monitor closely'
  if (value < row.p85) return '15th–85th percentile — Normal range'
  if (value < row.p97) return '85th–97th percentile — Above average'
  return 'Above 97th percentile — Consult your doctor'
}

export default function GrowthChartPage() {
  const [sex, setSex] = useState<'boy' | 'girl'>('girl')
  const [metric, setMetric] = useState<'weight' | 'height'>('weight')
  const [ageMonths, setAgeMonths] = useState<number | ''>('')
  const [measurement, setMeasurement] = useState<number | ''>('')
  const [plotted, setPlotted] = useState(false)

  const refData = metric === 'weight'
    ? (sex === 'boy' ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS)
    : (sex === 'boy' ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS)

  const chartData = refData.map((row) => ({
    age: row.m,
    'P3': row.p3,
    'P15': row.p15,
    'P50 (Median)': row.p50,
    'P85': row.p85,
    'P97': row.p97,
    ...(plotted && ageMonths !== '' && Number(ageMonths) === row.m
      ? { 'Your child': Number(measurement) }
      : {}),
  }))

  const unit = metric === 'weight' ? 'kg' : 'cm'
  const category = plotted && ageMonths !== '' && measurement !== ''
    ? getPercentileCategory(Number(measurement), refData, Number(ageMonths), metric)
    : null

  const nearestRow = ageMonths !== '' ? refData.find((r) => r.m === Number(ageMonths)) : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/tools" className="flex items-center gap-1.5 text-sm text-brand-gray hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
          <TrendingUp size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Baby Growth Chart</h1>
          <p className="text-sm text-brand-gray">WHO Child Growth Standards (0–24 months)</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3">
        <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Based on WHO Child Growth Standards. These charts are for reference only — always consult your paediatrician for growth assessment.
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 bg-white rounded-2xl border border-gray-100 p-5">
        {/* Sex */}
        <div>
          <label className="block text-xs font-semibold text-brand-gray uppercase mb-2">Sex</label>
          <div className="flex gap-2">
            {(['girl', 'boy'] as const).map((s) => (
              <button key={s} onClick={() => setSex(s)}
                className={cn('flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors',
                  sex === s ? 'border-primary bg-primary text-white' : 'border-gray-200 text-brand-gray hover:border-primary/50')}>
                {s === 'girl' ? '👧 Girl' : '👦 Boy'}
              </button>
            ))}
          </div>
        </div>

        {/* Metric */}
        <div>
          <label className="block text-xs font-semibold text-brand-gray uppercase mb-2">Metric</label>
          <div className="flex gap-2">
            {(['weight', 'height'] as const).map((m) => (
              <button key={m} onClick={() => setMetric(m)}
                className={cn('flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors capitalize',
                  metric === m ? 'border-primary bg-primary text-white' : 'border-gray-200 text-brand-gray hover:border-primary/50')}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="block text-xs font-semibold text-brand-gray uppercase mb-2">Age (months)</label>
          <select value={ageMonths}
            onChange={(e) => setAgeMonths(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
            <option value="">Select age</option>
            {[0,1,2,3,4,5,6,7,8,9,10,11,12,15,18,21,24].map((m) => (
              <option key={m} value={m}>{m} month{m !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        {/* Measurement */}
        <div>
          <label className="block text-xs font-semibold text-brand-gray uppercase mb-2">
            {metric === 'weight' ? 'Weight (kg)' : 'Length (cm)'}
          </label>
          <div className="flex gap-2">
            <input type="number" step="0.1" min="0" value={measurement}
              onChange={(e) => setMeasurement(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={unit}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
            <button onClick={() => setPlotted(ageMonths !== '' && measurement !== '')}
              className="bg-primary text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
              Plot
            </button>
          </div>
        </div>
      </div>

      {/* Result card */}
      {plotted && category && (
        <div className={cn('rounded-2xl p-4 mb-5 border',
          category.includes('Normal') ? 'bg-green-50 border-green-100' :
          category.includes('Consult') ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100')}>
          <p className="font-semibold text-brand-dark text-sm">Assessment for {ageMonths} month{Number(ageMonths) !== 1 ? 's' : ''}</p>
          <p className="text-sm mt-0.5">{category}</p>
          {nearestRow && (
            <p className="text-xs mt-2 text-brand-gray">
              Median ({unit}) for this age: <span className="font-semibold text-brand-dark">{nearestRow.p50}</span> |
              Healthy range: <span className="font-semibold text-brand-dark">{nearestRow.p15}–{nearestRow.p85} {unit}</span>
            </p>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-brand-dark mb-1">
          {metric === 'weight' ? 'Weight-for-Age' : 'Length-for-Age'} — {sex === 'girl' ? 'Girls' : 'Boys'} (0–24 months)
        </h2>
        <p className="text-xs text-brand-gray mb-4">Source: WHO Child Growth Standards</p>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="age" label={{ value: 'Age (months)', position: 'insideBottom', offset: -10, fontSize: 12 }} tick={{ fontSize: 11 }} />
            <YAxis label={{ value: unit, angle: -90, position: 'insideLeft', fontSize: 12 }} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, n) => [`${Number(v)} ${unit}`, String(n)]} labelFormatter={(l) => `Age: ${l} months`} />
            <Legend verticalAlign="top" height={36} iconSize={10} />
            <Line type="monotone" dataKey="P3" stroke="#93c5fd" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="P15" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="P50 (Median)" stroke="#D4236A" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="P85" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="P97" stroke="#93c5fd" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            {plotted && (
              <Line type="monotone" dataKey="Your child" stroke="#E07B2A" strokeWidth={0} dot={{ r: 8, fill: '#E07B2A', stroke: '#fff', strokeWidth: 2 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Reference table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-5">
        <h3 className="font-semibold text-brand-dark mb-3">Reference Table — {metric === 'weight' ? 'Weight' : 'Length'} ({unit})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-brand-gray font-semibold">Age</th>
                <th className="text-center py-2 px-3 text-brand-gray font-semibold">P3</th>
                <th className="text-center py-2 px-3 text-brand-gray font-semibold">P15</th>
                <th className="text-center py-2 px-3 text-primary font-semibold">P50 (Median)</th>
                <th className="text-center py-2 px-3 text-brand-gray font-semibold">P85</th>
                <th className="text-center py-2 px-3 text-brand-gray font-semibold">P97</th>
              </tr>
            </thead>
            <tbody>
              {refData.map((row) => (
                <tr key={row.m} className={cn('border-b border-gray-50 hover:bg-gray-50 transition-colors',
                  plotted && ageMonths === row.m ? 'bg-primary-light' : '')}>
                  <td className="py-2 px-3 font-medium text-brand-dark">{row.m}m</td>
                  <td className="py-2 px-3 text-center text-brand-gray">{row.p3}</td>
                  <td className="py-2 px-3 text-center text-brand-gray">{row.p15}</td>
                  <td className="py-2 px-3 text-center font-semibold text-primary">{row.p50}</td>
                  <td className="py-2 px-3 text-center text-brand-gray">{row.p85}</td>
                  <td className="py-2 px-3 text-center text-brand-gray">{row.p97}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
