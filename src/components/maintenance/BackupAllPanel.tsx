'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PROJECTS } from '@/config/projects'
import { HardDrive, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'

interface BackupResult {
  projectId: string
  name: string
  status: 'pending' | 'triggered' | 'error'
  runId: number | null
  url: string | null
  error?: string
}

export function BackupAllPanel() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<BackupResult[]>([])

  const backupProjects = PROJECTS.filter(p => p.backupWorkflow)

  async function handleBackupAll() {
    setRunning(true)
    const initial: BackupResult[] = backupProjects.map(p => ({
      projectId: p.id,
      name: p.name,
      status: 'pending',
      runId: null,
      url: null,
    }))
    setResults(initial)

    for (let i = 0; i < backupProjects.length; i++) {
      const project = backupProjects[i]
      try {
        const res = await fetch(`/api/backup/${project.repo}`, { method: 'POST' })
        const data = await res.json()
        setResults(prev => prev.map(r =>
          r.projectId === project.id
            ? { ...r, status: res.ok ? 'triggered' : 'error', runId: data.runId ?? null, url: data.url ?? null, error: res.ok ? undefined : data.error }
            : r
        ))
      } catch (e) {
        setResults(prev => prev.map(r =>
          r.projectId === project.id
            ? { ...r, status: 'error', error: e instanceof Error ? e.message : 'Network error' }
            : r
        ))
      }
      // 30s delay between triggers to avoid race condition on VPS
      if (i < backupProjects.length - 1) {
        await new Promise(r => setTimeout(r, 30000))
      }
    }

    setRunning(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">
            Trigger backup.yml cho {backupProjects.length} repos — tuần tự, cách nhau 30s.
            Kết quả push lên branch{' '}
            <code className="bg-zinc-800 px-1 py-0.5 rounded">backups</code> của mỗi repo.
          </p>
        </div>
        <Button
          size="sm"
          disabled={running}
          onClick={handleBackupAll}
          className="bg-emerald-700 hover:bg-emerald-600 text-white shrink-0"
        >
          {running
            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running...</>
            : <><HardDrive className="w-3.5 h-3.5 mr-1.5" />Backup All</>}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1.5">
          {results.map(r => (
            <div key={r.projectId} className="flex items-center justify-between py-2 px-3 rounded bg-zinc-800/50 border border-zinc-700/50">
              <div className="flex items-center gap-2 min-w-0">
                {r.status === 'pending' && <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin shrink-0" />}
                {r.status === 'triggered' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                {r.status === 'error' && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span className="text-xs text-zinc-200 truncate">{r.name}</span>
                {r.error && <span className="text-[10px] text-red-400 truncate">— {r.error}</span>}
              </div>
              {r.url && r.status === 'triggered' && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 shrink-0 ml-2">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
