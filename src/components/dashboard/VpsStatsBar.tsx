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

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        Không tải được VPS stats. Kiểm tra SSH env hoặc kết nối VPS.
      </div>
    )
  }
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:flex gap-2 md:gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-zinc-800 animate-pulse rounded-lg" />)}
      </div>
    )
  }

  const diskAlert = stats.disk.percent >= 80
  const memAlert = stats.memory.percent >= 80

  return (
    <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
      {/* Disk */}
      <div className="flex items-center gap-2">
        <HardDrive className={`w-3.5 h-3.5 shrink-0 ${diskAlert ? 'text-red-400' : 'text-zinc-500'}`} />
        <div>
          <div className="flex items-center gap-1">
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

      {/* Memory */}
      <div className="flex items-center gap-2">
        <MemoryStick className={`w-3.5 h-3.5 shrink-0 ${memAlert ? 'text-red-400' : 'text-zinc-500'}`} />
        <div>
          <div className="flex items-center gap-1">
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

      {/* Containers */}
      <div className="col-span-2 md:col-span-1 flex items-center gap-2 md:border-l md:border-zinc-800 md:pl-3">
        <Container className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <div>
          <span className="text-xs font-medium text-zinc-300">{stats.containers.length} containers</span>
          <p className="text-[10px] text-zinc-600 mt-0.5 truncate max-w-[200px] md:max-w-none">
            {stats.containers.slice(0, 4).join(', ')}{stats.containers.length > 4 ? ` +${stats.containers.length - 4}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
