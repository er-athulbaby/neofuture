import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import type { CartItem } from '@/types'

async function ensureTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS abandoned_carts (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      email VARCHAR(255),
      cart_items JSONB NOT NULL DEFAULT '[]',
      subtotal NUMERIC(10,2) DEFAULT 0,
      reminded_at TIMESTAMPTZ,
      converted BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    []
  )
}

// POST: save/update the cart as an abandoned cart candidate
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const { items, email, subtotal }: { items: CartItem[]; email?: string; subtotal: number } = body

    if (!items?.length) return NextResponse.json({ ok: true })

    await ensureTable()

    const userId = session?.user?.id ?? null
    const emailAddr = email ?? session?.user?.email ?? null

    if (!userId && !emailAddr) return NextResponse.json({ ok: true })

    if (userId) {
      // Upsert by user_id
      await query(
        `INSERT INTO abandoned_carts (user_id, email, cart_items, subtotal, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id) DO UPDATE
           SET cart_items = EXCLUDED.cart_items,
               subtotal = EXCLUDED.subtotal,
               email = COALESCE(EXCLUDED.email, abandoned_carts.email),
               converted = false,
               updated_at = NOW()`,
        [userId, emailAddr, JSON.stringify(items), subtotal]
      ).catch(async () => {
        // No unique constraint yet — add it then retry
        await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_abandoned_carts_user ON abandoned_carts(user_id) WHERE user_id IS NOT NULL`, [])
        await query(
          `INSERT INTO abandoned_carts (user_id, email, cart_items, subtotal, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id) DO UPDATE
             SET cart_items = EXCLUDED.cart_items, subtotal = EXCLUDED.subtotal,
                 email = COALESCE(EXCLUDED.email, abandoned_carts.email),
                 converted = false, updated_at = NOW()`,
          [userId, emailAddr, JSON.stringify(items), subtotal]
        )
      })
    } else {
      // Guest: upsert by email
      await query(
        `INSERT INTO abandoned_carts (email, cart_items, subtotal, updated_at)
         VALUES ($1, $2, $3, NOW())`,
        [emailAddr, JSON.stringify(items), subtotal]
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // non-fatal
  }
}

// DELETE: mark cart as converted (order placed)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json().catch(() => ({}))
    const userId = session?.user?.id ?? null
    const emailAddr = body.email ?? session?.user?.email ?? null

    if (userId) {
      await query(`UPDATE abandoned_carts SET converted = true WHERE user_id = $1`, [userId])
    } else if (emailAddr) {
      await query(`UPDATE abandoned_carts SET converted = true WHERE email = $1`, [emailAddr])
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
