import { motion } from 'framer-motion'

type OverlapBarProps = {
  label: string
  valuePercent: number
  hint?: string
}

export function OverlapBar({ label, valuePercent, hint }: OverlapBarProps) {
  const safe = Number.isFinite(valuePercent) ? Math.min(100, Math.max(0, valuePercent)) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{label}</span>
        <span className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">{safe.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200/90 dark:bg-neutral-800">
        <motion.div
          className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
          initial={{ width: 0 }}
          animate={{ width: `${safe}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {hint ? <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{hint}</p> : null}
    </div>
  )
}
