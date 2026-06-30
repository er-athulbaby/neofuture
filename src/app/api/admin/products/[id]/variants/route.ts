import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function ensureTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS product_variants (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      label VARCHAR(100) NOT NULL,
      options JSONB NOT NULL DEFAULT '{}',
      price NUMERIC(10,2),
      sale_price NUMERIC(10,2),
      stock INTEGER NOT NULL DEFAULT 0,
      sku VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    []
  )
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await ensureTable()
  const variants = await query(`SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id`, [Number(id)])
  return NextResponse.json({ variants })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await ensureTable()
  const body = await req.json()
  const { label, price, sale_price, stock, sku, options } = body

  if (!label) return NextResponse.json({ error: 'Label is required' }, { status: 400 })

  const variant = await queryOne(
    `INSERT INTO product_variants (product_id, label, options, price, sale_price, stock, sku)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      Number(id),
      label,
      options ? JSON.stringify(options) : '{}',
      price ? Number(price) : null,
      sale_price ? Number(sale_price) : null,
      Number(stock) || 0,
      sku || null,
    ]
  )
  return NextResponse.json({ variant })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await ensureTable()
  const body = await req.json()
  const { variant_id, label, price, sale_price, stock, sku } = body
  const { id } = await params

  await query(
    `UPDATE product_variants SET label=$1, price=$2, sale_price=$3, stock=$4, sku=$5
     WHERE id=$6 AND product_id=$7`,
    [label, price ? Number(price) : null, sale_price ? Number(sale_price) : null,
     Number(stock) || 0, sku || null, Number(variant_id), Number(id)]
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { variant_id } = await req.json()
  await query(`DELETE FROM product_variants WHERE id = $1 AND product_id = $2`, [Number(variant_id), Number(id)])
  return NextResponse.json({ ok: true })
}
