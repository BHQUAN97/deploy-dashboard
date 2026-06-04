import { NextRequest } from 'next/server'
import { createSshStream, SSE_HEADERS } from '@/lib/ssh-client'
import { getProjectById } from '@/config/projects'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const project = getProjectById(projectId)
  if (!project) return new Response('Project not found', { status: 404 })

  const { searchParams } = new URL(req.url)
  const container = searchParams.get('container') ?? project.logContainers[0]
  const source = searchParams.get('source') ?? 'docker'
  const requestedTail = Number.parseInt(searchParams.get('tail') ?? '50', 10)
  const tail = Number.isFinite(requestedTail) ? Math.min(Math.max(requestedTail, 1), 200) : 50

  if (!project.logContainers.includes(container)) {
    return new Response('Container not allowed', { status: 400 })
  }
  if (source !== 'docker' && source !== 'file') {
    return new Response('Source must be docker or file', { status: 400 })
  }

  let cmd: string
  if (source === 'file') {
    const logFile = project.logFile ?? '/app/logs/error.log'
    cmd = `docker exec ${container} tail -f -n ${tail} ${logFile} 2>/dev/null || echo "[no log file at ${logFile}]"`
  } else {
    cmd = `docker logs ${container} -f --tail ${tail} 2>&1`
  }

  const stream = createSshStream(cmd, 300000)
  return new Response(stream, { headers: SSE_HEADERS })
}
