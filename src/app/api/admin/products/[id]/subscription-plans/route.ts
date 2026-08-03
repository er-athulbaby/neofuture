import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      duration_months INTEGER NOT NULL,
      label VARCHAR(50) NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(product_id, duration_months)
    )
  `, []).catch(() => {})
  await query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS mrp_price NUMERIC(10,2)`, []).catch(() => {})
}

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTable()
  const { id } = await params
  const plans = await query(
    `SELECT * FROM subscription_plans WHERE product_id = $1 ORDER BY duration_months`,
    [parseInt(id)]
  )
  return NextResponse.json({ plans })
}

export async function POST(req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTable()
  const { id } = await params
  const { duration_months, label, price, mrp_price } = await req.json()
  if (!duration_months || !price) return NextResponse.json({ error: 'Duration and price required' }, { status: 400 })

  const plan = await queryOne(
    `INSERT INTO subscription_plans (product_id, duration_months, label, price, mrp_price)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, duration_months)
     DO UPDATE SET label = $3, price = $4, mrp_price = $5, is_active = true
     RETURNING *`,
    [parseInt(id), duration_months, label || `${duration_months} Month${duration_months > 1 ? 's' : ''}`, price, mrp_price ?? null]
  )
  return NextResponse.json({ plan }, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { plan_id, label, price, mrp_price, is_active } = await req.json()
  const plan = await queryOne(
    `UPDATE subscription_plans SET label = $1, price = $2, mrp_price = $3, is_active = $4
     WHERE id = $5 AND product_id = $6 RETURNING *`,
    [label, price, mrp_price ?? null, is_active ?? true, plan_id, parseInt(id)]
  )
  return NextResponse.json({ plan })
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { plan_id } = await req.json()
  await query(`DELETE FROM subscription_plans WHERE id = $1 AND product_id = $2`, [plan_id, parseInt(id)])
  return NextResponse.json({ ok: true })
}
