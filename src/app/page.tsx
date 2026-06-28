import { getSiteConfig } from '@/lib/settings'
import { query } from '@/lib/db'
import type { Product } from '@/types'
import HomepageClient from './HomepageClient'

export default async function HomePage() {
  const [config, featured] = await Promise.all([
    getSiteConfig(),
    query<Product>(
      `SELECT p.*, c.name as category_name,
        COALESCE(AVG(r.rating),0)::numeric(3,1) as avg_rating,
        COUNT(r.id)::int as review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_reviews r ON r.product_id = p.id
       WHERE p.is_featured = true AND p.is_active = true
       GROUP BY p.id, c.name
       ORDER BY p.created_at DESC LIMIT 6`,
      []
    ).catch(() => []),
  ])

  return <HomepageClient config={config} featured={featured} />
}
