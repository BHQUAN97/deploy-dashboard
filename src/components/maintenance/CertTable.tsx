'use client'
import { useState, useCallback, useEffect } from 'react'
import { VPS_DOMAINS } from '@/config/vps-domains'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SshOutput } from './SshOutput'
import { RefreshCw, Shield, ShieldAlert, ShieldX } from 'lucide-react'
import type { DomainHealth } from '@/lib/domain-health'

export function CertTable() {
  const [activeStream, setActiveStream] = useState<string | null>(null)
  const [activeDomain, setActiveDomain] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [healthMap, setHealthMap] = useState<Map<string, DomainHealth>>(new Map())

  useEffect(() => {
    fetch('/api/domains/health')
      .then(r => r.ok ? r.json() : [])
      .then((data: DomainHealth[]) => setHealthMap(new Map(data.map(d => [d.domain, d]))))
      .catch(() => {})
  }, [])

  const renewCert = useCallback(async (domain: string, sans: string[], force = false) => {
    setLoading(domain)
    setActiveDomain(domain)
    // POST to get SSE URL — we use a trick: trigger POST then open SSE
    const res = await fetch('/api/vps/certbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, sans, force }),
    })
    if (!res.ok) return
    // The response IS the SSE stream — create a URL to re-request it via EventSource
    // We pass params as query for GET-based SSE
    setLoading(null)
    // Since our certbot endpoint is POST+SSE, we need a workaround:
    // Store the body params and use a fake URL with encoded params
    const params = new URLSearchParams({ domain, sans: sans.join(','), force: String(force) })
    setActiveStream(`/api/vps/certbot-stream?${params}`)
  }, [])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-medium">Domain</TableHead>
              <TableHead className="text-zinc-400 font-medium">Expiry</TableHead>
              <TableHead className="text-zinc-400 font-medium">SANs</TableHead>
              <TableHead className="text-zinc-400 font-medium w-28">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {VPS_DOMAINS.map(cert => {
              const health = healthMap.get(cert.domain)
              const days = health?.ssl?.daysRemaining
              const expired = days !== undefined && days <= 0
              const danger = days !== undefined && days > 0 && days < 30
              const warning = days !== undefined && days >= 30 && days < 60
              const rowColor = expired ? 'bg-red-950/20' : danger ? 'bg-red-950/10' : warning ? 'bg-amber-950/10' : ''
              return (
              <TableRow key={cert.domain} className={`border-zinc-800 hover:bg-zinc-800/30 ${activeDomain === cert.domain ? 'bg-zinc-800/20' : rowColor}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {expired ? <ShieldX className="w-3.5 h-3.5 text-red-500" />
                      : danger ? <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      : warning ? <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      : <Shield className="w-3.5 h-3.5 text-zinc-500" />}
                    <span className="font-mono text-xs text-zinc-200">{cert.domain}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {days === undefined
                    ? <span className="text-xs text-zinc-600">—</span>
                    : <span className={`text-xs font-medium ${expired ? 'text-red-400' : danger ? 'text-red-400' : warning ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {expired ? 'Expired' : `${days}d`}
                      </span>
                  }
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {cert.sans.slice(0, 3).map(s => (
                      <Badge key={s} className="text-[10px] px-1 py-0 bg-zinc-800 text-zinc-400 border-0 hover:bg-zinc-800">{s}</Badge>
                    ))}
                    {cert.sans.length > 3 && <Badge className="text-[10px] px-1 py-0 bg-zinc-800 text-zinc-500 border-0 hover:bg-zinc-800">+{cert.sans.length - 3}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-7 text-xs border-zinc-700 hover:bg-zinc-800 hover:text-white ${danger || expired ? 'border-red-800 text-red-400 hover:text-red-300' : 'text-zinc-300'}`}
                    disabled={loading === cert.domain}
                    onClick={() => renewCert(cert.domain, cert.sans)}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${loading === cert.domain ? 'animate-spin' : ''}`} />
                    Renew
                  </Button>
                </TableCell>
              </TableRow>
            )})}

          </TableBody>
        </Table>
      </div>

      {activeStream && activeDomain && (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Output for: <span className="text-zinc-300 font-mono">{activeDomain}</span></p>
          <SshOutput
            streamUrl={activeStream}
            onDone={(code) => {
              if (code === 0) setTimeout(() => setActiveStream(null), 3000)
            }}
          />
        </div>
      )}
    </div>
  )
}
