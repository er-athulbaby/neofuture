import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { isRateLimited, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const productId = new URL(req.url).searchParams.get('product_id')
  if (!productId) return NextResponse.json({ reviews: [] })

  const reviews = await query(
    `SELECT r.*, u.name as user_name FROM product_reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
    [productId]
  )
  return NextResponse.json({ reviews })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isRateLimited(`review:${session.user.id}`, 5, 60_000)) return rateLimitResponse()

  const { product_id, rating, comment } = await req.json()
  if (!product_id || !rating) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }
  if (comment && comment.length > 1000) {
    return NextResponse.json({ error: 'Comment too long (max 1000 characters)' }, { status: 400 })
  }

  // Check if verified purchase
  const purchase = await queryOne(
    `SELECT o.id FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1 AND oi.product_id = $2 AND o.payment_status = 'paid'
     LIMIT 1`,
    [session.user.id, product_id]
  )

  await query(
    `INSERT INTO product_reviews (product_id, user_id, rating, comment, is_verified_purchase)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, user_id) DO UPDATE SET rating = $3, comment = $4`,
    [product_id, session.user.id, rating, comment ?? null, !!purchase]
  )

  return NextResponse.json({ success: true })
}
