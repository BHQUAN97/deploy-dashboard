import { NextResponse } from 'next/server'
import { runSshCommand } from '@/lib/ssh-client'

export const dynamic = 'force-dynamic'

export interface VpsStats {
  disk: { total: string; used: string; available: string; percent: number }
  memory: { totalMb: number; usedMb: number; percent: number }
  containers: string[]
  checkedAt: string
}

export async function GET() {
  try {
    const cmd = [
      "df -h / | awk 'NR==2{print $2\"|\"$3\"|\"$4\"|\"$5}'",
      "free -m | awk 'NR==2{print $2\"|\"$3}'",
      "docker ps --format '{{.Names}}' | sort",
    ].join(' && echo "---SEP---" && ')

    const { stdout } = await runSshCommand(cmd, 15000)
    const [diskLine, memLine, containersRaw] = stdout.split('---SEP---').map(s => s.trim())

    const [total, used, available, percentStr] = (diskLine ?? '').split('|')
    const [memTotal, memUsed] = (memLine ?? '').split('|').map(Number)
    const containers = (containersRaw ?? '').split('\n').filter(Boolean)

    const stats: VpsStats = {
      disk: {
        total: total ?? '?',
        used: used ?? '?',
        available: available ?? '?',
        percent: parseInt(percentStr ?? '0'),
      },
      memory: {
        totalMb: memTotal ?? 0,
        usedMb: memUsed ?? 0,
        percent: memTotal ? Math.round((memUsed / memTotal) * 100) : 0,
      },
      containers,
      checkedAt: new Date().toISOString(),
    }

    return NextResponse.json(stats)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'SSH error' }, { status: 500 })
  }
}
