import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'

type SkillGapMeterProps = {
  matchingCount: number
  missingCount: number
  label?: string
}

export function SkillGapMeter({ matchingCount, missingCount, label = 'Skill coverage (job lexicon)' }: SkillGapMeterProps) {
  const total = matchingCount + missingCount
  const matchPct = total === 0 ? 0 : (matchingCount / total) * 100
  const missPct = total === 0 ? 0 : (missingCount / total) * 100

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{label}</p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Heuristic overlap between extracted job skills and your resume. Future releases can deepen this with richer
            NLP.
          </p>
        </div>
        <div className="text-right text-xs text-neutral-500 dark:text-neutral-400">
          <div>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">{matchingCount}</span> matched
          </div>
          <div>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">{missingCount}</span> gaps
          </div>
        </div>
      </div>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-800">
        <motion.div
          className="bg-neutral-900 dark:bg-neutral-100"
          initial={{ width: 0 }}
          animate={{ width: `${matchPct}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          title="Matched"
        />
        <motion.div
          className="bg-neutral-300 dark:bg-neutral-600"
          initial={{ width: 0 }}
          animate={{ width: `${missPct}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.03 }}
          title="Missing"
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <span>Matched</span>
        <span>Not yet surfaced</span>
      </div>
    </Card>
  )
}
