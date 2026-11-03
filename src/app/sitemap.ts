import type { MetadataRoute } from 'next'
import { query } from '@/lib/db'

const BASE = 'https://neofuture.in'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/consult`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/tools`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/neopulse`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/refund-policy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const products = await query<{ slug: string; updated_at: string }>(
    `SELECT slug, updated_at FROM products WHERE is_active = true ORDER BY updated_at DESC`,
    []
  ).catch(() => [])

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
