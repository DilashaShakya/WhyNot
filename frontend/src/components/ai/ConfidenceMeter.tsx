import { motion } from 'framer-motion'

export function ConfidenceMeter({
  label,
  value,
  className = '',
}: {
  label: string
  value: number | null | undefined
  className?: string
}) {
  const v = typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null

  return (
    <div className={className}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
        {v !== null ? (
          <span className="text-[11px] tabular-nums text-neutral-500 dark:text-neutral-500">{v}%</span>
        ) : (
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">—</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200/90 dark:bg-neutral-800">
        {v !== null ? (
          <motion.div
            className="h-full rounded-full bg-neutral-800 dark:bg-neutral-200"
            initial={{ width: 0 }}
            animate={{ width: `${v}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
      </div>
    </div>
  )
}
