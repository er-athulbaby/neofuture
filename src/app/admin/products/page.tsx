import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import AdminProductsClient from './AdminProductsClient'

export interface ProductRow {
  id: number; name: string; slug: string; category_id: number | null; category_name: string
  price: number; sale_price: number | null; stock: number
  is_active: boolean; is_featured: boolean; images: string[]
  sku: string | null; short_description: string | null; description: string | null
  ingredients: string | null; how_to_use: string | null; flavor: string | null; weight: string | null
  custom_gst_rate: number | null; pack_format: string | null; serving_size: string | null; min_order_qty: number
}

export default async function AdminProductsPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/login')

  const products = await query<ProductRow>(
    `SELECT p.id, p.name, p.slug, p.category_id, c.name as category_name,
       p.price, p.sale_price, p.stock, p.is_active, p.is_featured, p.images,
       p.sku, p.short_description, p.description, p.ingredients, p.how_to_use,
       p.flavor, p.weight,
       COALESCE(p.custom_gst_rate, NULL) as custom_gst_rate,
       p.pack_format, p.serving_size,
       COALESCE(p.min_order_qty, 1) as min_order_qty
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC`,
    []
  ).catch(() => [])

  const categories = await query<{ id: number; name: string }>(
    `SELECT id, name FROM categories ORDER BY name`,
    []
  ).catch(() => [])

  return <AdminProductsClient products={products} categories={categories} />
}
