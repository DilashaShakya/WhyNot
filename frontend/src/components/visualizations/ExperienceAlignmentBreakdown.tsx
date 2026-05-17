import { motion } from 'framer-motion'
import type { ExperienceAlignment } from '@/api/types'

export function ExperienceAlignmentBreakdown({ alignment }: { alignment: ExperienceAlignment }) {
  const rows = [
    { label: 'Heuristic score', value: `${alignment.score}/100`, hint: 'Years + seniority language signals' },
    {
      label: 'Posting years cue',
      value: alignment.job_years_mentioned != null ? `${alignment.job_years_mentioned}+` : '—',
    },
    {
      label: 'Resume years cue',
      value: alignment.resume_years_mentioned != null ? `${alignment.resume_years_mentioned}+` : '—',
    },
  ]

  return (
    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="flex items-baseline justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div>
            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-100">{row.label}</p>
            {row.hint ? (
              <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-500">{row.hint}</p>
            ) : null}
          </div>
          <span className="text-sm tabular-nums text-neutral-900 dark:text-neutral-50">{row.value}</span>
        </motion.div>
      ))}
      {alignment.signals.length > 0 ? (
        <div className="pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Signals
          </p>
          <ul className="mt-2 space-y-1.5">
            {alignment.signals.slice(0, 4).map((s, idx) => (
              <li key={idx} className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {s.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
