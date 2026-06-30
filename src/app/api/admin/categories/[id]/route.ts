import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface Props { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, description, display_order } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const slug = slugify(name)

  const duplicate = await queryOne<{ id: number }>(
    `SELECT id FROM categories WHERE slug = $1 AND id != $2`,
    [slug, parseInt(id)]
  )
  if (duplicate) return NextResponse.json({ error: 'Another category with this name already exists' }, { status: 409 })

  const row = await queryOne<{ id: number; name: string; slug: string }>(
    `UPDATE categories SET name = $1, slug = $2, description = $3, display_order = $4 WHERE id = $5 RETURNING id, name, slug`,
    [name.trim(), slug, description?.trim() || null, display_order ?? 0, parseInt(id)]
  )

  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Unlink products before deleting
  await query(`UPDATE products SET category_id = NULL WHERE category_id = $1`, [parseInt(id)])
  await query(`DELETE FROM categories WHERE id = $1`, [parseInt(id)])

  return NextResponse.json({ ok: true })
}
