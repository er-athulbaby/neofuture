import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { uploadToS3 } from '@/lib/s3'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: consultId } = await params

  const doctor = await queryOne<{ id: number }>(
    'SELECT id FROM doctors WHERE user_id=$1', [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const consult = await queryOne(
    'SELECT id FROM consultations WHERE id=$1 AND doctor_id=$2', [consultId, doctor.id]
  )
  if (!consult) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
  const key = `doctor-attachments/${consultId}/${Date.now()}-${safeName}`

  await uploadToS3(buffer, key, file.type || 'application/octet-stream')

  return NextResponse.json({ key, name: file.name })
}
