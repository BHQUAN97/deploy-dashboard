import { ShowcaseGrid } from '@/components/showcase/ShowcaseGrid'
import { PROJECTS } from '@/config/projects'

export const metadata = {
  title: 'Project Showcase',
  description: 'Danh sách các dự án web đang vận hành trên VPS',
}

export default function ShowcasePage() {
  const projects = PROJECTS.map(p => ({
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

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">Project Showcase</h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto">
            Danh sách các dự án web đang vận hành. Click &quot;Xem Live&quot; để truy cập, hoặc mở Demo Credentials để đăng nhập admin.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            {projects.length} projects · VPS 159.223.77.247
          </div>
        </div>

        <ShowcaseGrid projects={projects} />

        <footer className="mt-16 text-center text-xs text-zinc-400">
          Powered by DeployHub · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}
