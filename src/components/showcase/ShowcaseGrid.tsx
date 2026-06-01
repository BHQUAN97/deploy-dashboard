import { ProjectShowcaseCard } from './ProjectShowcaseCard'

interface ProjectInfo {
  id: string
  name: string
  domain: string
  stack: string[]
  description: string
  longDescription: string
  color: string
  icon: string
  demoCredentials?: { adminUrl: string; username: string; password: string; note?: string }
}

interface Props { projects: ProjectInfo[] }

export function ShowcaseGrid({ projects }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map(p => <ProjectShowcaseCard key={p.id} project={p} />)}
    </div>
  )
}
