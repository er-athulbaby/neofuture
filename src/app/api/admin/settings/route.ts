import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.is_admin) return null
  return session
}

export async function GET() {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Ensure table exists
  await query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []).catch(() => {})

  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM site_settings`, []
  ).catch(() => [])

  const settings: Record<string, string> = {}
  rows.forEach((r) => { settings[r.key] = r.value })

  return NextResponse.json({ settings })
}

export async function POST(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  await query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []).catch(() => {})

  for (const [key, value] of Object.entries(body)) {
    await query(
      `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, String(value)]
    )
  }

  revalidatePath('/', 'layout')

  return NextResponse.json({ success: true })
}
