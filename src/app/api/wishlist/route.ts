import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ items: [] })

  const items = await query(
    `SELECT p.*, c.name as category_name FROM wishlist w
     JOIN products p ON p.id = w.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [session.user.id]
  )
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product_id } = await req.json()
  await query(
    `INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [session.user.id, product_id]
  )
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product_id } = await req.json()
  await query(`DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2`, [session.user.id, product_id])
  return NextResponse.json({ success: true })
}
