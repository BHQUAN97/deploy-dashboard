'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { PROJECTS } from '@/config/projects'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Square, RefreshCw, Trash2, Download } from 'lucide-react'

type LogLine = { text: string; isStderr: boolean; ts: string }
type Source = 'docker' | 'file'
type Lines = 50 | 100 | 200 | 500

function colorize(line: string): string {
  const l = line.toLowerCase()
  if (l.includes('error') || l.includes('exception') || l.includes('fatal') || l.includes('err ')) return 'text-red-400'
  if (l.includes('warn')) return 'text-yellow-400'
  if (l.includes('debug') || l.includes('verbose')) return 'text-zinc-500'
  return 'text-zinc-300'
}

export function LogsViewer() {
  const [projectId, setProjectId] = useState(PROJECTS[0].id)
  const [container, setContainer] = useState(PROJECTS[0].logContainers[0])
  const [source, setSource] = useState<Source>('docker')
  const [lines, setLines] = useState<Lines>(200)
  const [filter, setFilter] = useState('')
  const [logs, setLogs] = useState<LogLine[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [status, setStatus] = useState<string>('')
  const esRef = useRef<EventSource | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  const project = PROJECTS.find(p => p.id === projectId)!

  // Reset container khi đổi project
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setContainer(project.logContainers[0])
      setLogs([])
      setStatus('')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [projectId, project.logContainers])

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const stopStream = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
    setStreaming(false)
  }, [])

  async function fetchLogs() {
    stopStream()
    setLoading(true)
    setLogs([])
    setStatus('Fetching...')
    try {
      const res = await fetch(`/api/logs/${projectId}?container=${container}&source=${source}&lines=${lines}`)
      const data = await res.json()
      if (!res.ok) { setStatus(`Error: ${data.error}`); return }
      setLogs(data.lines.map((text: string) => ({ text, isStderr: false, ts: '' })))
      setStatus(`${data.count} lines · ${container} · ${source}`)
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'failed'}`)
    } finally {
      setLoading(false)
    }
  }

  function startStream() {
    stopStream()
    setLogs([])
    setStatus('Connecting...')
    setStreaming(true)
    autoScrollRef.current = true

    const url = `/api/logs/${projectId}/stream?container=${container}&source=${source}&tail=50`
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type === 'log') {
          setLogs(prev => [...prev.slice(-1000), { text: event.line, isStderr: event.isStderr, ts: event.timestamp }])
          setStatus(`Live · ${container}`)
        } else if (event.type === 'done' || event.type === 'error') {
          setStatus(event.type === 'error' ? `Error: ${event.message}` : `Done (exit ${event.exitCode})`)
          stopStream()
        }
      } catch {}
    }

    es.onerror = () => {
      setStatus('Connection lost')
      stopStream()
    }
  }

  function clearLogs() { setLogs([]); setStatus('') }

  function downloadLogs() {
    const text = logs.map(l => l.text).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectId}-${container}-${new Date().toISOString().slice(0, 10)}.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = filter
    ? logs.filter(l => l.text.toLowerCase().includes(filter.toLowerCase()))
    : logs

  const errorCount = logs.filter(l => /error|exception|fatal/i.test(l.text)).length
  const warnCount = logs.filter(l => /warn/i.test(l.text)).length

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Project */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Project</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="h-8 px-2 text-sm bg-zinc-800 border border-zinc-700 rounded text-zinc-200 focus:outline-none"
          >
            {PROJECTS.map(p => (
              <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
            ))}
          </select>
        </div>

        {/* Container */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Container</label>
          <select
            value={container}
            onChange={e => setContainer(e.target.value)}
            className="h-8 px-2 text-sm bg-zinc-800 border border-zinc-700 rounded text-zinc-200 focus:outline-none"
          >
            {project.logContainers.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Source</label>
          <div className="flex h-8 border border-zinc-700 rounded overflow-hidden">
            <button
              onClick={() => setSource('docker')}
              className={`px-3 text-xs transition-colors ${source === 'docker' ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              Docker logs
            </button>
            <button
              onClick={() => setSource('file')}
              className={`px-3 text-xs transition-colors border-l border-zinc-700 ${source === 'file' ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              {project.logFile ?? '/app/logs/error.log'}
            </button>
          </div>
        </div>

        {/* Lines */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Lines</label>
          <select
            value={lines}
            onChange={e => setLines(parseInt(e.target.value) as Lines)}
            disabled={streaming}
            className="h-8 px-2 text-sm bg-zinc-800 border border-zinc-700 rounded text-zinc-200 focus:outline-none disabled:opacity-50"
          >
            {[50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={fetchLogs} disabled={loading || streaming}
            className="h-8 text-xs border-zinc-700 text-zinc-300 hover:text-white">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Fetch
          </Button>
          {streaming
            ? <Button size="sm" onClick={stopStream}
                className="h-8 text-xs bg-red-700 hover:bg-red-600 text-white">
                <Square className="w-3.5 h-3.5 mr-1.5" />Stop
              </Button>
            : <Button size="sm" onClick={startStream}
                className="h-8 text-xs bg-emerald-700 hover:bg-emerald-600 text-white">
                <Play className="w-3.5 h-3.5 mr-1.5" />Live Tail
              </Button>
          }
        </div>
      </div>

      {/* Filter + stats */}
      <div className="flex items-center gap-3">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter logs..."
          className="flex-1 h-7 px-3 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
        />
        <div className="flex gap-2 text-[10px] shrink-0">
          {errorCount > 0 && <Badge className="bg-red-950 text-red-400 border-red-800">{errorCount} errors</Badge>}
          {warnCount > 0 && <Badge className="bg-yellow-950 text-yellow-500 border-yellow-800">{warnCount} warns</Badge>}
          {logs.length > 0 && <span className="text-zinc-600 self-center">{filtered.length}/{logs.length} lines</span>}
        </div>
        {logs.length > 0 && (
          <div className="flex gap-1 shrink-0">
            <button onClick={downloadLogs} className="p-1 text-zinc-500 hover:text-zinc-300" title="Download">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button onClick={clearLogs} className="p-1 text-zinc-500 hover:text-zinc-300" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      {status && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {streaming && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
          {status}
        </div>
      )}

      {/* Log output */}
      <div
        className="h-[500px] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded font-mono text-[11px] leading-5 p-3"
        onScroll={e => {
          const el = e.currentTarget
          autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50
        }}
      >
        {filtered.length === 0 && !loading && (
          <p className="text-zinc-600 text-center mt-8">
            {logs.length === 0 ? 'Click Fetch hoặc Live Tail để xem logs' : 'Không có kết quả khớp filter'}
          </p>
        )}
        {filtered.map((log, i) => (
          <div key={i} className={`${colorize(log.text)} hover:bg-zinc-900 px-1 rounded whitespace-pre-wrap break-all`}>
            {log.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
