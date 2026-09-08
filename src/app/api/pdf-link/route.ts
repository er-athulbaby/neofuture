import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPresignedUrl, keyFromUrl } from '@/lib/s3'

// GET /api/pdf-link?url=<encoded-s3-url>
// Generates a 1-hour presigned URL and redirects to it
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })

  const key = keyFromUrl(decodeURIComponent(url))
  const presigned = await getPresignedUrl(key, 3600)

  return NextResponse.redirect(presigned)
}
