import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { verify as verifyTotp } from '@/lib/totp'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { code } = await req.json().catch(() => ({}))
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  // Ensure column exists
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMPTZ`, []).catch(() => {})

  const user = await queryOne<{ totp_secret: string | null; totp_enabled: boolean }>(
    `SELECT totp_secret, COALESCE(totp_enabled, false) as totp_enabled FROM users WHERE id = $1`,
    [session.user.id]
  )

  if (!user?.totp_enabled || !user.totp_secret) {
    return NextResponse.json({ error: '2FA not enabled on this account' }, { status: 400 })
  }

  const valid = verifyTotp(code, user.totp_secret)
  if (!valid) return NextResponse.json({ error: 'Invalid code — try again' }, { status: 400 })

  await query(`UPDATE users SET totp_verified_at = NOW() WHERE id = $1`, [session.user.id])
  return NextResponse.json({ ok: true })
}
