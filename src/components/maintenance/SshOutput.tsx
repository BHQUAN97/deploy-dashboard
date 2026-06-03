'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface SseLogEvent {
  type: 'log' | 'done' | 'error'
  line?: string
  isStderr?: boolean
  exitCode?: number
  message?: string
  skipped?: boolean
  timestamp?: string
}

interface Props {
  streamUrl: string | null  // null = not started
  onDone?: (exitCode: number, skipped?: boolean) => void
}

export function SshOutput({ streamUrl, onDone }: Props) {
  const [lines, setLines] = useState<{ text: string; isStderr: boolean; ts: string }[]>([])
  const [status, setStatus] = useState<'idle' | 'connecting' | 'running' | 'done' | 'error'>('idle')
  const [exitCode, setExitCode] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setLines([])
      setStatus(streamUrl ? 'connecting' : 'idle')
      setExitCode(null)
    }, 0)
    if (!streamUrl) {
      return () => window.clearTimeout(resetTimer)
    }

    const es = new EventSource(streamUrl)
    es.onopen = () => setStatus('running')
    es.onmessage = (e) => {
      const ev: SseLogEvent = JSON.parse(e.data)
      if (ev.type === 'log' && ev.line !== undefined) {
        setLines(prev => [...prev, { text: ev.line!, isStderr: ev.isStderr ?? false, ts: ev.timestamp ?? '' }])
      }
      if (ev.type === 'done') {
        setStatus(ev.exitCode === 0 ? 'done' : 'error')
        setExitCode(ev.exitCode ?? 0)
        onDone?.(ev.exitCode ?? 0, ev.skipped)
        es.close()
      }
      if (ev.type === 'error') {
        setLines(prev => [...prev, { text: `ERROR: ${ev.message}`, isStderr: true, ts: '' }])
        setStatus('error')
        setExitCode(1)
        onDone?.(1)
        es.close()
      }
    }
    es.onerror = () => { setStatus('error'); es.close() }
    return () => {
      window.clearTimeout(resetTimer)
      es.close()
    }
  }, [streamUrl, onDone])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  if (status === 'idle') return null

  return (
    <div className="mt-3 rounded-lg border border-zinc-700 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        {status === 'connecting' || status === 'running'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          : status === 'done' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          : <XCircle className="w-3.5 h-3.5 text-red-400" />}
        <span className="text-xs text-zinc-300 font-mono">
          {status === 'connecting' ? 'Connecting to VPS...'
            : status === 'running' ? 'Running...'
            : status === 'done' ? `Done (exit: ${exitCode})`
            : `Error (exit: ${exitCode ?? 1})`}
        </span>
      </div>
      <div className="bg-zinc-950 p-3 max-h-64 overflow-y-auto font-mono text-xs">
        {lines.map((l, i) => (
          <div key={i} className={l.isStderr ? 'text-amber-400' : 'text-zinc-300'}>
            {l.text || <span className="text-zinc-700">&nbsp;</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
