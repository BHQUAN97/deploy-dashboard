import type { DomainHealth } from '@/lib/domain-health'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react'

interface Props {
  health: DomainHealth | null
  loading?: boolean
}

export function StatusBadge({ health, loading }: Props) {
  if (loading || !health) {
    return <div className="h-5 w-16 bg-zinc-700 animate-pulse rounded-full" />
  }
  if (!health.reachable || !health.httpStatus) {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <WifiOff className="w-3 h-3" />Unreachable
      </Badge>
    )
  }
  const ok = health.httpStatus < 400
  return (
    <Badge className={`gap-1 text-xs border-0 ${ok ? 'bg-emerald-900 text-emerald-300 hover:bg-emerald-900' : 'bg-red-900 text-red-300 hover:bg-red-900'}`}>
      {ok ? <Wifi className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {health.httpStatus} · {health.responseTimeMs}ms
    </Badge>
  )
}
