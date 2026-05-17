import type { ReactNode } from 'react'
import type {
  AiRejectionAnalysisDetail,
  AiRejectionStructuredFeedback,
  BulletRewriteItem,
  ContextualMissingSkill,
  ImpactMetricsGap,
  PrioritizedImprovement,
} from '@/api/aiRejection.api'
import { ConfidenceMeter } from '@/components/ai/ConfidenceMeter'
import { FeedbackDisclosure } from '@/components/ai/FeedbackDisclosure'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'

const CONF_LABELS: { key: string; title: string }[] = [
  { key: 'recruiter_observations', title: 'Recruiter observations' },
  { key: 'bullet_rewrites', title: 'Bullet depth' },
  { key: 'contextual_missing_skills', title: 'Skill context' },
  { key: 'positioning_recommendations', title: 'Positioning' },
  { key: 'impact_metrics_gaps', title: 'Impact & metrics' },
  { key: 'resume_strengths', title: 'Strength recognition' },
  { key: 'prioritized_improvements', title: 'Action plan' },
]

const PRIORITY_DOT: Record<PrioritizedImprovement['priority'], string> = {
  high: 'bg-neutral-900 dark:bg-neutral-100',
  medium: 'bg-neutral-500 dark:bg-neutral-400',
  low: 'bg-neutral-300 dark:bg-neutral-600',
}

