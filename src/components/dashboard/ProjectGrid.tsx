'use client'
import { PROJECTS } from '@/config/projects'
import { ProjectCard } from './ProjectCard'
import type { DomainHealth } from '@/lib/domain-health'
import type { RunInfo } from '@/lib/github'

interface Props {
  healthMap: Map<string, DomainHealth>
  statusMap: Map<string, { latestRun: RunInfo | null; isDeploying: boolean }>
  loadingHealth: boolean
  deployingProject: string | null
  onDeployStart: (projectId: string, runId: number | null) => void
}

export function ProjectGrid({ healthMap, statusMap, loadingHealth, deployingProject, onDeployStart }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {PROJECTS.map(project => {
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
          />
        )
      })}
    </div>
  )
}
