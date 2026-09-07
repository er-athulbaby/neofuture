import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { email, password } = await req.json()

  if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const doctor = await queryOne<{ id: number; name: string; user_id: string | null }>(
    'SELECT id, name, user_id FROM doctors WHERE id = $1',
    [id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const hash = await bcrypt.hash(password, 10)

  if (doctor.user_id) {
    // Doctor already has a user account — update email + password
    const existing = await queryOne('SELECT id FROM users WHERE email = $1 AND id != $2', [email, doctor.user_id])
    if (existing) return NextResponse.json({ error: 'That email is already in use by another account' }, { status: 409 })
    await query('UPDATE users SET email = $1, password_hash = $2 WHERE id = $3', [email, hash, doctor.user_id])
  } else {
    // No user account yet — create one and link it
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email])
    if (existing) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    const newUser = await queryOne<{ id: string }>(
      'INSERT INTO users (name, email, password_hash, is_doctor) VALUES ($1,$2,$3,true) RETURNING id',
      [doctor.name, email, hash]
    )
    await query('UPDATE doctors SET user_id = $1 WHERE id = $2', [newUser!.id, id])
  }

  return NextResponse.json({ success: true })
}
