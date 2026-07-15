import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { slugify } from '@/lib/utils'

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.is_admin) return null
  return session
}

async function ensureProductColumns() {
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_gst_rate NUMERIC(5,2)`, []).catch(() => {})
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_format VARCHAR(100)`, []).catch(() => {})
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS serving_size VARCHAR(100)`, []).catch(() => {})
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS min_order_qty INTEGER NOT NULL DEFAULT 1`, []).catch(() => {})
}

export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await ensureProductColumns()
  const products = await query(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC`
  )
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await ensureProductColumns()
  const body = await req.json()
  const slug = body.slug ? body.slug : slugify(body.name)

  // Check slug uniqueness
  const existing = await queryOne<{ id: number }>(`SELECT id FROM products WHERE slug = $1`, [slug])
  if (existing) return NextResponse.json({ error: `URL "${slug}" is already used by another product` }, { status: 409 })

  const product = await queryOne(
    `INSERT INTO products (name, slug, description, short_description, price, sale_price, images, category_id, stock, is_featured, is_active, ingredients, how_to_use, flavor, weight, sku, tags, custom_gst_rate, pack_format, serving_size, min_order_qty)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     RETURNING *`,
    [body.name, slug, body.description, body.short_description, body.price, body.sale_price ?? null, JSON.stringify(body.images ?? []), body.category_id, body.stock ?? 0, body.is_featured ?? false, body.is_active ?? true, body.ingredients, body.how_to_use, body.flavor, body.weight, body.sku ?? null, JSON.stringify(body.tags ?? []), body.custom_gst_rate ?? null, body.pack_format ?? null, body.serving_size ?? null, body.min_order_qty ?? 1]
  )
  return NextResponse.json({ product })
}

export async function PUT(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { id, ...fields } = body
  if (fields.slug) {
    fields.slug = fields.slug // already sanitized by client
  } else if (fields.name) {
    fields.slug = slugify(fields.name)
  }
  if (fields.images) fields.images = JSON.stringify(fields.images)
  if (fields.tags) fields.tags = JSON.stringify(fields.tags)

  const keys = Object.keys(fields)
  const values = Object.values(fields)
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')

  const product = await queryOne(`UPDATE products SET ${setClause} WHERE id = $1 RETURNING *`, [id, ...values])
  return NextResponse.json({ product })
}

export async function DELETE(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  await query(`UPDATE products SET is_active = false WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
