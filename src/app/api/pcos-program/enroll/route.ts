import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import Razorpay from 'razorpay'

async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS pcos_enrollments (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      amount_paid NUMERIC(10,2),
      status TEXT NOT NULL DEFAULT 'pending',
      enrolled_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []).catch(() => {})
}

export async function POST(req: NextRequest) {
  const session = await auth()
  await ensureTables()

  const { name, email, phone } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })

  // Get price from settings
  const priceRow = await queryOne<{ value: string }>(
    `SELECT value FROM site_settings WHERE key='pcos_price'`, []
  ).catch(() => null)
  const amountPaise = Math.round(Number(priceRow?.value ?? '899') * 100)

  const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! })
  const order = await rzp.orders.create({
    amount: amountPaise,
    currency: 'INR',
    notes: { name, email, phone: phone ?? '', program: 'pcos-90day' },
  })

  // Create pending enrollment record
  await query(
    `INSERT INTO pcos_enrollments (user_id, name, email, phone, razorpay_order_id, amount_paid, status)
     VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
    [session?.user?.id ?? null, name, email, phone ?? null, order.id, amountPaise / 100]
  )

  return NextResponse.json({
    order_id: order.id,
    amount: amountPaise,
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID,
  })
}
