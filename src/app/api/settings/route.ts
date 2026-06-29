import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

// Public endpoint — returns only non-sensitive settings needed by the frontend
export async function GET() {
  const cod = await queryOne<{ value: string }>(
    `SELECT value FROM site_settings WHERE key = 'cod_enabled'`,
    []
  ).catch(() => null)

  return NextResponse.json({
    cod_enabled: cod?.value === 'true',
  })
}
