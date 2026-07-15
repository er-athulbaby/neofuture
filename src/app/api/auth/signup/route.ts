import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, health_data_consent } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email])
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Ensure consent columns exist (idempotent)
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS health_data_consent BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {})
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS health_data_consent_at TIMESTAMPTZ`, []).catch(() => {})
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {})

    const hash = await bcrypt.hash(password, 12)
    const consentAt = health_data_consent ? new Date().toISOString() : null
    await query(
      `INSERT INTO users (name, email, password_hash, phone, health_data_consent, health_data_consent_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, hash, phone ?? null, health_data_consent ?? false, consentAt]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
