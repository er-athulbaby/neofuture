import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { query as pgQuery } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await queryOne<{ name: string; email: string; phone: string | null; gender: string | null }>(
    'SELECT name, email, phone, gender FROM users WHERE id = $1',
    [String(session.user.id)]
  )
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, phone, gender } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const validGenders = ['Male', 'Female', 'Other', null, '']
  const genderVal = validGenders.includes(gender) ? (gender || null) : null

  await pgQuery(
    'UPDATE users SET name = $1, phone = $2, gender = $3 WHERE id = $4',
    [name.trim(), phone?.trim() || null, genderVal, String(session.user.id)]
  )
  return NextResponse.json({ success: true })
}
