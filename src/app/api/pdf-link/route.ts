import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPresignedUrl, keyFromUrl } from '@/lib/s3'
import { queryOne } from '@/lib/db'

// GET /api/pdf-link?url=<encoded-s3-url>
// Generates a 1-hour presigned URL after verifying the caller owns the resource
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })

  const key = keyFromUrl(decodeURIComponent(url))

  // Verify prescription PDF belongs to this user (patient or doctor of that consultation)
  const prescriptionMatch = key.match(/^prescriptions\/(\d+)\//)
  if (prescriptionMatch && !session.user.is_admin) {
    const consultationId = prescriptionMatch[1]
    const consult = await queryOne<{ patient_id: string; doctor_id: number }>(
      'SELECT patient_id, doctor_id FROM consultations WHERE id=$1',
      [consultationId]
    )
    if (!consult) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const isPatient = String(consult.patient_id) === session.user.id
    const isDoctor = session.user.is_doctor
      ? !!(await queryOne('SELECT id FROM doctors WHERE user_id=$1 AND id=$2', [session.user.id, consult.doctor_id]))
      : false
    if (!isPatient && !isDoctor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const presigned = await getPresignedUrl(key, 3600)
  return NextResponse.redirect(presigned)
}
