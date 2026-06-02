'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { ProjectConfig } from '@/config/projects'
import { RotateCcw, Loader2, ChevronDown } from 'lucide-react'

interface Props {
  project: ProjectConfig
}

export function RestartButton({ project }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(project.containers[0])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  async function handleRestart() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/vps/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container: selected }),
      })
      const data = await res.json()
      setResult(res.ok ? { ok: true } : { error: data.error })
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
        onClick={() => { setResult(null); setOpen(true) }}
      >
        <RotateCcw className="w-3 h-3 mr-1.5" />Restart Container
      </Button>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setResult(null) }}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-zinc-400" />Restart — {project.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Chọn container để restart. Container sẽ dừng ~2-5s rồi khởi động lại.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full px-3 py-2 pr-8 text-sm bg-zinc-800 border border-zinc-700 rounded text-zinc-200 focus:outline-none appearance-none"
            >
              {project.containers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>

          {result?.ok && <p className="text-sm text-emerald-400 bg-emerald-950/30 px-3 py-2 rounded border border-emerald-800">✓ {selected} restarted</p>}
          {result?.error && <p className="text-sm text-red-400 bg-red-950/30 px-3 py-2 rounded border border-red-800">{result.error}</p>}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Đóng</Button>
            {!result?.ok && (
              <Button onClick={handleRestart} disabled={loading} className="bg-amber-700 hover:bg-amber-600 text-white">
                {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
                Restart
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
