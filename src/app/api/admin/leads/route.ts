import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

async function adminGuard() {
  const session = await auth()
  return session?.user?.is_admin ? session : null
}

export async function GET(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const leads = await query(
    `SELECT * FROM wellness_leads ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const [{ count }] = await query<{ count: string }>('SELECT COUNT(*)::int as count FROM wellness_leads')
  return NextResponse.json({ leads, total: Number(count) })
}

export async function PUT(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, is_contacted, notes } = await req.json()
  await query(
    `UPDATE wellness_leads SET is_contacted = $1, notes = $2 WHERE id = $3`,
    [is_contacted, notes ?? null, id]
  )
  return NextResponse.json({ success: true })
}
