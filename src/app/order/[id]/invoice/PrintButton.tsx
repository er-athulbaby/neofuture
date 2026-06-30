'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
    >
      ⬇ Download / Print Invoice
    </button>
  )
}
