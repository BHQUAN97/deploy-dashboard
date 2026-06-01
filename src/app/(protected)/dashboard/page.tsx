'use client'
import { useState, useEffect, useCallback } from 'react'
import { ProjectGrid } from '@/components/dashboard/ProjectGrid'
import { DeployDrawer } from '@/components/deploy/DeployDrawer'
import type { DomainHealth } from '@/lib/domain-health'
import type { RunInfo } from '@/lib/github'
import { PROJECTS, getProjectById } from '@/config/projects'
import type { ProjectStatus } from '@/types'

export default function DashboardPage() {
  const [healthMap, setHealthMap] = useState<Map<string, DomainHealth>>(new Map())
  const [statusMap, setStatusMap] = useState<Map<string, { latestRun: RunInfo | null; isDeploying: boolean }>>(new Map())
  const [loadingHealth, setLoadingHealth] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeRunId, setActiveRunId] = useState<number | null>(null)

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true)
    try {
      const res = await fetch('/api/domains/health')
      const data: DomainHealth[] = await res.json()
      setHealthMap(new Map(data.map(d => [d.domain, d])))
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

  useEffect(() => {
    loadHealth()
    loadStatus()
    const interval = setInterval(loadStatus, 30000)
    return () => clearInterval(interval)
  }, [loadHealth, loadStatus])

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
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Projects Overview</h2>
        <p className="text-sm text-zinc-500 mt-0.5">{PROJECTS.length} projects · VPS 159.223.77.247</p>
      </div>

      <ProjectGrid
        healthMap={healthMap}
        statusMap={statusMap}
        loadingHealth={loadingHealth}
        deployingProject={activeProjectId && drawerOpen ? activeProjectId : null}
        onDeployStart={handleDeployStart}
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
