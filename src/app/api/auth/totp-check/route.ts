import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

// Returns whether a given email requires TOTP (admin with 2FA enabled).
// Does NOT verify password — safe to call before auth.
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ totp_required: false })

  // Ensure column exists before querying it
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {})

  const user = await queryOne<{ is_admin: boolean; totp_enabled: boolean }>(
    'SELECT is_admin, COALESCE(totp_enabled, false) as totp_enabled FROM users WHERE email = $1',
    [email]
  ).catch(() => null)

  return NextResponse.json({
    totp_required: !!(user?.is_admin && user?.totp_enabled),
  })
}
