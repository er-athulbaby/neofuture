import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadToS3 } from '@/lib/s3'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Only PDF, JPG, PNG files allowed' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()
  const key = `lab-reports/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  await uploadToS3(buffer, key, file.type)

  return NextResponse.json({ key, name: file.name, size: file.size, type: file.type })
}
