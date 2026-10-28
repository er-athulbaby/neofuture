'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number        // 0-indexed
  total: number
  pageSize: number
  onChange: (p: number) => void
}

export default function Paginator({ page, total, pageSize, onChange }: Props) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-brand-gray">
      <span>{from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 text-xs">{page + 1} / {pages}</span>
        <button onClick={() => onChange(page + 1)} disabled={page >= pages - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
