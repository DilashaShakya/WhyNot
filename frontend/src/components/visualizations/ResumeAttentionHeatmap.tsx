import { motion } from 'framer-motion'
import type { HeatZone } from '@/lib/analytics/comparisonAnalytics'

export function ResumeAttentionHeatmap({ zones }: { zones: HeatZone[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
        Recruiter skim map: posting-aligned term density across resume bands (heuristic).
      </p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
        {zones.map((z, i) => (
          <motion.div
            key={z.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            title={`${z.label}: ${z.hint}`}
            className="flex flex-col gap-2 rounded-md border border-neutral-200/90 bg-[var(--color-surface)] p-2 dark:border-neutral-800"
          >
            <div
              className="aspect-[4/5] w-full rounded-sm bg-neutral-300 dark:bg-neutral-700"
              style={{ opacity: 0.2 + (z.intensity / 100) * 0.85 }}
            />
            <div>
              <p className="text-[10px] font-medium text-neutral-800 dark:text-neutral-100">{z.label}</p>
              <p className="text-[10px] tabular-nums text-neutral-500 dark:text-neutral-400">{z.intensity}%</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
