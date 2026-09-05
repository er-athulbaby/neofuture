import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTokensFromCode } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const doctorId = req.nextUrl.searchParams.get('state')

  if (!code || !doctorId) return NextResponse.redirect(new URL('/doctor/dashboard?error=missing_params', req.url))

  try {
    const tokens = await getTokensFromCode(code)
    if (!tokens.refresh_token) return NextResponse.redirect(new URL('/doctor/dashboard?error=no_refresh_token', req.url))

    await query('UPDATE doctors SET google_refresh_token = $1 WHERE id = $2', [tokens.refresh_token, doctorId])
    return NextResponse.redirect(new URL('/doctor/dashboard?connected=1', req.url))
  } catch {
    return NextResponse.redirect(new URL('/doctor/dashboard?error=oauth_failed', req.url))
  }
}
