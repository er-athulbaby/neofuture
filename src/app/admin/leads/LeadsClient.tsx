'use client'

import { useState } from 'react'
import type { WellnessLead } from '@/types'
import { formatDate } from '@/lib/utils'
import { MessageCircle, CheckCircle, Download } from 'lucide-react'

const PATH_LABELS: Record<string, string> = {
  pcos: 'PCOS', sleep_stress: 'Sleep/Stress', energy: 'Energy',
}

export default function LeadsClient({ initialLeads }: { initialLeads: WellnessLead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [filter, setFilter] = useState<'all' | 'contacted' | 'pending'>('all')

  const filtered = leads.filter((l) =>
    filter === 'all' ? true : filter === 'contacted' ? l.is_contacted : !l.is_contacted
  )

  async function markContacted(id: number, is_contacted: boolean) {
    await fetch('/api/admin/leads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_contacted }),
    })
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, is_contacted } : l))
  }

  function downloadCSV() {
    const headers = ['Name', 'WhatsApp', 'Email', 'Path', 'Product', 'Hormone Score', 'Stress Score', 'Energy Score', 'Contacted', 'Date']
    const rows = leads.map((l) => [
      l.name, l.whatsapp, l.email ?? '', PATH_LABELS[l.quiz_path] ?? l.quiz_path,
      l.recommended_product, l.hormone_score ?? '', l.stress_score ?? '', l.energy_score ?? '',
      l.is_contacted ? 'Yes' : 'No', formatDate(l.created_at),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'neofuture-leads.csv'; a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <MessageCircle size={24} className="text-primary" />
          WhatsApp Leads ({leads.length})
        </h1>
        <div className="flex gap-3">
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {(['all', 'pending', 'contacted'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'text-brand-dark hover:bg-gray-50'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={downloadCSV}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-brand-dark hover:border-primary transition-colors">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">WhatsApp</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Path</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Recommended</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Score</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((lead) => (
              <tr key={lead.id} className={`hover:bg-gray-50 transition-colors ${lead.is_contacted ? 'opacity-70' : ''}`}>
                <td className="px-4 py-3 font-medium text-brand-dark">{lead.name}</td>
                <td className="px-4 py-3">
                  <a href={`https://wa.me/91${lead.whatsapp.replace(/\D/g, '')}`} target="_blank"
                    className="text-success hover:underline flex items-center gap-1">
                    <MessageCircle size={14} /> {lead.whatsapp}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
                    {PATH_LABELS[lead.quiz_path] ?? lead.quiz_path}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-brand-gray max-w-40 truncate">{lead.recommended_product}</td>
                <td className="px-4 py-3 text-xs text-brand-gray">
                  {lead.hormone_score ? `H:${lead.hormone_score}` : ''}
                  {lead.stress_score ? ` S:${lead.stress_score}` : ''}
                  {lead.energy_score ? ` E:${lead.energy_score}` : ''}
                </td>
                <td className="px-4 py-3 text-xs text-brand-gray">{formatDate(lead.created_at)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => markContacted(lead.id, !lead.is_contacted)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${lead.is_contacted ? 'bg-green-100 text-success' : 'bg-gray-100 text-brand-gray hover:bg-green-100 hover:text-success'}`}>
                    <CheckCircle size={12} />
                    {lead.is_contacted ? 'Contacted' : 'Mark Done'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-brand-gray">No leads found</div>
        )}
      </div>
    </div>
  )
}
