import { NextRequest, NextResponse } from 'next/server'
import { triggerWorkflow, findNewRun, getLatestRunForWorkflow } from '@/lib/github'
import { getProjectByRepo } from '@/config/projects'

export const dynamic = 'force-dynamic'

// POST: trigger backup workflow
export async function POST(_req: NextRequest, { params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params
  const project = getProjectByRepo(repo)
  if (!project) {
    return NextResponse.json({ error: `Project not found: ${repo}` }, { status: 404 })
  }
  if (!project.backupWorkflow) {
    return NextResponse.json({ error: `No backup workflow configured for ${repo}` }, { status: 400 })
  }

  const result = await triggerWorkflow(project.repo, project.backupWorkflow, project.branch)
  if (!result.triggered) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  const triggerTime = new Date()
  const newRun = await findNewRun(project.repo, new Date(triggerTime.getTime() - 5000))

  return NextResponse.json({
    triggered: true,
    runId: newRun?.runId ?? null,
    url: newRun?.url ?? `https://github.com/${process.env.GITHUB_OWNER}/${repo}/actions`,
  })
}

// GET: latest backup run info
export async function GET(_req: NextRequest, { params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params
  const project = getProjectByRepo(repo)
  if (!project) {
    return NextResponse.json({ error: `Project not found: ${repo}` }, { status: 404 })
  }
  if (!project.backupWorkflow) {
    return NextResponse.json({ error: `No backup workflow configured for ${repo}` }, { status: 400 })
  }

  const run = await getLatestRunForWorkflow(project.repo, project.backupWorkflow)
  if (!run) return NextResponse.json(null)
  return NextResponse.json(run)
}
