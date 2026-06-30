import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { sendAbandonedCartEmail } from '@/lib/email'

// Called by a cron job hourly. Requires Authorization: Bearer <CRON_SECRET>
// Server setup: add to crontab:
//   0 * * * * curl -s -X POST https://yourdomain.com/api/cron/abandoned-cart \
//     -H "Authorization: Bearer $CRON_SECRET" >> /var/log/nf-cron.log 2>&1

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteUrl = process.env.NEXTAUTH_URL ?? 'https://neofuture.in'

  try {
    // Find carts abandoned > 2 hours ago, not yet reminded, not converted, with email
    const carts = await query<{
      id: number
      email: string
      cart_items: string
      subtotal: number
    }>(
      `SELECT id, email, cart_items, subtotal FROM abandoned_carts
       WHERE converted = false
         AND reminded_at IS NULL
         AND email IS NOT NULL
         AND updated_at < NOW() - INTERVAL '2 hours'
       LIMIT 50`,
      []
    )

    let sent = 0
    for (const cart of carts) {
      try {
        const items = typeof cart.cart_items === 'string'
          ? JSON.parse(cart.cart_items)
          : cart.cart_items

        await sendAbandonedCartEmail(cart.email, {
          items: items.map((i: { name: string; quantity: number; price: number; sale_price?: number }) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.sale_price ?? i.price,
          })),
          subtotal: cart.subtotal,
          siteUrl,
        })

        await query(`UPDATE abandoned_carts SET reminded_at = NOW() WHERE id = $1`, [cart.id])
        sent++
      } catch (err) {
        console.error(`Failed to send abandoned cart email to ${cart.email}:`, err)
      }
    }

    return NextResponse.json({ ok: true, processed: carts.length, sent })
  } catch (err) {
    console.error('Abandoned cart cron error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
