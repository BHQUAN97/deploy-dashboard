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
  const isWarning = ssl.daysRemaining < 14
  return (
    <Badge className={`gap-1 text-xs border-0 ${isWarning ? 'bg-amber-900 text-amber-300 hover:bg-amber-900' : 'bg-emerald-900 text-emerald-300 hover:bg-emerald-900'}`}>
      <Shield className="w-3 h-3" />
      {ssl.isLetsEncrypt ? 'LE' : '⚠'} · {ssl.daysRemaining}d
    </Badge>
  )
}
