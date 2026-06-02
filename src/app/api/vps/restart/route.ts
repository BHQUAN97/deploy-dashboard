import { NextRequest, NextResponse } from 'next/server'
import { runSshCommand } from '@/lib/ssh-client'
import { PROJECTS } from '@/config/projects'

export const dynamic = 'force-dynamic'

// Tập hợp tất cả container hợp lệ từ config
const VALID_CONTAINERS = new Set(PROJECTS.flatMap(p => p.containers))

export async function POST(req: NextRequest) {
  const { container } = await req.json() as { container: string }
  if (!container || !VALID_CONTAINERS.has(container)) {
    return NextResponse.json({ error: 'Invalid container' }, { status: 400 })
  }

  try {
    const { stdout, exitCode } = await runSshCommand(`docker restart ${container} && echo restarted`, 30000)
    if (exitCode !== 0) {
      return NextResponse.json({ error: 'Restart failed', detail: stdout }, { status: 500 })
    }
    return NextResponse.json({ ok: true, container })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'SSH error' }, { status: 500 })
  }
}
