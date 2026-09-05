import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { getAuthUrl } from '@/lib/google-calendar'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const doctor = await queryOne<{ id: number }>(
    'SELECT id FROM doctors WHERE user_id = $1',
    [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })

  const url = getAuthUrl(doctor.id)
  return NextResponse.redirect(url)
}
