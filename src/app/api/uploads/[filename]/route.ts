import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads')
}

// SVG excluded — serving SVG with image/svg+xml from same origin enables stored XSS
const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif',
}

interface Props { params: Promise<{ filename: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { filename } = await params

  // Block path traversal attacks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = path.join(getUploadDir(), filename)

  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const contentType = MIME[ext]
  // Refuse to serve file types not in the allowlist (e.g. pre-existing SVGs)
  if (!contentType) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const buffer = await readFile(filePath)

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
