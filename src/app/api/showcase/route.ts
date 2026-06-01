import { NextResponse } from 'next/server'
import { PROJECTS } from '@/config/projects'

export async function GET() {
  const publicData = PROJECTS.map(p => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
    stack: p.stack,
    description: p.description,
    longDescription: p.longDescription,
    color: p.color,
    icon: p.icon,
    demoCredentials: p.demoCredentials,
  }))
  return NextResponse.json(publicData)
}
