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

async function ensurePendingOrdersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS pending_razorpay_orders (
      razorpay_order_id TEXT PRIMARY KEY,
      user_id TEXT,
      subtotal NUMERIC(10,2) NOT NULL,
      discount NUMERIC(10,2) NOT NULL DEFAULT 0,
      shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
      tax NUMERIC(10,2) NOT NULL DEFAULT 0,
      total NUMERIC(10,2) NOT NULL,
      coupon_id INTEGER,
      neopulse_points INTEGER NOT NULL DEFAULT 0,
      items JSONB NOT NULL,
      shipping_address JSONB,
      subscription_plan_id INTEGER,
      subscription_months INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `, []).catch(() => {})
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
    // Per-product GST: use product's custom_gst_rate if set, else global rate
    if (gst && gst.rate > 0) {
      const rate = dbP.custom_gst_rate != null ? Number(dbP.custom_gst_rate) : gst.rate
      if (rate > 0) {
        if (gst.type === 'exclusive') {
          tax += Math.round(lineTotal * rate / 100)
        } else {
          tax += Math.round((lineTotal * rate) / (100 + rate))
        }
      }
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
    const { subtotal, discount, shipping, tax, total: rzpBase, couponId, validatedItems } = await calcOrder(items, couponCode, gst)
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
      console.error('Razorpay order creation failed:', rzpErr)
      return NextResponse.json({ error: 'Payment gateway unavailable. Please try again or choose Cash on Delivery.' }, { status: 500 })
    }

    // Store canonical order data server-side — prevents client price manipulation in PUT
    await ensurePendingOrdersTable()
    const subPlanId = items.find((i: CartItem) => i.subscription_plan_id)?.subscription_plan_id ?? null
    const subMonths = items.find((i: CartItem) => i.subscription_months)?.subscription_months ?? null
    await query(
      `INSERT INTO pending_razorpay_orders
         (razorpay_order_id, user_id, subtotal, discount, shipping, tax, total, coupon_id, neopulse_points, items, subscription_plan_id, subscription_months)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (razorpay_order_id) DO NOTHING`,
      [rzpOrder.id, session?.user?.id ?? null, subtotal, discount, shipping, tax, total, couponId ?? null, npPts, JSON.stringify(validatedItems), subPlanId, subMonths]
    ).catch(() => {})

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
      gst_rate: tax > 0 && subtotal > 0 ? Math.round((tax / subtotal) * 100) : gst.rate,
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = body

    // Verify Razorpay signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    // Retrieve canonical order data stored during POST — never trust client for prices/items
    await ensurePendingOrdersTable()
    type PendingOrder = {
      user_id: string | null; subtotal: string; discount: string; shipping: string; tax: string; total: string;
      coupon_id: number | null; neopulse_points: number; items: CartItem[];
      subscription_plan_id: number | null; subscription_months: number | null;
    }
    const pending = await queryOne<PendingOrder>(
      'SELECT * FROM pending_razorpay_orders WHERE razorpay_order_id = $1',
      [razorpay_order_id]
    )
    if (!pending) {
      return NextResponse.json({ error: 'Order session expired or not found' }, { status: 400 })
    }

    const subtotal = Number(pending.subtotal)
    const discount = Number(pending.discount)
    const shipping = Number(pending.shipping)
    const tax = Number(pending.tax)
    const total = Number(pending.total)
    const couponId = pending.coupon_id
    const items: CartItem[] = Array.isArray(pending.items) ? pending.items : JSON.parse(pending.items as unknown as string)
    const subPlanId = pending.subscription_plan_id
    const subMonths = pending.subscription_months

    const orderNumber = generateOrderNumber()

    const order = await queryOne<{ id: number }>(
      `INSERT INTO orders
        (order_number, user_id, subtotal, discount, shipping, tax, total, coupon_id, status, payment_status,
         razorpay_order_id, razorpay_payment_id, razorpay_signature, shipping_address, subscription_plan_id, subscription_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', 'paid', $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [orderNumber, pending.user_id ?? session?.user?.id ?? null, subtotal, discount, shipping, tax, total, couponId ?? null,
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
      if (upd.length === 0) throw new Error(`${item.name} just went out of stock`)
    }

    if (couponId) {
      await query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, [couponId])
    }

    // Deduct NP — validate against DB balance, use server-stored points value
    const rzpNpPts = Number(pending.neopulse_points ?? 0)
    if (rzpNpPts > 0 && session?.user?.id) {
      const userBalance = await queryOne<{ neopulse_balance: number }>(
        'SELECT neopulse_balance FROM users WHERE id = $1', [String(session.user.id)]
      )
      const safeDeduct = Math.min(rzpNpPts, userBalance?.neopulse_balance ?? 0)
      if (safeDeduct > 0) {
        await query(
          `INSERT INTO neopulse_transactions (user_id, action, points, description, reference_id) VALUES ($1, 'redemption', $2, $3, $4)`,
          [String(session.user.id), -safeDeduct, `Redeemed ${safeDeduct} NP on order ${orderNumber}`, orderNumber]
        ).catch(() => {})
        await query(
          `UPDATE users SET neopulse_balance = GREATEST(0, neopulse_balance - $1) WHERE id = $2`,
          [safeDeduct, session.user.id]
        ).catch(() => {})
      }
    }

    // Clean up pending record
    await query('DELETE FROM pending_razorpay_orders WHERE razorpay_order_id = $1', [razorpay_order_id]).catch(() => {})

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
