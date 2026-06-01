import type { StepInfo } from '@/lib/github'
import { CheckCircle2, XCircle, Loader2, Circle, Clock, SkipForward } from 'lucide-react'

interface Props { step: StepInfo }

function dur(start: string | null, end: string | null) {
  if (!start) return ''
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime()
  const s = Math.floor(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`
}

export function StepRow({ step }: Props) {
  const icon =
    step.status === 'completed'
      ? step.conclusion === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      : step.conclusion === 'skipped' ? <SkipForward className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
      : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
    : step.status === 'in_progress' ? <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
    : <Circle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

  const textColor =
    step.status === 'in_progress' ? 'text-blue-300'
    : step.conclusion === 'failure' ? 'text-red-300'
    : step.conclusion === 'skipped' ? 'text-zinc-600'
    : step.status === 'completed' ? 'text-zinc-300'
    : 'text-zinc-600'

  return (
    <div className="flex items-center gap-2 py-1.5 px-3">
      {icon}
      <span className={`text-xs flex-1 truncate ${textColor}`}>{step.name}</span>
      {step.startedAt && (
        <span className="text-[10px] text-zinc-600 flex items-center gap-0.5 shrink-0">
          <Clock className="w-2.5 h-2.5" />{dur(step.startedAt, step.completedAt)}
        </span>
      )}
    </div>
  )
}
