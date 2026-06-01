'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { ProjectConfig } from '@/config/projects'
import { Rocket, Loader2 } from 'lucide-react'

interface Props {
  project: ProjectConfig
  isDeploying: boolean
  onDeployStart: (runId: number | null) => void
}

export function DeployButton({ project, isDeploying, onDeployStart }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setTriggering(true)
    setError(null)
    try {
      const res = await fetch(`/api/deploy/${project.repo}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Deploy failed'); return }
      setShowConfirm(false)
      onDeployStart(data.runId)
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
        className="w-full text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
        disabled={isDeploying}
        onClick={() => { setError(null); setShowConfirm(true) }}
      >
        {isDeploying
          ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Deploying...</>
          : <><Rocket className="w-3 h-3 mr-1.5" />Deploy</>}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{project.icon} Deploy {project.name}?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Trigger GitHub Actions trên branch{' '}
              <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">{project.branch}</code>.
              Mất 3-10 phút.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-400 bg-red-950/30 px-3 py-2 rounded border border-red-800">{error}</p>}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowConfirm(false)} className="text-zinc-400 hover:text-zinc-200">Hủy</Button>
            <Button onClick={handleConfirm} disabled={triggering} className="bg-blue-600 hover:bg-blue-500 text-white">
              {triggering ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5 mr-1.5" />}
              Confirm Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
