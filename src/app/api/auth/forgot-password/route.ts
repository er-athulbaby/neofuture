import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { sendPasswordReset } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // Ensure reset tokens table exists
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `, [])

    // Check user exists (don't reveal whether email exists — always respond success)
    const user = await queryOne<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )

    if (user) {
      // Delete any existing unused tokens for this email
      await query(`DELETE FROM password_reset_tokens WHERE email = $1`, [email.toLowerCase()])

      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await query(
        `INSERT INTO password_reset_tokens (token, email, expires_at) VALUES ($1, $2, $3)`,
        [token, email.toLowerCase(), expires]
      )

      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
      const resetUrl = `${baseUrl}/reset-password?token=${token}`

      await sendPasswordReset(user.email, resetUrl).catch((err) => {
        console.error('Failed to send reset email:', err)
      })
    }

    // Always return success (security: don't reveal if email exists)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
