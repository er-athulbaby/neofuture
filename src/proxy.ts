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

  // Doctor routes — must be doctor or admin
  if (pathname.startsWith('/doctor')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!session.user.is_doctor && !session.user.is_admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Consult room — must be logged in
  if (pathname.startsWith('/consult/room')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  const res = NextResponse.next()
  res.headers.set('x-pathname', pathname)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
