import { NextRequest, NextResponse } from 'next/server'
import {
  resetShowcaseContent,
  updateShowcaseContent,
  type ShowcaseContentOverride,
} from '@/lib/showcase-content'

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : ''
}

function parsePayload(body: unknown): ShowcaseContentOverride | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const input = body as Record<string, unknown>
  const color = cleanText(input.color, 7)

  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return null
  }

  return {
    name: cleanText(input.name, 120),
    description: cleanText(input.description, 300),
    longDescription: cleanText(input.longDescription, 1200),
    color,
    icon: cleanText(input.icon, 16),
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/admin/showcase/[projectId]'>) {
  const { projectId } = await ctx.params
  const payload = parsePayload(await req.json().catch(() => null))

  if (!payload) {
    return NextResponse.json({ error: 'Invalid showcase content' }, { status: 400 })
  }

  const project = await updateShowcaseContent(projectId, payload)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/admin/showcase/[projectId]'>) {
  const { projectId } = await ctx.params
  const project = await resetShowcaseContent(projectId)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}
