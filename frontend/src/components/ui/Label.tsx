import type { LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300', className)}
      {...props}
    />
  )
}
