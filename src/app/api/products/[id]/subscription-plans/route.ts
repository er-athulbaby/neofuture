import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params
  const plans = await query(
    `SELECT id, duration_months, label, price FROM subscription_plans
     WHERE product_id = $1 AND is_active = true ORDER BY duration_months`,
    [parseInt(id)]
  ).catch(() => [])
  return NextResponse.json({ plans })
}
