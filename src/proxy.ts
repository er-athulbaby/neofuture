import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Admin routes — must be logged in AND is_admin
  if (pathname.startsWith('/admin')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/admin', request.url))
    }
    if (!session.user.is_admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Account routes — must be logged in
  if (pathname.startsWith('/account')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, request.url))
    }
  }

  // Tools routes — must be logged in
  if (pathname.startsWith('/tools/') && pathname !== '/tools') {
    if (!session?.user) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, request.url))
    }
  }

  // Checkout — must be logged in
  if (pathname === '/checkout') {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/checkout', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/tools/:path*', '/checkout'],
}
