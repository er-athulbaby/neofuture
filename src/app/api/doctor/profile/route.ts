import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doctor = await queryOne<{
    id: number; name: string; photo_url: string | null; qualification: string | null
    specialisation: string | null; registration_no: string | null; google_refresh_token: string | null
  }>(
    'SELECT id, name, photo_url, qualification, specialisation, registration_no, google_refresh_token FROM doctors WHERE user_id = $1',
    [session.user.id]
  )

  if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
  return NextResponse.json(doctor)
}
