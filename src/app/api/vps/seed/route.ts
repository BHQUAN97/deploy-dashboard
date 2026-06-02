import { NextRequest } from 'next/server'
import { createSshStream, SSE_HEADERS } from '@/lib/ssh-client'
import { getProjectById } from '@/config/projects'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { projectId, scriptId } = await req.json() as { projectId: string; scriptId: string }

  const project = getProjectById(projectId)
  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 })
  }

  // Validate script là trong danh sách cho phép (chống command injection)
  const validScript = project.seedScripts.find(s => s.id === scriptId)
  if (!validScript) {
    return new Response(JSON.stringify({ error: 'Script not allowed' }), { status: 400 })
  }

  const container = project.containerForSeed
  if (!container) {
    return new Response(JSON.stringify({ error: 'No seed container configured' }), { status: 400 })
  }

  // Chỉ chạy script đã được whitelist — không nhận command tự do
  const innerCmd = validScript.command ?? `node dist/scripts/${scriptId}.js`
  const cmd = `docker exec ${container} ${innerCmd} 2>&1`
  return new Response(createSshStream(cmd, 120000), { headers: SSE_HEADERS })
}
