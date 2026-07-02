import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads')
}

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
}

interface Props { params: Promise<{ filename: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { filename } = await params

  // Block path traversal attacks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = path.join(getUploadDir(), filename)

  try {
    const buffer = await readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const contentType = MIME[ext] ?? 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
