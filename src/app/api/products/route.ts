import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Product } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') ?? 'created_at'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    const conditions: string[] = ['p.is_active = true']
    const params: unknown[] = []
    let i = 1

    if (category) {
      conditions.push(`c.slug = $${i++}`)
      params.push(category)
    }
    if (featured === 'true') {
      conditions.push('p.is_featured = true')
    }
    if (search) {
      conditions.push(`(p.name ILIKE $${i} OR p.description ILIKE $${i})`)
      params.push(`%${search}%`)
      i++
    }

    const orderMap: Record<string, string> = {
      'created_at': 'p.created_at DESC',
      'price_asc': 'COALESCE(p.sale_price, p.price) ASC',
      'price_desc': 'COALESCE(p.sale_price, p.price) DESC',
      'popular': 'review_count DESC',
      'rating': 'avg_rating DESC',
    }
    const orderBy = orderMap[sort] ?? 'p.created_at DESC'

    params.push(limit, offset)

    const products = await query<Product>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
        COALESCE(AVG(r.rating),0)::numeric(3,1) as avg_rating,
        COUNT(r.id)::int as review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_reviews r ON r.product_id = p.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY p.id, c.name, c.slug
       ORDER BY ${orderBy}
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    )

    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${conditions.join(' AND ')}`,
      params.slice(0, -2)
    )

    return NextResponse.json({ products, total: Number(count), limit, offset })
  } catch (err) {
    console.error('Products GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
