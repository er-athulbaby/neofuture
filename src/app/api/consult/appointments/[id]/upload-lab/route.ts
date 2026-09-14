import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { uploadToS3 } from '@/lib/s3'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024

interface Props { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Props) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const consult = await queryOne<{ id: number; lab_reports: string }>(
    `SELECT id, lab_reports FROM consultations WHERE id=$1 AND patient_id::text=$2::text AND status IN ('confirmed','pending')`,
    [id, session.user.id]
  )
  if (!consult) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Only PDF, JPG, PNG allowed' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Max 10MB' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()
  const key = `lab-reports/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  await uploadToS3(buffer, key, file.type)

  const existing = typeof consult.lab_reports === 'string' ? JSON.parse(consult.lab_reports) : (consult.lab_reports ?? [])
  const updated = [...existing, { key, name: file.name }]
  await query('UPDATE consultations SET lab_reports=$1 WHERE id=$2', [JSON.stringify(updated), consult.id])

  return NextResponse.json({ key, name: file.name })
}
