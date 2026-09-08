import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif',
}

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

interface Props { params: Promise<{ filename: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { filename } = await params

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const contentType = MIME[ext]
  if (!contentType) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const response = await s3.send(new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET ?? 'neofuture',
      Key: `uploads/${filename}`,
    }))
    const buffer = Buffer.from(await response.Body!.transformToByteArray())
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
