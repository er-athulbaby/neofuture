import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { generateOrderNumber } from '@/lib/utils'
import { sendOrderConfirmation } from '@/lib/email'
import type { CartItem, ShippingAddress, Coupon } from '@/types'

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const { items, shippingAddress, couponCode }: {
      items: CartItem[]
      shippingAddress: ShippingAddress
      couponCode?: string
    } = body

    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    // Validate stock and prices from DB
    const productIds = items.map((i) => i.product_id)
    const dbProducts = await query<{ id: number; price: number; sale_price: number | null; stock: number; name: string; images: string[] }>(
      `SELECT id, price, sale_price, stock, name, images FROM products WHERE id = ANY($1) AND is_active = true`,
      [productIds]
    )

    let subtotal = 0
    const validatedItems = []
    for (const item of items) {
      const dbP = dbProducts.find((p) => p.id === item.product_id)
      if (!dbP) return NextResponse.json({ error: `Product ${item.name} not found` }, { status: 400 })
      if (dbP.stock < item.quantity) return NextResponse.json({ error: `Insufficient stock for ${dbP.name}` }, { status: 400 })
      const price = dbP.sale_price ?? dbP.price
      subtotal += price * item.quantity
      validatedItems.push({ ...item, price, dbProduct: dbP })
    }

    // Apply coupon
    let discount = 0
    let couponId: number | null = null
    if (couponCode) {
      const coupon = await queryOne<Coupon>(
        `SELECT * FROM coupons WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW()) AND (usage_limit IS NULL OR used_count < usage_limit)`,
        [couponCode.toUpperCase()]
      )
      if (coupon && subtotal >= coupon.min_order) {
        discount = coupon.type === 'percent'
          ? Math.round((subtotal * coupon.value) / 100)
          : Math.min(coupon.value, subtotal)
        couponId = coupon.id
      }
    }

    const shipping = subtotal >= 999 ? 0 : 50
    const total = subtotal - discount + shipping

    // Validate Razorpay keys
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys not configured')
      return NextResponse.json({ error: 'Payment gateway not configured. Please contact support.' }, { status: 500 })
    }

    // Create Razorpay order
    let rzpOrder
    try {
      rzpOrder = await getRazorpay().orders.create({
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: generateOrderNumber(),
      })
    } catch (rzpErr: unknown) {
      const msg = rzpErr instanceof Error ? rzpErr.message : String(rzpErr)
      console.error('Razorpay order creation failed:', msg)
      return NextResponse.json({ error: `Payment gateway error: ${msg}` }, { status: 500 })
    }

    return NextResponse.json({
      razorpay_order_id: rzpOrder.id,
      subtotal,
      discount,
      shipping,
      total,
      coupon_id: couponId,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('Checkout create error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      items, shippingAddress, subtotal, discount, shipping, total, couponId,
    } = body

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    const orderNumber = generateOrderNumber()

    // Create order in DB
    const order = await queryOne<{ id: number }>(
      `INSERT INTO orders
        (order_number, user_id, subtotal, discount, shipping, total, coupon_id, status, payment_status,
         razorpay_order_id, razorpay_payment_id, razorpay_signature, shipping_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', 'paid', $8, $9, $10, $11)
       RETURNING id`,
      [orderNumber, session?.user?.id ?? null, subtotal, discount, shipping, total, couponId ?? null,
       razorpay_order_id, razorpay_payment_id, razorpay_signature, JSON.stringify(shippingAddress)]
    )

    // Insert order items
    for (const item of items) {
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order!.id, item.product_id, item.name, item.image ?? null, item.quantity, item.sale_price ?? item.price, (item.sale_price ?? item.price) * item.quantity]
      )
      // Decrement stock
      await query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [item.quantity, item.product_id])
    }

    // Increment coupon usage
    if (couponId) {
      await query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, [couponId])
    }

    // Send confirmation email
    const email = session?.user?.email ?? shippingAddress.email
    if (email) {
      await sendOrderConfirmation(email, {
        orderNumber,
        total,
        items: items.map((i: CartItem) => ({ name: i.name, quantity: i.quantity, price: i.sale_price ?? i.price })),
      }).catch(() => {})
    }

    // Analytics
    await query(
      `INSERT INTO analytics_events (event_type, user_id, data) VALUES ($1, $2, $3)`,
      ['purchase', session?.user?.id ?? null, JSON.stringify({ order_number: orderNumber, total })]
    ).catch(() => {})

    return NextResponse.json({ success: true, order_id: order!.id, order_number: orderNumber })
  } catch (err) {
    console.error('Checkout verify error:', err)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
