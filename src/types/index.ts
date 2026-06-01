import type { RunInfo } from '@/lib/github'

export interface ProjectStatus {
  projectId: string
  repo: string
  domain: string
  activeRun: RunInfo | null
  latestRun: RunInfo | null
  isDeploying: boolean
}

export interface SseEvent {
  type: 'run' | 'step' | 'job' | 'done' | 'error' | 'log'
  [key: string]: unknown
}
