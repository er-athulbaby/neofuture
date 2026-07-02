import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// UPLOAD_DIR env lets you point outside the git repo on the server
// e.g.  UPLOAD_DIR=/var/www/neofuture-uploads
// Falls back to public/uploads so local dev works without any config.
function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads')
}

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
  const uploadDir = getUploadDir()

  try {
    await mkdir(uploadDir, { recursive: true })
    const bytes = await file.arrayBuffer()
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))
  } catch (err) {
    console.error('[upload] write failed:', uploadDir, err)
    return NextResponse.json(
      { error: `Failed to save file: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }

  // Return /api/uploads/... URL — served by the dedicated route below.
  // This works regardless of where UPLOAD_DIR points and doesn't rely
  // on Next.js static file serving or Nginx configuration.
  return NextResponse.json({ url: `/api/uploads/${filename}` })
}
