import * as React from 'react'
import { cn } from '../../lib/cn'

export function Pill({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <span className={cn('inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium', className)}>{children}</span>
}

