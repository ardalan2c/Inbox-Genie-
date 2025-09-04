'use client'
import * as React from 'react'
import { cn } from '../../lib/cn'

type Item = { id: string; title: string; content: React.ReactNode }

export function Accordion({ items }: { items: Item[] }) {
  const [open, setOpen] = React.useState<string | null>(null)
  return (
    <div className="divide-y rounded-2xl border bg-white">
      {items.map((it) => {
        const isOpen = open === it.id
        return (
          <div key={it.id}>
            <button className={cn('w-full text-left px-6 py-4 flex items-center justify-between', isOpen && 'bg-slate-50')} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : it.id)}>
              <span className="font-medium">{it.title}</span>
              <span aria-hidden>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="px-6 pb-6 text-sm text-slate-600">{it.content}</div>}
          </div>
        )
      })}
    </div>
  )
}

