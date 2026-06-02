'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wrench, Globe, ScrollText, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/logout'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/logs', label: 'Logs', icon: ScrollText },
  { href: '/maintenance', label: 'VPS Maintenance', icon: Wrench },
  { href: '/showcase', label: 'Showcase', icon: Globe, external: true },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-56 bg-zinc-900 border-r border-zinc-800 flex-col shrink-0">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">🚀 DeployHub</span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">VPS Manager</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon, external }) => (
          <Link
            key={href}
            href={href}
            target={external ? '_blank' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-zinc-800 text-white font-medium'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-zinc-800 space-y-2">
        <p className="text-xs text-zinc-600">159.223.77.247</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
