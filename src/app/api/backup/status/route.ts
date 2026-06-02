import { NextResponse } from 'next/server'
import { PROJECTS } from '@/config/projects'
import { getLatestRunForWorkflow } from '@/lib/github'

export const dynamic = 'force-dynamic'

export async function GET() {
  const projects = PROJECTS.filter(p => p.backupWorkflow)

  const results = await Promise.all(
    projects.map(async p => {
      const run = await getLatestRunForWorkflow(p.repo, p.backupWorkflow!)
      return { projectId: p.id, run }
    })
  )

  return NextResponse.json(results)
}
