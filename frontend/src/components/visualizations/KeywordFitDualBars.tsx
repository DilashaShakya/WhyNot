import { motion } from 'framer-motion'

export function KeywordFitDualBars({
  jobCoverage,
  resumeCoverage,
}: {
  jobCoverage: number
  resumeCoverage: number
}) {
  const j = Math.min(100, Math.max(0, jobCoverage))
  const r = Math.min(100, Math.max(0, resumeCoverage))

  return (
    <div className="space-y-4">
      {[
        { label: 'Keywords vs. job posting', value: j, hint: 'Matched distilled terms ÷ job terms' },
        { label: 'Keywords vs. resume', value: r, hint: 'Overlap ÷ resume distilled terms' },
      ].map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
          className="space-y-1.5"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-100">{row.label}</span>
            <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
              {row.value.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200/90 dark:bg-neutral-800">
            <motion.div
              className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
              initial={{ width: 0 }}
              animate={{ width: `${row.value}%` }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-500">{row.hint}</p>
        </motion.div>
      ))}
    </div>
  )
}
