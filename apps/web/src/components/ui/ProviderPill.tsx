import React from 'react'
import { cn } from '../../lib/cn'

export function ProviderPill({ name, real, demoMode }: { name: string; real: boolean; demoMode: boolean }) {
  const state = real ? 'Real' : demoMode ? 'Mock' : 'Off'
  const color = real ? 'bg-green-100 text-green-800 border-green-200' : demoMode ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium', color)}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" aria-hidden style={{ backgroundColor: real ? '#16a34a' : demoMode ? '#f59e0b' : '#94a3b8' }} />
      <span>{name}</span>
      <span className="opacity-70">{state}</span>
    </span>
  )
}

