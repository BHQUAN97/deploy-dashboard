'use client'
import type { ProjectConfig } from '@/config/projects'
import type { DomainHealth } from '@/lib/domain-health'
import type { RunInfo } from '@/lib/github'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { SslBadge } from './SslBadge'
import { DeployButton } from './DeployButton'
import { BackupButton } from './BackupButton'
import { ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  project: ProjectConfig
  health: DomainHealth | null
  loadingHealth: boolean
  latestRun: RunInfo | null
  isDeploying: boolean
  onDeployStart: (runId: number | null) => void
  isBackingUp?: boolean
  onBackupStart?: (runId: number | null) => void
}

export function ProjectCard({ project, health, loadingHealth, latestRun, isDeploying, onDeployStart, isBackingUp = false, onBackupStart }: Props) {
  const isError = health && (!health.reachable || (health.httpStatus ?? 0) >= 400)
  const isOk = health?.reachable && health.httpStatus && health.httpStatus < 400
  const border = isDeploying
    ? 'border-blue-500/50 shadow-lg shadow-blue-900/20'
    : isError ? 'border-red-800/50'
    : isOk ? 'border-emerald-800/30'
    : 'border-zinc-800'

  return (
    <Card className={`bg-zinc-900 border ${border} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{project.icon}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-white truncate">{project.name}</h3>
              <a
                href={`https://${project.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {project.domain}<ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: project.color }} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-xs text-zinc-500 line-clamp-2">{project.description}</p>

        <div className="flex flex-wrap gap-1.5">
          <StatusBadge health={health} loading={loadingHealth} />
          <SslBadge health={health} loading={loadingHealth} />
        </div>

        <div className="flex flex-wrap gap-1">
          {project.stack.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{s}</span>
          ))}
          {project.stack.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded">+{project.stack.length - 3}</span>
          )}
        </div>

        {latestRun && (
          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
            <Clock className="w-3 h-3" />
            {latestRun.conclusion === 'success'
              ? <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              : latestRun.conclusion === 'failure'
              ? <XCircle className="w-3 h-3 text-red-600" />
              : null}
            <span>{new Date(latestRun.updatedAt).toLocaleDateString('vi-VN')}</span>
          </div>
        )}

        <DeployButton project={project} isDeploying={isDeploying} onDeployStart={onDeployStart} />
        {project.backupWorkflow && onBackupStart && (
          <BackupButton project={project} isRunning={isBackingUp} onBackupStart={onBackupStart} />
        )}
      </CardContent>
    </Card>
  )
}
