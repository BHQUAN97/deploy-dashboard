'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { ProjectConfig } from '@/config/projects'
import { HardDrive, Loader2 } from 'lucide-react'

interface Props {
  project: ProjectConfig
  isRunning: boolean
  onBackupStart: (runId: number | null) => void
}

export function BackupButton({ project, isRunning, onBackupStart }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setTriggering(true)
    setError(null)
    try {
      const res = await fetch(`/api/backup/${project.repo}`, { method: 'POST' })
      const data = await readJson(res)
      if (!res.ok) { setError(data.error ?? `Backup failed (${res.status})`); return }
      setShowConfirm(false)
      onBackupStart(data.runId ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
        disabled={isRunning}
        onClick={() => { setError(null); setShowConfirm(true) }}
      >
        {isRunning
          ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Backing up...</>
          : <><HardDrive className="w-3 h-3 mr-1.5" />Backup DB</>}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-zinc-400" />
              Backup {project.name}?
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Trigger{' '}
              <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">backup.yml</code>{' '}
              — dump DB{' '}
              <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">{project.backupDatabase}</code>,
              encrypt GPG AES-256 và push lên branch{' '}
              <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">backups</code>.
              Mất 2-5 phút.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-400 bg-red-950/30 px-3 py-2 rounded border border-red-800">{error}</p>}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowConfirm(false)} className="text-zinc-400 hover:text-zinc-200">Hủy</Button>
            <Button onClick={handleConfirm} disabled={triggering} className="bg-emerald-700 hover:bg-emerald-600 text-white">
              {triggering ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5 mr-1.5" />}
              Confirm Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

async function readJson(res: Response): Promise<{ runId?: number | null; error?: string }> {
  try {
    return await res.json()
  } catch {
    return { error: await res.text().catch(() => '') }
  }
}
