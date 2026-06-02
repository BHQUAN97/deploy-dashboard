'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ProjectGrid } from '@/components/dashboard/ProjectGrid'
import { DeployDrawer } from '@/components/deploy/DeployDrawer'
import { VpsStatsBar } from '@/components/dashboard/VpsStatsBar'
import type { DomainHealth } from '@/lib/domain-health'
import type { RunInfo } from '@/lib/github'
import { PROJECTS, getProjectById } from '@/config/projects'
import type { ProjectStatus } from '@/types'

export default function DashboardPage() {
  const [healthMap, setHealthMap] = useState<Map<string, DomainHealth>>(new Map())
  const [statusMap, setStatusMap] = useState<Map<string, { latestRun: RunInfo | null; isDeploying: boolean }>>(new Map())
  const [backupStatusMap, setBackupStatusMap] = useState<Map<string, RunInfo | null>>(new Map())
  const [loadingHealth, setLoadingHealth] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeRunId, setActiveRunId] = useState<number | null>(null)
  const [backingUpProject, setBackingUpProject] = useState<string | null>(null)
  const lastHealthFetch = useRef(0)

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true)
    try {
      const res = await fetch('/api/domains/health')
      const data: DomainHealth[] = await res.json()
      setHealthMap(new Map(data.map(d => [d.domain, d])))
      lastHealthFetch.current = Date.now()
    } finally {
      setLoadingHealth(false)
    }
  }, [])

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status')
      const data: ProjectStatus[] = await res.json()
      setStatusMap(new Map(data.map(s => [s.projectId, { latestRun: s.latestRun, isDeploying: s.isDeploying }])))
    } catch {}
  }, [])

  const loadBackupStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/backup/status')
      const data: { projectId: string; run: RunInfo | null }[] = await res.json()
      setBackupStatusMap(new Map(data.map(d => [d.projectId, d.run])))
    } catch {}
  }, [])

  // Auto-refresh health khi tab được focus lại sau >5 phút
  useEffect(() => {
    const handler = () => {
      if (!document.hidden && Date.now() - lastHealthFetch.current > 5 * 60 * 1000) {
        loadHealth()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [loadHealth])

  useEffect(() => {
    loadHealth()
    loadStatus()
    loadBackupStatus()
    const interval = setInterval(loadStatus, 30000)
    return () => clearInterval(interval)
  }, [loadHealth, loadStatus, loadBackupStatus])

  function handleDeployStart(projectId: string, runId: number | null) {
    setActiveProjectId(projectId)
    setActiveRunId(runId)
    setDrawerOpen(true)
    setStatusMap(prev => {
      const next = new Map(prev)
      next.set(projectId, { latestRun: next.get(projectId)?.latestRun ?? null, isDeploying: true })
      return next
    })
  }

  function handleBackupStart(projectId: string, runId: number | null) {
    setBackingUpProject(projectId)
    setActiveProjectId(projectId)
    setActiveRunId(runId)
    setDrawerOpen(true)
  }

  function handleDrawerClose() {
    setDrawerOpen(false)
    setTimeout(loadStatus, 5000)
    setTimeout(loadHealth, 35000)
    if (activeProjectId) {
      setStatusMap(prev => {
        const next = new Map(prev)
        next.set(activeProjectId, { latestRun: next.get(activeProjectId)?.latestRun ?? null, isDeploying: false })
        return next
      })
    }
    setBackingUpProject(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Projects Overview</h2>
        <p className="text-sm text-zinc-500 mt-0.5">{PROJECTS.length} projects · VPS 159.223.77.247</p>
      </div>

      <VpsStatsBar />

      <ProjectGrid
        healthMap={healthMap}
        statusMap={statusMap}
        backupStatusMap={backupStatusMap}
        loadingHealth={loadingHealth}
        deployingProject={activeProjectId && drawerOpen && !backingUpProject ? activeProjectId : null}
        onDeployStart={handleDeployStart}
        backingUpProject={backingUpProject && drawerOpen ? backingUpProject : null}
        onBackupStart={handleBackupStart}
      />

      <DeployDrawer
        project={activeProjectId ? (getProjectById(activeProjectId) ?? null) : null}
        runId={activeRunId}
        open={drawerOpen}
        onClose={handleDrawerClose}
      />
    </div>
  )
}
