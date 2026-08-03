import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

interface Props { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Props) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = String(session.user.id)

  const { label, name, phone, address_line1, address_line2, city, state, pincode, is_default } = await req.json()
  if (!name || !phone || !address_line1 || !city || !state || !pincode) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  if (is_default) {
    await query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId])
  }

  await query(
    `UPDATE user_addresses
     SET label=$1, name=$2, phone=$3, address_line1=$4, address_line2=$5, city=$6, state=$7, pincode=$8, is_default=$9
     WHERE id=$10 AND user_id=$11`,
    [label || 'Home', name, phone, address_line1, address_line2 || null, city, state, pincode, !!is_default, id, userId]
  )
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: Props) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [id, String(session.user.id)])
  return NextResponse.json({ success: true })
}
