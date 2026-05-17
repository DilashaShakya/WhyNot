import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-neutral-100',
        className,
      )}
      aria-hidden
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
      <Spinner className="size-8" />
      <span>Loading</span>
    </div>
  )
}
