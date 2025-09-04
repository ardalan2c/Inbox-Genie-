import * as React from 'react'
import { cn } from '../../lib/cn'

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-2xl bg-white shadow-soft border border-slate-200', className)} {...props} />
)

export const DarkCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-2xl bg-slate-900 border border-slate-800 text-slate-100', className)} {...props} />
)

