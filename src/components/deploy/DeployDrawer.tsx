'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { ProjectConfig } from '@/config/projects'
import type { JobInfo } from '@/lib/github'
import { JobSteps } from './JobSteps'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Props {
  project: ProjectConfig | null
  runId: number | null
  open: boolean
  onClose: () => void
}

export function DeployDrawer({ project, runId, open, onClose }: Props) {
  const [jobs, setJobs] = useState<JobInfo[]>([])
  const [done, setDone] = useState(false)
  const [conclusion, setConclusion] = useState<string | null>(null)
  const [runUrl, setRunUrl] = useState('')
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!open || !runId || !project) return
    setJobs([]); setDone(false); setConclusion(null); setRunUrl('')

    const es = new EventSource(`/api/runs/${runId}/stream?repo=${project.repo}`)
    esRef.current = es

    es.onmessage = (e) => {
      const ev = JSON.parse(e.data)

      if (ev.type === 'step') {
        setJobs(prev => {
          const idx = prev.findIndex(j => j.id === ev.jobId)
          const step = { number: ev.stepNumber, name: ev.stepName, status: ev.status, conclusion: ev.conclusion, startedAt: ev.startedAt, completedAt: ev.completedAt }
          if (idx === -1) {
            return [...prev, { id: ev.jobId, name: ev.jobName, status: 'in_progress', conclusion: null, startedAt: null, completedAt: null, steps: [step] }]
          }
          const updated = prev.map((j, i) => {
            if (i !== idx) return j
            const si = j.steps.findIndex(s => s.number === ev.stepNumber)
            return { ...j, steps: si === -1 ? [...j.steps, step] : j.steps.map((s, si2) => si2 === si ? step : s) }
          })
          return updated
        })
      }

      if (ev.type === 'job') {
        setJobs(prev => prev.map(j => j.id === ev.jobId
          ? { ...j, status: ev.status, conclusion: ev.conclusion, completedAt: ev.completedAt }
          : j
        ))
      }

      if (ev.type === 'done') {
        setDone(true); setConclusion(ev.conclusion); setRunUrl(ev.url ?? '')
        es.close()
      }
    }

    es.onerror = () => es.close()
    return () => es.close()
  }, [open, runId, project])

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="bg-zinc-900 border-zinc-700 text-zinc-100 w-[480px] sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-800">
          <SheetTitle className="flex items-center gap-2 text-zinc-100">
            {project?.icon} Deploy {project?.name}
          </SheetTitle>
          <div className="flex items-center gap-2 mt-2">
            {!done && runId && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                Deploying... Run #{runId}
              </div>
            )}
            {done && conclusion === 'success' && (
              <Badge className="bg-emerald-900 text-emerald-300 border-0 gap-1">
                <CheckCircle2 className="w-3 h-3" />Success
              </Badge>
            )}
            {done && conclusion !== 'success' && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="w-3 h-3" />{conclusion ?? 'Failed'}
              </Badge>
            )}
            {done && runUrl && (
              <a href={runUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-zinc-400 h-7 px-2 text-xs hover:text-zinc-200">
                  <ExternalLink className="w-3 h-3 mr-1" />GitHub
                </Button>
              </a>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {jobs.length === 0 && !done && (
            <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />Waiting for jobs...
            </div>
          )}
          <JobSteps jobs={jobs} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
