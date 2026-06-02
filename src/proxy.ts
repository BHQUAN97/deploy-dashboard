import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/showcase', '/api/showcase', '/login', '/api/auth/login']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const isApiRoute = pathname.startsWith('/api/')

  function validateCredentials(user: string, pass: string) {
    const expectedUser = process.env.DASHBOARD_USER ?? 'admin'
    const expectedPass = process.env.DASHBOARD_PASS ?? 'changeme'
    return user === expectedUser && pass === expectedPass
  }

  // Cookie auth (từ login page)
  const cookieAuth = req.cookies.get('dash_auth')?.value
  if (cookieAuth) {
    try {
      const decoded = Buffer.from(cookieAuth, 'base64').toString('utf-8')
      const colonIdx = decoded.indexOf(':')
      if (colonIdx > 0 && validateCredentials(decoded.slice(0, colonIdx), decoded.slice(colonIdx + 1))) {
        return NextResponse.next()
      }
    } catch {}
  }

  // Authorization header (backwards compat)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
      const colonIdx = decoded.indexOf(':')
      if (colonIdx > 0 && validateCredentials(decoded.slice(0, colonIdx), decoded.slice(colonIdx + 1))) {
        return NextResponse.next()
      }
    } catch {}
  }

  // API routes → 401 JSON (client handles redirect)
  if (isApiRoute) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Page routes → redirect to login
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
