import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPresignedUrl } from '@/lib/s3'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_doctor && !session?.user?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const key = req.nextUrl.searchParams.get('key')
  if (!key || !key.startsWith('lab-reports/')) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  const url = await getPresignedUrl(key, 900) // 15-minute expiry
  return NextResponse.json({ url })
}
