import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { slugify } from '@/lib/utils'

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.is_admin) return null
  return session
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const {
    name, category_id, price, sale_price, stock, sku,
    short_description, description, ingredients, how_to_use,
    flavor, images, is_active, is_featured,
  } = await req.json()

  const slug = slugify(name)

  await query(
    `UPDATE products SET
      name=$1, slug=$2, category_id=$3, price=$4, sale_price=$5, stock=$6, sku=$7,
      short_description=$8, description=$9, ingredients=$10, how_to_use=$11,
      flavor=$12, images=$13, is_active=$14, is_featured=$15, updated_at=NOW()
     WHERE id=$16`,
    [name, slug, category_id ?? null, price, sale_price ?? null, stock ?? 0, sku ?? null,
     short_description ?? null, description ?? null, ingredients ?? null, how_to_use ?? null,
     flavor ?? null, JSON.stringify(images ?? []), is_active ?? true, is_featured ?? false, id]
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await query(`DELETE FROM products WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
