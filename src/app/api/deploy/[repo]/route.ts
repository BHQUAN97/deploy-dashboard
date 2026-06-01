import { NextRequest, NextResponse } from 'next/server'
import { getActiveRun, getLatestRun, triggerWorkflow, findNewRun } from '@/lib/github'
import { getProjectByRepo } from '@/config/projects'

export const dynamic = 'force-dynamic'

// POST: trigger deploy
export async function POST(req: NextRequest, { params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params
  const project = getProjectByRepo(repo)
  if (!project) {
    return NextResponse.json({ error: `Project not found: ${repo}` }, { status: 404 })
  }

  const result = await triggerWorkflow(project.repo, project.deployWorkflow, project.branch)
  if (!result.triggered) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  // Poll để tìm run ID vừa được tạo
  const triggerTime = new Date()
  const newRun = await findNewRun(project.repo, new Date(triggerTime.getTime() - 5000))

  return NextResponse.json({
    triggered: true,
    runId: newRun?.runId ?? null,
    url: newRun?.url ?? `https://github.com/${process.env.GITHUB_OWNER}/${repo}/actions`,
  })
}

// GET: lấy latest run
export async function GET(_req: NextRequest, { params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params
  const run = await getLatestRun(repo)
  if (!run) return NextResponse.json(null)
  return NextResponse.json(run)
}
