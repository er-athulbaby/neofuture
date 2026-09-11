import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPresignedUrl } from '@/lib/s3'
import { queryOne } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_doctor && !session?.user?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const key = req.nextUrl.searchParams.get('key')
  if (!key || !key.startsWith('lab-reports/')) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  // Verify the lab report belongs to a patient of this doctor (admins bypass)
  if (!session.user.is_admin) {
    const patientUserId = key.split('/')[1]
    const doctor = await queryOne<{ id: number }>(
      'SELECT id FROM doctors WHERE user_id=$1',
      [session.user.id]
    )
    if (!doctor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const hasRelation = await queryOne(
      'SELECT id FROM consultations WHERE doctor_id=$1 AND patient_id::text=$2 LIMIT 1',
      [doctor.id, patientUserId]
    )
    if (!hasRelation) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = await getPresignedUrl(key, 900) // 15-minute expiry
  return NextResponse.json({ url })
}
