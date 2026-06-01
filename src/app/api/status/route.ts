import { NextResponse } from 'next/server'
import { PROJECTS } from '@/config/projects'
import { getActiveRun, getLatestRun } from '@/lib/github'

export const dynamic = 'force-dynamic'

export async function GET() {
  const statuses = await Promise.all(
    PROJECTS.map(async p => {
      const [active, latest] = await Promise.all([
        getActiveRun(p.repo),
        getLatestRun(p.repo),
      ])
      return {
        projectId: p.id,
        repo: p.repo,
        domain: p.domain,
        activeRun: active,
        latestRun: latest,
        isDeploying: active !== null,
      }
    })
  )
  return NextResponse.json(statuses)
}
