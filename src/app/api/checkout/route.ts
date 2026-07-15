import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { generateOrderNumber } from '@/lib/utils'
import { sendOrderConfirmation } from '@/lib/email'
import type { CartItem, ShippingAddress, Coupon } from '@/types'
import { awardPoints, hasEverDone, ensureNeopulseTables } from '@/lib/neopulse'

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

async function isCodEnabled(): Promise<boolean> {
  try {
    const row = await queryOne<{ value: string }>(`SELECT value FROM site_settings WHERE key = 'cod_enabled'`, [])
    return row?.value === 'true'
  } catch {
    return false
  }
}

async function getGSTSettings() {
  const [rateRow, typeRow] = await Promise.all([
    queryOne<{ value: string }>(`SELECT value FROM site_settings WHERE key = 'gst_rate'`, []).catch(() => null),
    queryOne<{ value: string }>(`SELECT value FROM site_settings WHERE key = 'gst_type'`, []).catch(() => null),
  ])
  return {
    rate: Number(rateRow?.value ?? '0'),
    type: (typeRow?.value ?? 'inclusive') as 'inclusive' | 'exclusive',
  }
}

async function calcNpDiscount(userId: number | null | undefined, neopulsePoints: number): Promise<number> {
  if (!userId || !neopulsePoints || neopulsePoints < 100) return 0
  const user = await queryOne<{ neopulse_balance: number }>(`SELECT neopulse_balance FROM users WHERE id = $1`, [userId])
  if (!user || user.neopulse_balance < neopulsePoints) return 0
  // 100 NP = ₹10 flat discount
  return Math.floor(neopulsePoints / 100) * 10
}

