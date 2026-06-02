import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { user, pass } = body as { user?: string; pass?: string }

  const expectedUser = process.env.DASHBOARD_USER ?? 'admin'
  const expectedPass = process.env.DASHBOARD_PASS ?? 'changeme'

  if (!user || !pass || user !== expectedUser || pass !== expectedPass) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = Buffer.from(`${user}:${pass}`).toString('base64')
  const res = NextResponse.json({ ok: true })
  res.cookies.set('dash_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
