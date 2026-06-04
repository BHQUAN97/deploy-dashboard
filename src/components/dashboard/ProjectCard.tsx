'use client'
import { useState, useEffect } from 'react'
import type { ProjectConfig } from '@/config/projects'
import type { DomainHealth } from '@/lib/domain-health'
import type { RunInfo } from '@/lib/github'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { SslBadge } from './SslBadge'
import { DeployButton } from './DeployButton'
import { BackupButton } from './BackupButton'
import { RestartButton } from './RestartButton'
import { ShowcaseEditDialog } from './ShowcaseEditDialog'
import { ExternalLink, CheckCircle2, XCircle, HardDrive, Pencil, Clock, FileText } from 'lucide-react'

interface Props {
  project: ProjectConfig
  health: DomainHealth | null
  loadingHealth: boolean
  latestRun: RunInfo | null
  isDeploying: boolean
  onDeployStart: (runId: number | null) => void
  isBackingUp?: boolean
  onBackupStart?: (runId: number | null) => void
  latestBackup?: RunInfo | null
  onShowcaseSaved?: (project: ProjectConfig) => void
}

function RunDot({ run }: { run: RunInfo }) {
  const color = run.conclusion === 'success' ? 'bg-emerald-500'
    : run.conclusion === 'failure' ? 'bg-red-500'
    : run.status === 'in_progress' ? 'bg-blue-400 animate-pulse'
    : 'bg-zinc-600'
  const title = `${new Date(run.createdAt).toLocaleDateString('vi-VN')} · ${run.conclusion ?? run.status}`
  return <div className={`w-2 h-2 rounded-full ${color} shrink-0`} title={title} />
}

export function ProjectCard({ project, health, loadingHealth, latestRun, isDeploying, onDeployStart, isBackingUp = false, onBackupStart, latestBackup, onShowcaseSaved }: Props) {
  const [history, setHistory] = useState<RunInfo[]>([])
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [showcaseOpen, setShowcaseOpen] = useState(false)

  // Load notes từ localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem(`note-${project.id}`)
      if (saved) { setNotes(saved); setNotesOpen(true) }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [project.id])

  // Load deploy history (3 runs)
  useEffect(() => {
    fetch(`/api/deploy/${project.repo}/history?limit=3`)
      .then(r => r.ok ? r.json() : [])
      .then(setHistory)
      .catch(() => {})
  }, [project.repo])

  function saveNote(val: string) {
    setNotes(val)
    if (val.trim()) {
      localStorage.setItem(`note-${project.id}`, val)
    } else {
      localStorage.removeItem(`note-${project.id}`)
    }
  }

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
          <div className="flex items-center gap-2 shrink-0">
            {/* Deploy history dots */}
            {history.length > 0 && (
              <a
                href={`https://github.com/BHQUAN97/${project.repo}/actions`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 group"
                title="Deploy history"
              >
                {history.map((run, i) => <RunDot key={i} run={run} />)}
              </a>
            )}
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
          </div>
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

        {/* Last deploy + backup row */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-600">
          {latestRun && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {latestRun.conclusion === 'success'
                ? <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                : latestRun.conclusion === 'failure'
                ? <XCircle className="w-3 h-3 text-red-600" />
                : null}
              <span>{new Date(latestRun.updatedAt).toLocaleDateString('vi-VN')}</span>
            </div>
          )}
          {latestBackup && (
            <div className="flex items-center gap-1 ml-auto">
              <HardDrive className="w-3 h-3" />
              {latestBackup.conclusion === 'success'
                ? <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                : latestBackup.conclusion === 'failure'
                ? <XCircle className="w-3 h-3 text-red-600" />
                : null}
              <span>{new Date(latestBackup.updatedAt).toLocaleDateString('vi-VN')}</span>
            </div>
          )}
        </div>

        <DeployButton project={project} isDeploying={isDeploying} onDeployStart={onDeployStart} />
        {project.backupWorkflow && onBackupStart && (
          <BackupButton project={project} isRunning={isBackingUp} onBackupStart={onBackupStart} />
        )}
        {project.containers.length > 0 && <RestartButton project={project} />}
        <button
          onClick={() => setShowcaseOpen(true)}
          className="w-full h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          Sửa giới thiệu
        </button>

        {/* Notes */}
        <div>
          <button
            onClick={() => setNotesOpen(v => !v)}
            className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors w-full"
          >
            <Pencil className="w-3 h-3" />
            {notes.trim() ? <span className="truncate text-left">{notes.split('\n')[0]}</span> : <span>Add note...</span>}
          </button>
          {notesOpen && (
            <textarea
              value={notes}
              onChange={e => saveNote(e.target.value)}
              placeholder="Ghi chú: KH đang test, cần fix X, production OK..."
              rows={3}
              className="mt-1.5 w-full text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
            />
          )}
        </div>
      </CardContent>
      <ShowcaseEditDialog
        project={project}
        open={showcaseOpen}
        onOpenChange={setShowcaseOpen}
        onSaved={saved => onShowcaseSaved?.({ ...project, ...saved })}
      />
    </Card>
  )
}
