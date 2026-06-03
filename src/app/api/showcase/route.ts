import { NextResponse } from 'next/server'
import { getShowcaseProjects } from '@/lib/showcase-content'

export async function GET() {
  return NextResponse.json(await getShowcaseProjects())
}
