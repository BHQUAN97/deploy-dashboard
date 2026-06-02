'use client'
import { useEffect } from 'react'

export function AuthGuard() {
  useEffect(() => {
    const original = window.fetch
    window.fetch = async function (...args) {
      const res = await original.apply(this, args as Parameters<typeof fetch>)
      if (res.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : ''
        // chỉ redirect khi gọi API nội bộ, không redirect cho external
        if (!url.startsWith('http') || url.includes(window.location.host)) {
          window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname)
        }
      }
      return res
    }
    return () => { window.fetch = original }
  }, [])

  return null
}
