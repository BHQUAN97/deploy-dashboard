import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PROJECTS, type ProjectConfig } from '@/config/projects'

export interface ShowcaseContentOverride {
  name?: string
  description?: string
  longDescription?: string
  color?: string
  icon?: string
}

export type ShowcaseProject = Pick<
  ProjectConfig,
  'id' | 'name' | 'domain' | 'stack' | 'description' | 'longDescription' | 'color' | 'icon' | 'demoCredentials'
>

const DATA_DIR = path.join(process.cwd(), 'data')
const CONTENT_FILE = path.join(DATA_DIR, 'showcase-content.json')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readOverrides(): Promise<Record<string, ShowcaseContentOverride>> {
  try {
    const raw = await readFile(CONTENT_FILE, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return {}
    return parsed as Record<string, ShowcaseContentOverride>
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return {}
    }
    throw err
  }
}

async function writeOverrides(overrides: Record<string, ShowcaseContentOverride>) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(CONTENT_FILE, `${JSON.stringify(overrides, null, 2)}\n`, 'utf8')
}

export async function getShowcaseProjects(): Promise<ShowcaseProject[]> {
  const overrides = await readOverrides()
  return PROJECTS.map(project => {
    const override = overrides[project.id] ?? {}
    return {
      id: project.id,
      name: override.name ?? project.name,
      domain: project.domain,
      stack: project.stack,
      description: override.description ?? project.description,
      longDescription: override.longDescription ?? project.longDescription,
      color: override.color ?? project.color,
      icon: override.icon ?? project.icon,
      demoCredentials: project.demoCredentials,
    }
  })
}

export async function updateShowcaseContent(
  projectId: string,
  content: ShowcaseContentOverride
): Promise<ShowcaseProject | null> {
  const project = PROJECTS.find(p => p.id === projectId)
  if (!project) return null

  const overrides = await readOverrides()
  overrides[projectId] = {
    ...overrides[projectId],
    ...content,
  }
  await writeOverrides(overrides)

  return (await getShowcaseProjects()).find(p => p.id === projectId) ?? null
}

export async function resetShowcaseContent(projectId: string): Promise<ShowcaseProject | null> {
  const project = PROJECTS.find(p => p.id === projectId)
  if (!project) return null

  const overrides = await readOverrides()
  delete overrides[projectId]
  await writeOverrides(overrides)

  return (await getShowcaseProjects()).find(p => p.id === projectId) ?? null
}
