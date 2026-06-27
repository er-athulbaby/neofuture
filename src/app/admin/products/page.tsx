import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import AdminProductsClient from './AdminProductsClient'

interface ProductRow {
  id: number; name: string; slug: string; category_name: string
  price: number; sale_price: number | null; stock: number
  is_active: boolean; is_featured: boolean; images: string[]
}

export default async function AdminProductsPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/login')

  const products = await query<ProductRow>(
    `SELECT p.id, p.name, p.slug, c.name as category_name, p.price, p.sale_price,
       p.stock, p.is_active, p.is_featured, p.images
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
