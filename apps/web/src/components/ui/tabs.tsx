'use client'
import * as React from 'react'
import { cn } from '../../lib/cn'

export function Tabs({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm">
      {items.map((it) => (
        <button key={it} onClick={() => onChange(it)} className={cn('px-4 py-1.5 rounded-full transition', value === it ? 'bg-white shadow border border-slate-200' : 'text-slate-600 hover:text-slate-900')}>
          {it}
        </button>
      ))}
    </div>
  )
}

