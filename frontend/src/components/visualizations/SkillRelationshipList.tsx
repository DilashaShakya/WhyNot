import { motion } from 'framer-motion'
import type { SemanticSkillMapping } from '@/lib/analytics/semanticLayer'

export function SkillRelationshipList({
  title,
  mappings,
  description,
}: {
  title: string
  description?: string
  mappings: SemanticSkillMapping[]
}) {
  if (mappings.length === 0) {
    return description ? <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p> : null
  }

  return (
    <div className="space-y-3">
      <div>
        {title ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            {title}
          </p>
        ) : null}
        {description ? (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
        ) : null}
      </div>
      <ul className="space-y-2">
        {mappings.map((m, i) => (
          <motion.li
            key={`${m.job_skill.slug}-${m.resume_skill.slug}-${i}`}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
            className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm text-neutral-900 dark:text-neutral-50">
                <span className="font-medium">{m.job_skill.label}</span>
                <span className="mx-1.5 text-neutral-400">→</span>
                <span className="font-medium">{m.resume_skill.label}</span>
              </span>
              <span className="text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
                {(m.similarity * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900">
              <motion.div
                className="h-full rounded-full bg-neutral-800 dark:bg-neutral-200"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, m.similarity * 100)}%` }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              {m.relationship === 'synonym_or_close' ? 'Strong semantic proximity' : 'Transferable signal'}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
