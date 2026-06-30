import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []).catch(() => {})
  await query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0`, []).catch(() => {})

  const categories = await query<{ id: number; name: string; slug: string; description: string | null; display_order: number; product_count: number }>(
    `SELECT c.id, c.name, c.slug, c.description, c.display_order,
       COUNT(p.id)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id ORDER BY c.display_order, c.name`,
    []
  )

  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, display_order } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const slug = slugify(name)

  const existing = await queryOne<{ id: number }>(`SELECT id FROM categories WHERE slug = $1`, [slug])
  if (existing) return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 })

  const row = await queryOne<{ id: number; name: string; slug: string }>(
    `INSERT INTO categories (name, slug, description, display_order) VALUES ($1, $2, $3, $4) RETURNING id, name, slug`,
    [name.trim(), slug, description?.trim() || null, display_order ?? 0]
  )

  return NextResponse.json(row, { status: 201 })
}
