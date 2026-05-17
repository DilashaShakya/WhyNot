import { Card } from '@/components/ui/Card'
import type { SkillRow } from '@/api/types'

type SkillListCardProps = {
  title: string
  subtitle?: string
  skills: SkillRow[]
  emptyText: string
  tone: 'positive' | 'neutral' | 'muted'
}

const toneStyles = {
  positive: 'border-neutral-200 dark:border-neutral-800',
  neutral: 'border-neutral-200 dark:border-neutral-800',
  muted: 'border-neutral-200 dark:border-neutral-800',
} as const

export function SkillListCard({ title, subtitle, skills, emptyText, tone }: SkillListCardProps) {
  return (
    <Card className={`p-5 ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
        </div>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          {skills.length}
        </span>
      </div>

      {skills.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">{emptyText}</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {skills.map((s) => (
            <li
              key={s.slug}
              className="rounded-md border border-neutral-200 bg-[var(--color-surface)] px-2.5 py-1 text-xs text-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
