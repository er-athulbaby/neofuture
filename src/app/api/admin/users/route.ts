import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

async function guard() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function GET(req: NextRequest) {
  const err = await guard(); if (err) return err

  // Deleted users log
  if (new URL(req.url).searchParams.get('deleted') === '1') {
    await query(`CREATE TABLE IF NOT EXISTS deleted_users_log (
      id SERIAL PRIMARY KEY, user_id TEXT, name TEXT, email TEXT,
      deleted_by TEXT, deleted_at TIMESTAMPTZ DEFAULT NOW()
    )`, []).catch(() => {})
    const rows = await query<{ id: number; user_id: string; name: string; email: string; deleted_by: string; deleted_at: string }>(
      `SELECT * FROM deleted_users_log ORDER BY deleted_at DESC`, []
    ).catch(() => [])
    return NextResponse.json({ deleted: rows })
  }

  const users = await query<{
    id: string; name: string; email: string; is_admin: boolean; is_doctor: boolean
    created_at: string; order_count: number
  }>(
    `SELECT u.id, u.name, u.email, u.is_admin, u.is_doctor, u.created_at,
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
  const { id, is_admin, is_doctor } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (is_admin !== undefined) {
    await query('UPDATE users SET is_admin = $1 WHERE id = $2', [is_admin, id])
  }
  if (is_doctor !== undefined) {
    await query('UPDATE users SET is_doctor = $1 WHERE id = $2', [is_doctor, id])
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const err = await guard(); if (err) return err
  const session = await auth()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (id === session?.user?.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  // Log before deleting so admins can see who was removed
  await query(`
    CREATE TABLE IF NOT EXISTS deleted_users_log (
      id SERIAL PRIMARY KEY,
      user_id TEXT, name TEXT, email TEXT,
      deleted_by TEXT, deleted_at TIMESTAMPTZ DEFAULT NOW()
    )`, []).catch(() => {})

  const victim = await queryOne<{ name: string; email: string }>('SELECT name, email FROM users WHERE id = $1', [id]).catch(() => null)
  if (victim) {
    await query(
      `INSERT INTO deleted_users_log (user_id, name, email, deleted_by) VALUES ($1, $2, $3, $4)`,
      [id, victim.name, victim.email, session.user.email]
    ).catch(() => {})
  }

  await query('DELETE FROM users WHERE id = $1', [id])
  return NextResponse.json({ ok: true })
}
