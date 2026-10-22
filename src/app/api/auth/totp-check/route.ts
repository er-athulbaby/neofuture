import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

// Returns whether a given email requires TOTP (admin with 2FA enabled).
// Does NOT verify password — safe to call before auth.
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ totp_required: false })

  const user = await queryOne<{ is_admin: boolean; totp_enabled: boolean }>(
    'SELECT is_admin, totp_enabled FROM users WHERE email = $1',
    [email]
  ).catch(() => null)

  return NextResponse.json({
    totp_required: !!(user?.is_admin && user?.totp_enabled),
  })
}
