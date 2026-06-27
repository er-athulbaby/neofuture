import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import type { WellnessLead } from '@/types'
import LeadsClient from './LeadsClient'

export const metadata = { title: 'Admin — Leads' }

export default async function LeadsPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/')

  const leads = await query<WellnessLead>(
    'SELECT * FROM wellness_leads ORDER BY created_at DESC LIMIT 200'
  ).catch(() => [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-dark text-white px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-lg"><span className="text-neo-orange">neo</span>future Admin</span>
        <nav className="flex gap-4 text-sm text-gray-300">
          <a href="/admin" className="hover:text-white">Analytics</a>
          <a href="/admin/products" className="hover:text-white">Products</a>
          <a href="/admin/orders" className="hover:text-white">Orders</a>
          <a href="/admin/leads" className="text-white font-medium">Leads</a>
          <a href="/admin/coupons" className="hover:text-white">Coupons</a>
        </nav>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <LeadsClient initialLeads={leads} />
      </div>
    </div>
  )
}
