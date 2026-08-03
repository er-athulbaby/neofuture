import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

// One-time migration: update Neobalance subscription plan prices
// POST /api/admin/update-neobalance-pricing
export async function POST() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const product = await queryOne<{ id: number; name: string }>(
    `SELECT id, name FROM products WHERE name ILIKE '%neobalance%' AND is_active = true LIMIT 1`
  )
  if (!product) return NextResponse.json({ error: 'Neobalance product not found' }, { status: 404 })

  // Update product base price to 30-day MRP
  await query('UPDATE products SET price = 1840, sale_price = 1656 WHERE id = $1', [product.id])

  // Ensure subscription_plans table exists
  await query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      label VARCHAR(100) NOT NULL,
      duration_months INTEGER NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true
    )
  `, [])

  const plans = [
    { duration_months: 1, label: 'Starter Pack', price: 1656 },
    { duration_months: 2, label: 'Most Popular', price: 3128 },
    { duration_months: 3, label: 'Best Results', price: 4416 },
  ]

  const results = []
  for (const plan of plans) {
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM subscription_plans WHERE product_id = $1 AND duration_months = $2',
      [product.id, plan.duration_months]
    )
    if (existing) {
      await query(
        'UPDATE subscription_plans SET label = $1, price = $2, is_active = true WHERE id = $3',
        [plan.label, plan.price, existing.id]
      )
      results.push({ action: 'updated', ...plan })
    } else {
      await query(
        'INSERT INTO subscription_plans (product_id, label, duration_months, price) VALUES ($1,$2,$3,$4)',
        [product.id, plan.label, plan.duration_months, plan.price]
      )
      results.push({ action: 'created', ...plan })
    }
  }

  return NextResponse.json({ success: true, product: product.name, plans: results })
}
