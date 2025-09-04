import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

export function Drawer({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  React.useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onOpenChange(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onOpenChange])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className={cn('absolute right-0 top-0 h-full w-full max-w-lg bg-white p-6 overflow-y-auto rounded-l-2xl shadow-xl')}>{children}</div>
    </div>,
    document.body
  )
}