function Checklist({ items }: { items: PrioritizedImprovement[] }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">No prioritized items returned—try re-running with a fuller resume.</p>
  }
  return (
    <ol className="space-y-4">
      {items.map((it, i) => (
        <motion.li
          key={`${it.title}-${i}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex gap-3 border-b border-neutral-100 pb-4 last:border-0 dark:border-neutral-800/80"
        >
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[it.priority] ?? PRIORITY_DOT.medium}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{it.title}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                {it.priority} · {it.category}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{it.detail}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  )
}

function BulletCards({ items }: { items: BulletRewriteItem[] }) {
  if (!items.length) return null
  return (
    <div className="space-y-4">
      {items.map((b, i) => (
        <Card key={i} className="overflow-hidden border-neutral-200 p-0 dark:border-neutral-800">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Before</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">{b.original_bullet}</p>
              {b.weakness_tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {b.weakness_tags.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Suggested rewrite</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900 dark:text-neutral-50">
                {b.improved_bullet}
              </p>
              {b.why_stronger ? (
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{b.why_stronger}</p>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ContextSkills({ rows }: { rows: ContextualMissingSkill[] }) {
  if (!rows.length) return null
  return (
    <div className="space-y-4">
      {rows.map((r, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{r.skill_or_term}</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Why it matters</dt>
              <dd className="mt-0.5 text-neutral-700 dark:text-neutral-300">{r.why_it_matters}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">In the posting</dt>
              <dd className="mt-0.5 text-neutral-700 dark:text-neutral-300">{r.where_in_job_posting}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Transferable angle</dt>
              <dd className="mt-0.5 text-neutral-700 dark:text-neutral-300">{r.transferable_angle}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">How to surface</dt>
              <dd className="mt-0.5 text-neutral-700 dark:text-neutral-300">{r.how_to_surface}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  )
}

function ImpactList({ items }: { items: ImpactMetricsGap[] }) {
  if (!items.length) return null
  return (
    <ul className="space-y-3">
      {items.map((x, i) => (
        <li key={i} className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {x.resume_excerpt ? (
            <p className="rounded border border-neutral-200 bg-neutral-50/50 px-2 py-1 font-medium text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-200">
              “{x.resume_excerpt}”
            </p>
          ) : null}
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Gap:</span> {x.gap}
          </p>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Direction:</span> {x.suggested_direction}
          </p>
        </li>
      ))}
    </ul>
  )
}

type LegacySectionDef = { key: keyof AiRejectionStructuredFeedback; title: string; subtitle?: string }

const LEGACY_STRENGTH_DEFS: LegacySectionDef[] = [
  { key: 'strong_areas', title: 'Additional strengths', subtitle: 'From extended analysis fields.' },
]

const LEGACY_WEAKNESS_DEFS: LegacySectionDef[] = [
  { key: 'possible_rejection_factors', title: 'Screening risks', subtitle: 'What a busy recruiter might flag.' },
  { key: 'missing_skills', title: 'Lexicon gaps', subtitle: 'From matcher + narrative.' },
  { key: 'resume_weaknesses', title: 'Clarity & depth' },
  { key: 'keyword_deficiencies', title: 'Language vs posting' },
  { key: 'experience_mismatch_notes', title: 'Scope & seniority' },
  { key: 'project_alignment_notes', title: 'Project fit' },
  { key: 'formatting_readability_notes', title: 'Structure' },
]

const LEGACY_IMPROVEMENT_DEFS: LegacySectionDef[] = [
  { key: 'suggested_improvements', title: 'Extra suggestions' },
  { key: 'recommended_next_steps', title: 'Next steps' },
]

function StrategistSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-[var(--color-surface)] p-5 dark:border-neutral-800">
      <header className="mb-4">
        <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function LegacyDisclosures({ defs, fb }: { defs: LegacySectionDef[]; fb: AiRejectionStructuredFeedback }) {
  const rows = defs
    .map(({ key, title, subtitle }) => {
      const items = (fb[key] as string[] | undefined) ?? []
      if (!items.length) return null
      return (
        <FeedbackDisclosure key={String(key)} title={title} subtitle={subtitle}>
          <BulletList items={items} />
        </FeedbackDisclosure>
      )
    })
    .filter(Boolean)
  if (!rows.length) return null
  return <div className="space-y-1 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">{rows}</div>
}

function EmptySectionHint({ text }: { text: string }) {
  return <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">No items.</p>
  }
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span className="mt-2 h-px w-3 shrink-0 bg-neutral-300 dark:bg-neutral-600" aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function ResumeStrategistPanel({ detail, fb }: { detail: AiRejectionAnalysisDetail; fb: AiRejectionStructuredFeedback }) {
  const conf = detail.confidence_by_section || {}

  const strengthsResume = fb.resume_strengths?.length
  const weaknessesRecruiter = fb.recruiter_observations?.length
  const weaknessesContext = fb.contextual_missing_skills?.length
  const weaknessesImpact = fb.impact_metrics_gaps?.length
  const improvementsBullets = fb.bullet_rewrites?.length
  const improvementsPriority = fb.prioritized_improvements?.length
  const improvementsPosition = fb.positioning_recommendations?.length

  const hasStrengthLegacy = LEGACY_STRENGTH_DEFS.some((d) => ((fb[d.key] as string[] | undefined) ?? []).length > 0)
  const hasWeaknessLegacy = LEGACY_WEAKNESS_DEFS.some((d) => ((fb[d.key] as string[] | undefined) ?? []).length > 0)
  const hasImproveLegacy = LEGACY_IMPROVEMENT_DEFS.some((d) => ((fb[d.key] as string[] | undefined) ?? []).length > 0)

  const hasStrengths = Boolean(strengthsResume || hasStrengthLegacy)
  const hasWeaknesses = Boolean(weaknessesRecruiter || weaknessesContext || weaknessesImpact || hasWeaknessLegacy)
  const hasImprovements = Boolean(improvementsBullets || improvementsPriority || improvementsPosition || hasImproveLegacy)

  return (
    <div className="space-y-5">
      {fb.executive_summary?.trim() ? (
        <Card className="border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Strategic read</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">{fb.executive_summary.trim()}</p>
        </Card>
      ) : null}

      <StrategistSection
        title="Strengths"
        subtitle="Signals that already support your fit for this posting—lean on these when you edit."
      >
        {strengthsResume ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Resume highlights</p>
            <div className="mt-2">
              <BulletList items={fb.resume_strengths!} />
            </div>
          </div>
        ) : null}
        <LegacyDisclosures defs={LEGACY_STRENGTH_DEFS} fb={fb} />
        {!hasStrengths ? (
          <EmptySectionHint text="No strengths were called out for this run—see weaknesses and improvements for concrete edits." />
        ) : null}
      </StrategistSection>

      <StrategistSection
        title="Weaknesses"
        subtitle="Gaps, friction, and how your materials may read to someone skimming this role."
      >
        {weaknessesRecruiter ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Screener-style observations</p>
            <div className="mt-2">
              <BulletList items={fb.recruiter_observations!} />
            </div>
          </div>
        ) : null}
        {weaknessesContext ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Missing signals (in context)</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Why the job cares and how to reflect transferable experience honestly.
            </p>
            <div className="mt-3">
              <ContextSkills rows={fb.contextual_missing_skills as ContextualMissingSkill[]} />
            </div>
          </div>
        ) : null}
        {weaknessesImpact ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Impact & metrics gaps</p>
            <div className="mt-3">
              <ImpactList items={fb.impact_metrics_gaps as ImpactMetricsGap[]} />
            </div>
          </div>
        ) : null}
        <LegacyDisclosures defs={LEGACY_WEAKNESS_DEFS} fb={fb} />
        {!hasWeaknesses ? (
          <EmptySectionHint text="No weaknesses were listed—still review improvements for tightening language and proof." />
        ) : null}
      </StrategistSection>

      <StrategistSection
        title="Improvements"
        subtitle="Concrete rewrites and ordered actions to align the resume with this job."
      >
        {improvementsBullets ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">What to write instead — bullets</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Paste-ready lines; tweak numbers and scope so they stay truthful.
            </p>
            <div className="mt-3">
              <BulletCards items={fb.bullet_rewrites as BulletRewriteItem[]} />
            </div>
          </div>
        ) : null}
        {improvementsPriority ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Prioritized checklist</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Work top-down; each item maps to this posting.</p>
            <div className="mt-3">
              <Checklist items={fb.prioritized_improvements as PrioritizedImprovement[]} />
            </div>
          </div>
        ) : null}
        {improvementsPosition ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Positioning & structure</p>
            <div className="mt-2">
              <BulletList items={fb.positioning_recommendations!} />
            </div>
          </div>
        ) : null}
        <LegacyDisclosures defs={LEGACY_IMPROVEMENT_DEFS} fb={fb} />
        {!hasImprovements ? (
          <EmptySectionHint text="No improvement items in this response—try running the strategist again with fuller resume and job text." />
        ) : null}
      </StrategistSection>

      <details className="rounded-lg border border-neutral-200 bg-neutral-50/50 open:bg-white dark:border-neutral-800 dark:bg-neutral-900/30 dark:open:bg-neutral-950">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-neutral-900 marker:content-none dark:text-neutral-50 [&::-webkit-details-marker]:hidden">
          Model confidence <span className="font-normal text-neutral-500 dark:text-neutral-400">(optional)</span>
        </summary>
        <div className="border-t border-neutral-200 px-5 pb-5 dark:border-neutral-800">
          <p className="pt-4 text-xs text-neutral-500">Per-section fit of this advice to your materials (not a hire prediction).</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="w-full max-w-xs sm:shrink-0 sm:ml-auto">
              <ConfidenceMeter label="Overall" value={detail.overall_confidence} />
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {CONF_LABELS.map(({ key, title }) => (
              <ConfidenceMeter key={key} label={title} value={conf[key]} />
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}
