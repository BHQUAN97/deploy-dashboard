'use client'
import { useState } from 'react'
import type { ProjectConfig } from '@/config/projects'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RotateCcw, Save } from 'lucide-react'

interface ShowcaseProject {
  id: string
  name: string
  domain: string
  stack: string[]
  description: string
  longDescription: string
  color: string
  icon: string
  demoCredentials?: ProjectConfig['demoCredentials']
}

interface Props {
  project: ProjectConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (project: ShowcaseProject) => void
}

export function ShowcaseEditDialog({ project, open, onOpenChange, onSaved }: Props) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [longDescription, setLongDescription] = useState(project.longDescription)
  const [color, setColor] = useState(project.color)
  const [icon, setIcon] = useState(project.icon)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function syncFromProject() {
    setName(project.name)
    setDescription(project.description)
    setLongDescription(project.longDescription)
    setColor(project.color)
    setIcon(project.icon)
    setError('')
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/showcase/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, longDescription, color, icon }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onSaved(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function reset() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/showcase/${project.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Reset failed')
      onSaved(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => { onOpenChange(next); if (next) syncFromProject() }}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sửa giới thiệu showcase</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Nội dung này hiển thị ở trang /showcase cho {project.domain}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <label className="grid gap-1.5 text-xs text-zinc-400">
            Tên hiển thị
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            />
          </label>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <label className="grid gap-1.5 text-xs text-zinc-400">
              Màu nhấn
              <input
                value={color}
                onChange={e => setColor(e.target.value)}
                className="h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
            <label className="grid gap-1.5 text-xs text-zinc-400">
              Icon
              <input
                value={icon}
                onChange={e => setIcon(e.target.value)}
                className="h-9 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-xs text-zinc-400">
            Mô tả ngắn
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 resize-none"
            />
          </label>

          <label className="grid gap-1.5 text-xs text-zinc-400">
            Nội dung giới thiệu
            <textarea
              value={longDescription}
              onChange={e => setLongDescription(e.target.value)}
              rows={6}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 resize-none"
            />
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={reset} disabled={saving}>
            <RotateCcw className="w-3.5 h-3.5" />
            Về mặc định
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
