import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function POST() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ensure nutraceuticals category exists
  await query(`
    INSERT INTO categories (name, slug, description, display_order)
    VALUES ('Nutraceuticals', 'nutraceuticals', 'Targeted nutritional supplements for women''s health', 1)
    ON CONFLICT (slug) DO NOTHING
  `, [])

  const cat = await queryOne<{ id: number }>(`SELECT id FROM categories WHERE slug = 'nutraceuticals'`, [])
  if (!cat) return NextResponse.json({ error: 'Category creation failed' }, { status: 500 })

  const products = [
    {
      name: 'Neo Balance',
      slug: 'neo-balance',
      price: 999,
      sale_price: 799,
      description: 'Neo Balance is a science-backed nutraceutical formulated to support hormonal balance, ease PCOS symptoms, and promote regular menstrual cycles. Enriched with Shatavari, Ashoka, and key micronutrients to help restore your body\'s natural rhythm — naturally.',
      image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80',
    },
    {
      name: 'Neo Nidra',
      slug: 'neo-nidra',
      price: 799,
      sale_price: 649,
      description: 'Neo Nidra is your nightly ritual for deep, restorative sleep. A blend of Ashwagandha, L-Theanine, and Magnesium that calms the mind, eases stress, and prepares your body for quality rest — so you wake up refreshed and ready.',
      image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80',
    },
    {
      name: 'Neo Prime',
      slug: 'neo-prime',
      price: 899,
      sale_price: 749,
      description: 'Neo Prime is your everyday wellness companion — a premium multivitamin blend designed for modern women. Packed with Iron, Folate, Vitamin D3, B12, and antioxidants to fuel your energy, strengthen immunity, and keep you at your best every single day.',
      image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80',
    },
  ]

  const inserted: string[] = []
  for (const p of products) {
    const existing = await queryOne<{ id: number }>(`SELECT id FROM products WHERE slug = $1`, [p.slug])
    if (existing) continue

    await query(
      `INSERT INTO products (name, slug, price, sale_price, stock, description, images, is_active, is_featured, category_id)
       VALUES ($1, $2, $3, $4, 100, $5, $6, true, true, $7)`,
      [p.name, p.slug, p.price, p.sale_price, p.description, JSON.stringify([p.image]), cat.id]
    )
    inserted.push(p.name)
  }

  return NextResponse.json({
    ok: true,
    inserted,
    skipped: products.length - inserted.length,
    message: inserted.length > 0
      ? `Inserted: ${inserted.join(', ')}`
      : 'All products already exist — nothing inserted.',
  })
}
