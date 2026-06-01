'use client'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

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
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950 shrink-0">
      <h1 className="text-sm font-medium text-zinc-300">Deploy Dashboard</h1>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefreshAll}
        disabled={refreshing}
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh All
      </Button>
    </header>
  )
}
