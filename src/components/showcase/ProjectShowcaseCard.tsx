'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Copy, Check, KeyRound, Globe } from 'lucide-react'

interface DemoCredentials {
  adminUrl: string
  username: string
  password: string
  note?: string
}

interface ProjectInfo {
  id: string
  name: string
  domain: string
  stack: string[]
  description: string
  longDescription: string
  color: string
  icon: string
  demoCredentials?: DemoCredentials
}

interface Props { project: ProjectInfo }

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

export function ProjectShowcaseCard({ project }: Props) {
  const [showCreds, setShowCreds] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Color accent bar */}
      <div className="h-1.5" style={{ backgroundColor: project.color }} />

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{project.icon}</span>
            <div>
              <h3 className="font-semibold text-zinc-900">{project.name}</h3>
              <a
                href={`https://${project.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <Globe className="w-3 h-3" />{project.domain}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
          <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="shrink-0 text-white text-xs" style={{ backgroundColor: project.color }}>
              Xem Live <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </a>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-600 leading-relaxed">{project.longDescription}</p>

        {/* Stack */}
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map(s => (
            <Badge key={s} variant="secondary" className="text-xs font-normal bg-zinc-100 text-zinc-600 hover:bg-zinc-100">
              {s}
            </Badge>
          ))}
        </div>

        {/* Demo Credentials */}
        {project.demoCredentials && (
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              onClick={() => setShowCreds(!showCreds)}
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                Demo Credentials
              </span>
              <span className="text-zinc-400 text-xs">{showCreds ? '▲' : '▼'}</span>
            </button>

            {showCreds && (
              <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500 w-16 shrink-0">Admin URL</span>
                  <a href={project.demoCredentials.adminUrl} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-blue-600 hover:text-blue-800 truncate">
                    {project.demoCredentials.adminUrl}
                  </a>
                  <CopyButton text={project.demoCredentials.adminUrl} />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500 w-16 shrink-0">Username</span>
                  <span className="font-mono text-zinc-800 flex-1">{project.demoCredentials.username}</span>
                  <CopyButton text={project.demoCredentials.username} />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500 w-16 shrink-0">Password</span>
                  <span className="font-mono text-zinc-800 flex-1">{project.demoCredentials.password}</span>
                  <CopyButton text={project.demoCredentials.password} />
                </div>
                {project.demoCredentials.note && (
                  <p className="text-[11px] text-zinc-400 italic">{project.demoCredentials.note}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
