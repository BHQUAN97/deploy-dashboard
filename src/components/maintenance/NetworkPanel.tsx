'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SshOutput } from './SshOutput'
import { Network, CheckCircle2 } from 'lucide-react'

export function NetworkPanel() {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleFix() {
    setDone(false)
    setStreamUrl(null)
    // Trigger POST then redirect to GET stream
    fetch('/api/vps/networks', { method: 'POST' })
      .then(() => setStreamUrl('/api/vps/networks-stream'))
      .catch(() => {})
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-zinc-200">Fix Docker Networks</h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Connect tất cả app containers vào <code className="bg-zinc-800 px-1 rounded">webphoto_backend</code> network.
            Dùng khi gặp lỗi 502 Bad Gateway sau deploy.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleFix}
          disabled={!!streamUrl && !done}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shrink-0"
        >
          <Network className="w-3.5 h-3.5 mr-1.5" />
          Fix Networks
        </Button>
      </div>
      {done && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />nginx reloaded — 502s should be resolved
        </div>
      )}
      <SshOutput streamUrl={streamUrl} onDone={(code) => { if (code === 0) setDone(true) }} />
    </div>
  )
}
