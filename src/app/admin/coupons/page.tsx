import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import AdminCouponsClient from './AdminCouponsClient'

interface CouponRow {
  id: number; code: string; type: string; value: number; min_order: number
  usage_limit: number | null; used_count: number; is_active: boolean
  expires_at: string | null; created_at: string
}

export default async function AdminCouponsPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/login')

  const coupons = await query<CouponRow>(
    `SELECT * FROM coupons ORDER BY created_at DESC`,
    []
  ).catch(() => [])

  return <AdminCouponsClient coupons={coupons} />
}
