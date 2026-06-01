import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/showcase', '/api/showcase']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    const base64 = authHeader.replace('Basic ', '')
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')
    const colonIdx = decoded.indexOf(':')
    const user = decoded.slice(0, colonIdx)
    const pass = decoded.slice(colonIdx + 1)
    const expectedUser = process.env.DASHBOARD_USER ?? 'admin'
    const expectedPass = process.env.DASHBOARD_PASS ?? 'changeme'
    if (user === expectedUser && pass === expectedPass) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Deploy Dashboard"' },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
