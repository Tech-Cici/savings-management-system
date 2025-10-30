import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const url = req.nextUrl

  // If accessing admin port (3002) and at root, send to admin login
  if (host.endsWith(':3002') && url.pathname === '/') {
    const adminLogin = new URL('/admin/login', req.url)
    return NextResponse.redirect(adminLogin)
  }

  // If accessing client port (3000) and at /admin root, keep default behavior
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin', '/admin/:path*'],
}


