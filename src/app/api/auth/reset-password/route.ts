import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const row = await queryOne<{ email: string; expires_at: string; used: boolean }>(
      `SELECT email, expires_at, used FROM password_reset_tokens WHERE token = $1`,
      [token]
    )

    if (!row) return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    if (row.used) return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 })
    if (new Date(row.expires_at) < new Date()) return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })

    const hash = await bcrypt.hash(password, 12)

    await query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hash, row.email])
    await query(`UPDATE password_reset_tokens SET used = true WHERE token = $1`, [token])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
