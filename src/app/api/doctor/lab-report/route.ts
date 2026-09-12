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
  const isLabReport = key?.startsWith('lab-reports/')
  const isDoctorAttachment = key?.startsWith('doctor-attachments/')
  if (!key || (!isLabReport && !isDoctorAttachment)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  // Verify access (admins bypass)
  if (!session.user.is_admin) {
    const doctor = await queryOne<{ id: number }>(
      'SELECT id FROM doctors WHERE user_id=$1',
      [session.user.id]
    )
    if (!doctor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (isLabReport) {
      const patientUserId = key.split('/')[1]
      const hasRelation = await queryOne(
        'SELECT id FROM consultations WHERE doctor_id=$1 AND patient_id::text=$2 LIMIT 1',
        [doctor.id, patientUserId]
      )
      if (!hasRelation) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    } else {
      // doctor-attachments/{consultId}/...
      const consultId = key.split('/')[1]
      const hasRelation = await queryOne(
        'SELECT id FROM consultations WHERE id=$1 AND doctor_id=$2 LIMIT 1',
        [consultId, doctor.id]
      )
      if (!hasRelation) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const url = await getPresignedUrl(key, 900) // 15-minute expiry
  return NextResponse.json({ url })
}
