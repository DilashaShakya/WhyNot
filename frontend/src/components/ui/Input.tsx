import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-neutral-200 bg-[var(--color-surface)] px-3 py-2 text-sm text-neutral-900 transition-shadow placeholder:text-neutral-400',
        'focus-visible:border-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400',
        'dark:border-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
