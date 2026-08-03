import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface Props { params: Promise<{ id: string }> }

async function ensureMrpColumn() {
  await query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS mrp_price NUMERIC(10,2)`, []).catch(() => {})
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params
  await ensureMrpColumn()
  const plans = await query(
    `SELECT id, duration_months, label, price, mrp_price FROM subscription_plans
     WHERE product_id = $1 AND is_active = true ORDER BY duration_months`,
    [parseInt(id)]
  ).catch(() => [])
  return NextResponse.json({ plans })
}
