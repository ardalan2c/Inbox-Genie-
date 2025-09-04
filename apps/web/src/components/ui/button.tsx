'use client'
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow-soft hover:brightness-110',
        outline: 'border border-slate-300 hover:bg-slate-100',
        ghost: 'hover:bg-slate-100',
        subtle: 'bg-slate-100 text-slate-900 hover:bg-slate-200'
      },
      size: { sm: 'h-9 px-4', md: 'h-11 px-5', lg: 'h-12 px-6' }
    },
    defaultVariants: { variant: 'default', size: 'md' }
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
))
Button.displayName = 'Button'

