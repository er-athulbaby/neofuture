import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

async function ensureTotpColumns() {
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64)`, []).catch(() => {})
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {})
}

// GET — returns current TOTP status, or generates a new secret + QR for setup
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureTotpColumns()

  const url = new URL(req.url)
  if (url.searchParams.get('status') === '1') {
    const user = await queryOne<{ totp_enabled: boolean }>(
      'SELECT totp_enabled FROM users WHERE id = $1', [session.user.id]
    )
    return NextResponse.json({ alreadyEnabled: !!user?.totp_enabled })
  }

  const secret = authenticator.generateSecret()
  const otpauth = authenticator.keyuri(session.user.email ?? 'admin', 'NeoFuture Admin', secret)
  const qrDataUrl = await QRCode.toDataURL(otpauth)

  // Store secret temporarily (not enabled yet — enabled only after user verifies)
  await query('UPDATE users SET totp_secret = $1, totp_enabled = false WHERE id = $2', [
    secret,
    session.user.id,
  ])

  return NextResponse.json({ secret, qrDataUrl })
}

// POST — verify code and enable TOTP
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const user = await queryOne<{ totp_secret: string }>(
    'SELECT totp_secret FROM users WHERE id = $1',
    [session.user.id]
  )
  if (!user?.totp_secret) return NextResponse.json({ error: 'Setup not started' }, { status: 400 })

  const valid = authenticator.verify({ token: code, secret: user.totp_secret })
  if (!valid) return NextResponse.json({ error: 'Invalid code — try again' }, { status: 400 })

  await query('UPDATE users SET totp_enabled = true WHERE id = $1', [session.user.id])
  return NextResponse.json({ ok: true })
}

// DELETE — disable TOTP
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await query('UPDATE users SET totp_secret = NULL, totp_enabled = false WHERE id = $1', [
    session.user.id,
  ])
  return NextResponse.json({ ok: true })
}
