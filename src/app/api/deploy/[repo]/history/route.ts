import { NextRequest, NextResponse } from 'next/server'
import { getRecentRunsForWorkflow } from '@/lib/github'
import { getProjectByRepo } from '@/config/projects'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params
  const project = getProjectByRepo(repo)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sp = new URL(req.url).searchParams
  const limit = Math.min(parseInt(sp.get('limit') ?? '5'), 10)
  const workflow = sp.get('workflow') ?? project.deployWorkflow
  const runs = await getRecentRunsForWorkflow(project.repo, workflow, limit)
  return NextResponse.json(runs)
}
