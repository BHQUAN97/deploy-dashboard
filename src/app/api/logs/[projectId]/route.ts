import { NextRequest, NextResponse } from 'next/server'
import { runSshCommand } from '@/lib/ssh-client'
import { getProjectById } from '@/config/projects'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const project = getProjectById(projectId)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const container = searchParams.get('container') ?? project.logContainers[0]
  const source = searchParams.get('source') ?? 'docker'
  const requestedLines = Number.parseInt(searchParams.get('lines') ?? '200', 10)
  const lines = Number.isFinite(requestedLines) ? Math.min(Math.max(requestedLines, 1), 1000) : 200

  if (!project.logContainers.includes(container)) {
    return NextResponse.json({ error: 'Container not allowed' }, { status: 400 })
  }
  if (source !== 'docker' && source !== 'file') {
    return NextResponse.json({ error: 'Source must be docker or file' }, { status: 400 })
  }

  let cmd: string
  if (source === 'file') {
    const logFile = project.logFile ?? '/app/logs/error.log'
    cmd = `docker exec ${container} tail -n ${lines} ${logFile} 2>/dev/null || echo "[no log file at ${logFile}]"`
  } else {
    cmd = `docker logs ${container} --tail ${lines} 2>&1`
  }

  try {
    const result = await runSshCommand(cmd, 30000)
    const raw = result.stdout + result.stderr
    const logLines = raw.split('\n').filter(l => l.trim())
    return NextResponse.json({ lines: logLines, container, source, count: logLines.length })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'SSH error' }, { status: 500 })
  }
}
