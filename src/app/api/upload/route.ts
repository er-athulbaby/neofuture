import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
  const filename = `${Date.now()}_${safe}`

  try {
    const bytes = await file.arrayBuffer()
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET ?? 'neofuture',
      Key: `uploads/${filename}`,
      Body: Buffer.from(bytes),
      ContentType: file.type,
    }))
  } catch (err) {
    console.error('[upload] S3 upload failed:', err)
    return NextResponse.json(
      { error: `Failed to upload file: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ url: `/api/uploads/${filename}` })
}
