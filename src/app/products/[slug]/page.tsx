import { notFound } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import type { Product, Review, ProductVariant } from '@/types'
import ProductDetailClient from './ProductDetailClient'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await queryOne<{ name: string; short_description: string }>(
    'SELECT name, short_description FROM products WHERE slug = $1 AND is_active = true',
    [slug]
  ).catch(() => null)
  if (!product) return { title: 'Product Not Found' }
  return { title: product.name, description: product.short_description ?? undefined }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  const [product, reviews, related, variants] = await Promise.all([
    queryOne<Product>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
        COALESCE(AVG(r.rating),0)::numeric(3,1) as avg_rating,
        COUNT(r.id)::int as review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_reviews r ON r.product_id = p.id
       WHERE p.slug = $1 AND p.is_active = true
       GROUP BY p.id, c.name, c.slug`,
      [slug]
    ).catch(() => null),
    query<Review>(
      `SELECT r.*, u.name as user_name FROM product_reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = (SELECT id FROM products WHERE slug = $1)
       ORDER BY r.created_at DESC`,
      [slug]
    ).catch(() => []),
    query<Product>(
      `SELECT p.*, c.name as category_name,
        COALESCE(AVG(r.rating),0)::numeric(3,1) as avg_rating,
        COUNT(r.id)::int as review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_reviews r ON r.product_id = p.id
       WHERE p.category_id = (SELECT category_id FROM products WHERE slug = $1)
         AND p.slug != $1 AND p.is_active = true
       GROUP BY p.id, c.name
       ORDER BY p.is_featured DESC LIMIT 4`,
      [slug]
    ).catch(() => []),
    query<ProductVariant>(
      `SELECT * FROM product_variants WHERE product_id = (SELECT id FROM products WHERE slug = $1) AND is_active = true ORDER BY id`,
      [slug]
    ).catch(() => []),
  ])

  if (!product) notFound()

  return <ProductDetailClient product={product} reviews={reviews} related={related} variants={variants} />
}
