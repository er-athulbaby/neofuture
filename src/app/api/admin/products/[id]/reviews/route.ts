import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function ensureColumns() {
  await Promise.all([
    query(`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT`, []).catch(() => {}),
    query(`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS is_admin_added BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {}),
    query(`ALTER TABLE product_reviews ALTER COLUMN user_id DROP NOT NULL`, []).catch(() => {}),
    query(`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'`, []).catch(() => {}),
  ])
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await ensureColumns()

  const reviews = await query(
    `SELECT id, reviewer_name, rating, comment, is_verified_purchase, is_admin_added, created_at
     FROM product_reviews WHERE product_id = $1 ORDER BY created_at DESC`,
    [id]
  )
  return NextResponse.json({ reviews })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { reviewer_name, rating, comment } = await req.json()
  if (!reviewer_name || !rating) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (typeof rating !== 'number' || rating < 1 || rating > 5) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })

  await ensureColumns()

  const row = await queryOne<{ id: number }>(
    `INSERT INTO product_reviews (product_id, user_id, reviewer_name, rating, comment, is_verified_purchase, is_admin_added, images)
     VALUES ($1, NULL, $2, $3, $4, false, true, '[]') RETURNING id`,
    [id, reviewer_name.trim(), rating, comment?.trim() ?? null]
  )
  return NextResponse.json({ success: true, id: row?.id })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { review_id } = await req.json()
  await query(`DELETE FROM product_reviews WHERE id = $1 AND product_id = $2`, [review_id, id])
  return NextResponse.json({ success: true })
}
