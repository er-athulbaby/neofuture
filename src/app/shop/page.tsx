import { query } from '@/lib/db'
import type { Product, Category } from '@/types'
import ShopClient from './ShopClient'

export const metadata = { title: 'Shop' }

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    query<Product>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
        COALESCE(AVG(r.rating),0)::numeric(3,1) as avg_rating,
        COUNT(r.id)::int as review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_reviews r ON r.product_id = p.id
       WHERE p.is_active = true
       GROUP BY p.id, c.name, c.slug
       ORDER BY p.is_featured DESC, p.created_at DESC`
    ).catch(() => []),
    query<Category>('SELECT * FROM categories ORDER BY display_order').catch(() => []),
  ])

  return <ShopClient initialProducts={products} categories={categories} />
}
