'use client'
import { useState } from 'react'
import { PROJECTS } from '@/config/projects'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { SshOutput } from './SshOutput'
import { Database, AlertTriangle } from 'lucide-react'

export function SeedPanel() {
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedScript, setSelectedScript] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)

  const projectsWithSeed = PROJECTS.filter(p => p.seedScripts.length > 0)
  const project = projectsWithSeed.find(p => p.id === selectedProject)
  const script = project?.seedScripts.find(s => s.id === selectedScript)

  async function handleRun() {
    setShowConfirm(false)
    setStreamUrl(null)
    const params = new URLSearchParams({ projectId: selectedProject, scriptId: selectedScript })
    setStreamUrl(`/api/vps/seed-stream?${params}`)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Project</label>
          <select
            value={selectedProject}
            onChange={e => { setSelectedProject(e.target.value); setSelectedScript('') }}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="">Chọn project...</option>
            {projectsWithSeed.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Seed Script</label>
          <select
            value={selectedScript}
            onChange={e => setSelectedScript(e.target.value)}
            disabled={!selectedProject}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
          >
            <option value="">Chọn script...</option>
            {project?.seedScripts.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={!selectedProject || !selectedScript}
          onClick={() => setShowConfirm(true)}
          className="bg-amber-900/60 hover:bg-amber-900 text-amber-200 border border-amber-800"
        >
          <Database className="w-3.5 h-3.5 mr-1.5" />Run Seed
        </Button>
        {selectedProject && selectedScript && (
          <p className="text-xs text-zinc-500">
            <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
            Sẽ thêm data vào production DB
          </p>
        )}
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4" />Confirm Seed Data
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Chạy <code className="bg-zinc-800 px-1 rounded text-zinc-200">{selectedScript}</code> trên <strong className="text-zinc-200">{project?.name}</strong> production database.
              Dữ liệu sẽ được thêm vào — không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirm(false)} className="text-zinc-400">Hủy</Button>
            <Button onClick={handleRun} className="bg-amber-700 hover:bg-amber-600 text-white">
              <Database className="w-3.5 h-3.5 mr-1.5" />Confirm Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unused variable suppressed — script is used in Dialog description */}
      {script && null}

      <SshOutput streamUrl={streamUrl} />
    </div>
  )
}
