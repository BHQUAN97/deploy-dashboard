'use client'
import { useEffect, useState } from 'react'
import type { VpsStats } from '@/app/api/vps/stats/route'
import { HardDrive, MemoryStick, Container, AlertTriangle } from 'lucide-react'

function StatBar({ percent, alert }: { percent: number; alert: boolean }) {
  const color = percent >= 85 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} ${alert ? 'animate-pulse' : ''}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  )
}

export function VpsStatsBar() {
  const [stats, setStats] = useState<VpsStats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/vps/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => d ? setStats(d) : setError(true))
      .catch(() => setError(true))
  }, [])

  if (error) return null
  if (!stats) {
    return (
      <div className="flex gap-4">
        {[1,2,3].map(i => <div key={i} className="h-8 w-32 bg-zinc-800 animate-pulse rounded-lg" />)}
      </div>
    )
  }

  const diskAlert = stats.disk.percent >= 80
  const memAlert = stats.memory.percent >= 80

  return (
    <div className="flex flex-wrap gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
      {/* Disk */}
      <div className="flex items-center gap-2">
        <HardDrive className={`w-3.5 h-3.5 shrink-0 ${diskAlert ? 'text-red-400' : 'text-zinc-500'}`} />
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${diskAlert ? 'text-red-400' : 'text-zinc-300'}`}>
              Disk {stats.disk.percent}%
            </span>
            {diskAlert && <AlertTriangle className="w-3 h-3 text-red-400" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <StatBar percent={stats.disk.percent} alert={diskAlert} />
            <span className="text-[10px] text-zinc-600">{stats.disk.used}/{stats.disk.total}</span>
          </div>
        </div>
      </div>

      <div className="w-px bg-zinc-800 self-stretch" />

      {/* Memory */}
      <div className="flex items-center gap-2">
        <MemoryStick className={`w-3.5 h-3.5 shrink-0 ${memAlert ? 'text-red-400' : 'text-zinc-500'}`} />
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${memAlert ? 'text-red-400' : 'text-zinc-300'}`}>
              RAM {stats.memory.percent}%
            </span>
            {memAlert && <AlertTriangle className="w-3 h-3 text-red-400" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <StatBar percent={stats.memory.percent} alert={memAlert} />
            <span className="text-[10px] text-zinc-600">{stats.memory.usedMb}/{stats.memory.totalMb}MB</span>
          </div>
        </div>
      </div>

      <div className="w-px bg-zinc-800 self-stretch" />

      {/* Containers */}
      <div className="flex items-center gap-2">
        <Container className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <div>
          <span className="text-xs font-medium text-zinc-300">{stats.containers.length} containers</span>
          <p className="text-[10px] text-zinc-600 mt-0.5 max-w-[200px] truncate">
            {stats.containers.slice(0, 4).join(', ')}{stats.containers.length > 4 ? ` +${stats.containers.length - 4}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
