import { cn } from '@/lib/cn'

const chevron = (
  <svg className="size-4 shrink-0 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
)

export function FeedbackDisclosure({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <details className="group border-b border-neutral-200 dark:border-neutral-800">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-start justify-between gap-3 py-4 [&::-webkit-details-marker]:hidden',
        )}
      >
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
        </div>
        <span className="transition-transform group-open:rotate-180">{chevron}</span>
      </summary>
      <div className="border-t border-dashed border-neutral-200/80 pb-4 pt-3 dark:border-neutral-800">{children}</div>
    </details>
  )
}
