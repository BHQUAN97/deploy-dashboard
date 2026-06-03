'use client'
import { PROJECTS } from '@/config/projects'
import { ProjectCard } from './ProjectCard'
import type { DomainHealth } from '@/lib/domain-health'
import type { RunInfo } from '@/lib/github'

interface Props {
  healthMap: Map<string, DomainHealth>
  statusMap: Map<string, { latestRun: RunInfo | null; isDeploying: boolean }>
  backupStatusMap: Map<string, RunInfo | null>
  loadingHealth: boolean
  deployingProject: string | null
  onDeployStart: (projectId: string, runId: number | null) => void
  backingUpProject?: string | null
  onBackupStart?: (projectId: string, runId: number | null) => void
  projects: typeof PROJECTS
  onShowcaseSaved?: (project: (typeof PROJECTS)[number]) => void
}

export function ProjectGrid({ projects, healthMap, statusMap, backupStatusMap, loadingHealth, deployingProject, onDeployStart, backingUpProject, onBackupStart, onShowcaseSaved }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map(project => {
        const status = statusMap.get(project.id)
        return (
          <ProjectCard
            key={project.id}
            project={project}
            health={healthMap.get(project.domain) ?? null}
            loadingHealth={loadingHealth}
            latestRun={status?.latestRun ?? null}
            isDeploying={deployingProject === project.id || (status?.isDeploying ?? false)}
            onDeployStart={runId => onDeployStart(project.id, runId)}
            isBackingUp={backingUpProject === project.id}
            onBackupStart={onBackupStart ? (runId) => onBackupStart(project.id, runId) : undefined}
            latestBackup={backupStatusMap.get(project.id) ?? null}
            onShowcaseSaved={onShowcaseSaved}
          />
        )
      })}
    </div>
  )
}
