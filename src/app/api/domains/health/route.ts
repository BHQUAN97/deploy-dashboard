import { NextRequest, NextResponse } from 'next/server'
import { checkAllDomains } from '@/lib/domain-health'
import { PROJECTS } from '@/config/projects'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true'
  const domains = PROJECTS.map(p => p.domain)
  const results = await checkAllDomains(domains, forceRefresh)
  return NextResponse.json(results)
}
