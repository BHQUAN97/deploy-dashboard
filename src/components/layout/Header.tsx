'use client'
import { RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { logout } from '@/lib/logout'

export function Header() {
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefreshAll() {
    setRefreshing(true)
    try {
      await fetch('/api/domains/health?refresh=true')
      window.location.reload()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 bg-zinc-950 shrink-0">
      <h1 className="text-sm font-medium text-zinc-300">Deploy Dashboard</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''} md:mr-2`} />
          <span className="hidden md:inline">Refresh All</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          title="Đăng xuất"
          className="md:hidden w-9 h-9 text-zinc-500 hover:text-white hover:bg-zinc-800"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
