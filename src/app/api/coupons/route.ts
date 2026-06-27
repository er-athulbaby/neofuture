import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json()
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const coupon = await queryOne<{
    id: number; code: string; type: string; value: number; min_order: number
  }>(
    `SELECT id, code, type, value, min_order FROM coupons
     WHERE code = $1 AND is_active = true
     AND (expires_at IS NULL OR expires_at > NOW())
     AND (usage_limit IS NULL OR used_count < usage_limit)`,
    [code.toUpperCase()]
  )

  if (!coupon) return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 })
  if (subtotal < coupon.min_order) {
    return NextResponse.json({ error: `Minimum order ₹${coupon.min_order} required` }, { status: 400 })
  }

  const discount = coupon.type === 'percent'
    ? Math.round((subtotal * coupon.value) / 100)
    : Math.min(coupon.value, subtotal)

  return NextResponse.json({ coupon, discount })
}
