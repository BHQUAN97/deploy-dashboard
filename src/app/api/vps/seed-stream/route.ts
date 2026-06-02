import { NextRequest } from 'next/server'
import { createSshStream, SSE_HEADERS } from '@/lib/ssh-client'
import { getProjectById } from '@/config/projects'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') ?? ''
  const scriptId = req.nextUrl.searchParams.get('scriptId') ?? ''

  const project = getProjectById(projectId)
  if (!project) return new Response('Project not found', { status: 404 })

  // Validate whitelist — chống command injection
  const validScript = project.seedScripts.find(s => s.id === scriptId)
  if (!validScript) return new Response('Script not allowed', { status: 400 })

  let cmd: string

  if (validScript.hostCommand) {
    // Chạy thẳng trên VPS host (ví dụ: SQL pipe vào shared-mysql)
    cmd = `${validScript.hostCommand} 2>&1`
  } else {
    const container = project.containerForSeed
    if (!container) return new Response('No seed container configured', { status: 400 })
    const innerCmd = validScript.command ?? `node dist/scripts/${scriptId}.js`
    cmd = `docker exec ${container} ${innerCmd} 2>&1`
  }

  return new Response(createSshStream(cmd, 120000), { headers: SSE_HEADERS })
}
