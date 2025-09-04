"use client"
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '@/lib/config'

export function EnvBanner() {
  const { data } = useQuery({
    queryKey: ['health-keys'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/health/keys`)
      return res.json()
    }
  })
  if (!data) return null
  const missing = Object.entries(data.keys || {}).filter(([, v]) => !v).map(([k]) => k)
  if (missing.length === 0) return null
  return (
    <div className="bg-amber-50 border-y border-amber-200 text-amber-900 text-sm">
      <div className="container py-2">Missing env keys: {missing.join(', ')} — dependent features return 501.</div>
    </div>
  )
}

