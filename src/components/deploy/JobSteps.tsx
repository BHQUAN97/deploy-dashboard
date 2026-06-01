'use client'
import type { JobInfo } from '@/lib/github'
import { StepRow } from './StepRow'
import { CheckCircle2, XCircle, Loader2, Circle, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Props { jobs: JobInfo[] }

function JobIcon({ job }: { job: JobInfo }) {
  if (job.status === 'in_progress') return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
  if (job.status === 'completed') {
    return job.conclusion === 'success'
      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      : <XCircle className="w-4 h-4 text-red-400" />
  }
  return <Circle className="w-4 h-4 text-zinc-600" />
}

export function JobSteps({ jobs }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set(jobs.map(j => j.id)))

  const toggle = (id: number) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="space-y-2">
      {jobs.map(job => (
        <div key={job.id} className="bg-zinc-800 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left hover:bg-zinc-750 transition-colors"
            onClick={() => toggle(job.id)}
          >
            <JobIcon job={job} />
            <span className="flex-1 text-zinc-200 truncate">{job.name}</span>
            {expanded.has(job.id) ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
          {expanded.has(job.id) && job.steps.length > 0 && (
            <div className="border-t border-zinc-700 divide-y divide-zinc-700/50">
              {job.steps.map(step => <StepRow key={step.number} step={step} />)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
