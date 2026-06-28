import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function guard() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function GET() {
  const err = await guard(); if (err) return err
  const users = await query<{
    id: string; name: string; email: string; is_admin: boolean
    created_at: string; order_count: number
  }>(
    `SELECT u.id, u.name, u.email, u.is_admin, u.created_at,
       COUNT(o.id)::int as order_count
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    []
  )
  return NextResponse.json({ users })
}

export async function PATCH(req: NextRequest) {
  const err = await guard(); if (err) return err
  const { id, is_admin } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await query('UPDATE users SET is_admin = $1 WHERE id = $2', [is_admin, id])
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const err = await guard(); if (err) return err
  const session = await auth()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (id === session?.user?.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  await query('DELETE FROM users WHERE id = $1', [id])
  return NextResponse.json({ ok: true })
}
