'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wrench, Globe, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/logs', label: 'Logs', icon: ScrollText },
  { href: '/maintenance', label: 'VPS', icon: Wrench },
  { href: '/showcase', label: 'Showcase', icon: Globe, external: true },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-900 border-t border-zinc-800 safe-area-bottom">
      <div className="flex items-stretch h-16">
        {NAV.map(({ href, label, icon: Icon, external }) => {
          const active = pathname === href || (!external && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-1 text-[10px] transition-colors',
                active ? 'text-white' : 'text-zinc-500'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
