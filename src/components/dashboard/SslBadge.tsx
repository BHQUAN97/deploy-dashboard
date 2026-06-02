import type { DomainHealth } from '@/lib/domain-health'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldAlert, ShieldX } from 'lucide-react'

interface Props {
  health: DomainHealth | null
  loading?: boolean
}

export function SslBadge({ health, loading }: Props) {
  if (loading || !health) {
    return <div className="h-5 w-20 bg-zinc-700 animate-pulse rounded-full" />
  }
  const ssl = health.ssl
  if (!ssl) {
    return (
      <Badge className="gap-1 text-xs border-0 bg-zinc-800 text-zinc-400 hover:bg-zinc-800">
        <ShieldAlert className="w-3 h-3" />No SSL
      </Badge>
    )
  }
  if (!ssl.valid || ssl.daysRemaining <= 0) {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <ShieldX className="w-3 h-3" />Expired
      </Badge>
    )
  }
  const isError = ssl.daysRemaining < 30
  const isWarning = ssl.daysRemaining < 60
  const colorClass = isError
    ? 'bg-red-950 text-red-400 hover:bg-red-950 border border-red-800'
    : isWarning
    ? 'bg-amber-950 text-amber-400 hover:bg-amber-950 border border-amber-800'
    : 'bg-emerald-900 text-emerald-300 hover:bg-emerald-900 border-0'
  return (
    <Badge className={`gap-1 text-xs ${colorClass}`}>
      {isError ? <ShieldAlert className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
      {ssl.daysRemaining}d
    </Badge>
  )
}
