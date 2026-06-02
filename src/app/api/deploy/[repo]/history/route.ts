import { NextRequest, NextResponse } from 'next/server'
import { getRecentRuns } from '@/lib/github'
import { getProjectByRepo } from '@/config/projects'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params
  const project = getProjectByRepo(repo)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') ?? '5'), 10)
  const runs = await getRecentRuns(project.repo, limit)
  return NextResponse.json(runs)
}