async function calcOrder(items: CartItem[], couponCode: string | undefined, gst?: { rate: number; type: 'inclusive' | 'exclusive' }) {
  const productIds = items.map((i) => i.product_id)
  const dbProducts = await query<{ id: number; price: number; sale_price: number | null; stock: number; name: string; images: string[]; custom_gst_rate: number | null; min_order_qty: number }>(
    `SELECT id, price, sale_price, stock, name, images, custom_gst_rate, COALESCE(min_order_qty, 1) as min_order_qty FROM products WHERE id = ANY($1) AND is_active = true`,
    [productIds]
  )

  let subtotal = 0
  let tax = 0
  const validatedItems = []
  for (const item of items) {
    const dbP = dbProducts.find((p) => p.id === item.product_id)
    if (!dbP) throw new Error(`Product ${item.name} not found`)
    if (dbP.stock < item.quantity) throw new Error(`Insufficient stock for ${dbP.name}`)
    if (item.quantity < dbP.min_order_qty) throw new Error(`Minimum order for ${dbP.name} is ${dbP.min_order_qty}`)
    const price = dbP.sale_price ?? dbP.price
    const lineTotal = price * item.quantity
    subtotal += lineTotal
    // Per-product GST (exclusive only): use product rate if set, else fall back to global
    if (gst && gst.type === 'exclusive') {
      const rate = dbP.custom_gst_rate != null ? dbP.custom_gst_rate : gst.rate
      if (rate > 0) tax += Math.round(lineTotal * rate / 100)
    }
    validatedItems.push({ ...item, price, dbProduct: dbP })
  }

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
  const total = subtotal - discount + shipping + tax
  return { subtotal, discount, shipping, tax, total, couponId, validatedItems }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const { items, shippingAddress, couponCode, payment_method, neopulse_points }: {
      items: CartItem[]
      shippingAddress: ShippingAddress
      couponCode?: string
      payment_method?: 'razorpay' | 'cod'
      neopulse_points?: number
    } = body

    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    const [codEnabled, gst] = await Promise.all([isCodEnabled(), getGSTSettings()])
    await ensureNeopulseTables().catch(() => {})

    // Ensure tax + subscription columns exist (idempotent)
    await Promise.all([
      query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2) DEFAULT 0`, []).catch(() => {}),
      query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subscription_plan_id INTEGER`, []).catch(() => {}),
      query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subscription_months INTEGER`, []).catch(() => {}),
    ])

    // --- COD path: create order directly ---
    if (payment_method === 'cod') {
      if (!codEnabled) return NextResponse.json({ error: 'Cash on Delivery is not available.' }, { status: 400 })

      const { subtotal, discount, shipping, tax, total: baseTotal, couponId, validatedItems } = await calcOrder(items, couponCode, gst)
      const npPoints = Number(neopulse_points ?? 0)
      const npDiscountAmt = await calcNpDiscount(session?.user?.id ? Number(session.user.id) : null, npPoints)
      const total = Math.max(0, baseTotal - npDiscountAmt)
      const orderNumber = generateOrderNumber()

      const subPlanId = items.find((i) => i.subscription_plan_id)?.subscription_plan_id ?? null
      const subMonths = items.find((i) => i.subscription_months)?.subscription_months ?? null

      const order = await queryOne<{ id: number }>(
        `INSERT INTO orders
          (order_number, user_id, subtotal, discount, shipping, tax, total, coupon_id, status, payment_status, shipping_address, subscription_plan_id, subscription_months)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', 'pending', $9, $10, $11)
         RETURNING id`,
        [orderNumber, session?.user?.id ?? null, subtotal, discount, shipping, tax, total,
         couponId ?? null, JSON.stringify(shippingAddress), subPlanId, subMonths]
      )

      for (const item of validatedItems) {
        await query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [order!.id, item.product_id, item.name, item.image ?? null, item.quantity, item.price, item.price * item.quantity]
        )
        // Atomic stock decrement — fails if stock is now insufficient (race condition guard)
        const updated = await query(
          `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id`,
          [item.quantity, item.product_id]
        )
        if (updated.length === 0) throw new Error(`${item.name} just went out of stock. Please remove it from your cart.`)
      }

      if (couponId) await query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, [couponId])

      // Deduct NP if used
      if (npDiscountAmt > 0 && session?.user?.id) {
        await query(
          `INSERT INTO neopulse_transactions (user_id, action, points, description, reference_id) VALUES ($1, 'redemption', $2, $3, $4)`,
          [String(session.user.id), -npPoints, `Redeemed ${npPoints} NP — ${npPoints / 100}% discount on order ${orderNumber}`, orderNumber]
        ).catch(() => {})
        await query(`UPDATE users SET neopulse_balance = neopulse_balance - $1 WHERE id = $2`, [npPoints, session.user.id]).catch(() => {})
      }

      // Award first-purchase bonus
      if (session?.user?.id) {
        const isFirst = !(await hasEverDone(String(session.user.id), 'first_purchase'))
        if (isFirst) await awardPoints(String(session.user.id), 'first_purchase', orderNumber).catch(() => {})
      }

      const email = session?.user?.email ?? shippingAddress.email
      if (email) {
        await sendOrderConfirmation(email, {
          orderNumber,
          orderId: order!.id,
          total,
          subtotal,
          discount,
          shipping,
          tax,
          items: validatedItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
          shippingAddress,
        }).catch(() => {})
      }

      await query(
        `INSERT INTO analytics_events (event_type, user_id, data) VALUES ($1, $2, $3)`,
        ['purchase', session?.user?.id ?? null, JSON.stringify({ order_number: orderNumber, total, method: 'cod' })]
      ).catch(() => {})

      return NextResponse.json({ cod: true, success: true, order_id: order!.id, order_number: orderNumber })
    }

    // --- Razorpay path ---
    const { subtotal, discount, shipping, tax, total: rzpBase, couponId } = await calcOrder(items, couponCode, gst)
    const npPts = Number(neopulse_points ?? 0)
    const npDisc = await calcNpDiscount(session?.user?.id ? Number(session.user.id) : null, npPts)
    const total = Math.max(0, rzpBase - npDisc)

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys not configured')
      return NextResponse.json({ error: 'Payment gateway not configured. Please contact support.' }, { status: 500 })
    }

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
      tax,
      total,
      coupon_id: couponId,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      cod_enabled: codEnabled,
      gst_rate: gst.rate,
      gst_type: gst.type,
      neopulse_points: npPts,
      neopulse_discount: npDisc,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create order'
    console.error('Checkout create error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      items, shippingAddress, subtotal, discount, shipping, tax, total, couponId,
      neopulse_points: rzpNpPoints,
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

    const subPlanId = items.find((i: CartItem) => i.subscription_plan_id)?.subscription_plan_id ?? null
    const subMonths = items.find((i: CartItem) => i.subscription_months)?.subscription_months ?? null

    const order = await queryOne<{ id: number }>(
      `INSERT INTO orders
        (order_number, user_id, subtotal, discount, shipping, tax, total, coupon_id, status, payment_status,
         razorpay_order_id, razorpay_payment_id, razorpay_signature, shipping_address, subscription_plan_id, subscription_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', 'paid', $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [orderNumber, session?.user?.id ?? null, subtotal, discount, shipping, tax ?? 0, total, couponId ?? null,
       razorpay_order_id, razorpay_payment_id, razorpay_signature, JSON.stringify(shippingAddress), subPlanId, subMonths]
    )

    for (const item of items) {
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order!.id, item.product_id, item.name, item.image ?? null, item.quantity, item.sale_price ?? item.price, (item.sale_price ?? item.price) * item.quantity]
      )
      const upd = await query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id`,
        [item.quantity, item.product_id]
      )
      if (upd.length === 0) throw new Error(`${item.product_name ?? item.name} just went out of stock`)
    }

    if (couponId) {
      await query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, [couponId])
    }

    // Deduct NP if used
    const rzpNpPts = Number(rzpNpPoints ?? 0)
    if (rzpNpPts > 0 && session?.user?.id) {
      await query(
        `INSERT INTO neopulse_transactions (user_id, action, points, description, reference_id) VALUES ($1, 'redemption', $2, $3, $4)`,
        [String(session.user.id), -rzpNpPts, `Redeemed ${rzpNpPts} NP — ${rzpNpPts / 100}% discount on order ${orderNumber}`, orderNumber]
      ).catch(() => {})
      await query(`UPDATE users SET neopulse_balance = neopulse_balance - $1 WHERE id = $2`, [rzpNpPts, session.user.id]).catch(() => {})
    }

    // Award first-purchase bonus
    if (session?.user?.id) {
      const isFirst = !(await hasEverDone(String(session.user.id), 'first_purchase').catch(() => true))
      if (isFirst) await awardPoints(String(session.user.id), 'first_purchase', orderNumber).catch(() => {})
    }

    const email = session?.user?.email ?? shippingAddress.email
    if (email) {
      await sendOrderConfirmation(email, {
        orderNumber,
        orderId: order!.id,
        total,
        subtotal,
        discount,
        shipping,
        tax: tax ?? 0,
        items: items.map((i: CartItem) => ({ name: i.name, quantity: i.quantity, price: i.sale_price ?? i.price })),
        shippingAddress,
      }).catch(() => {})
    }

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
