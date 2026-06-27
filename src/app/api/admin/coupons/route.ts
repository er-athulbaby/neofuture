import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.is_admin) return null
  return session
}

export async function GET() {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const coupons = await query(`SELECT * FROM coupons ORDER BY created_at DESC`, [])
  return NextResponse.json({ coupons })
}

export async function POST(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { code, type, value, min_order, usage_limit, expires_at } = await req.json()
  if (!code || !type || !value) return NextResponse.json({ error: 'code, type, value required' }, { status: 400 })

  const exists = await queryOne(`SELECT id FROM coupons WHERE code = $1`, [code.toUpperCase()])
  if (exists) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })

  const coupon = await queryOne(
    `INSERT INTO coupons (code, type, value, min_order, usage_limit, used_count, is_active, expires_at)
     VALUES ($1, $2, $3, $4, $5, 0, true, $6) RETURNING *`,
    [code.toUpperCase(), type, value, min_order ?? 0, usage_limit ?? null, expires_at ?? null]
  )
  return NextResponse.json({ coupon })
}

export async function PUT(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, is_active } = await req.json()
  await query(`UPDATE coupons SET is_active = $1 WHERE id = $2`, [is_active, id])
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  await query(`DELETE FROM coupons WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
