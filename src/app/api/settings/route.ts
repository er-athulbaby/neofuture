import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

// Public endpoint — returns only non-sensitive settings needed by the frontend
export async function GET() {
  const [cod, gstRate, gstType, freeAbove, shippingCharge] = await Promise.all([
    queryOne<{ value: string }>(`SELECT value FROM site_settings WHERE key = 'cod_enabled'`, []).catch(() => null),
    queryOne<{ value: string }>(`SELECT value FROM site_settings WHERE key = 'gst_rate'`, []).catch(() => null),
    queryOne<{ value: string }>(`SELECT value FROM site_settings WHERE key = 'gst_type'`, []).catch(() => null),
    queryOne<{ value: string }>(`SELECT value FROM site_settings WHERE key = 'shipping_free_above'`, []).catch(() => null),
    queryOne<{ value: string }>(`SELECT value FROM site_settings WHERE key = 'shipping_charge'`, []).catch(() => null),
  ])

  return NextResponse.json({
    cod_enabled: cod?.value === 'true',
    gst_rate: Number(gstRate?.value ?? '0'),
    gst_type: gstType?.value ?? 'inclusive',
    shipping_free_above: Number(freeAbove?.value ?? '999'),
    shipping_charge: Number(shippingCharge?.value ?? '50'),
  })
}
