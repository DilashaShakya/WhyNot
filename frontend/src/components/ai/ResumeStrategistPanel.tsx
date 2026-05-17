import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  AiRejectionStructuredFeedback,
  BulletRewriteItem,
  ContextualMissingSkill,
  ImpactMetricsGap,
  PrioritizedImprovement,
} from '@/api/aiRejection.api'
import { FeedbackDisclosure, type FeedbackTone } from '@/components/ai/FeedbackDisclosure'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

type SectionId = 'overview' | 'strengths' | 'weaknesses' | 'improvements'

const SECTION_THEME: Record<
  SectionId,
  {
    tone: FeedbackTone
    dot: string
    navActive: string
    navIdle: string
    badgeActive: string
    badgeIdle: string
    panelHeader: string
    panelBorder: string
    listMarker: string
  }
> = {
  overview: {
    tone: 'sky',
    dot: 'bg-sky-400',
    navActive: 'bg-sky-600 text-white shadow-sm dark:bg-sky-500',
    navIdle:
      'border-sky-100 bg-sky-50/60 text-sky-900 hover:bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:bg-sky-950/50 lg:border-0 lg:bg-transparent',
    badgeActive: 'bg-white/25 text-white',
    badgeIdle: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    panelHeader: 'border-sky-100/80 bg-gradient-to-r from-sky-50/90 to-transparent dark:border-sky-900/40 dark:from-sky-950/35',
    panelBorder: 'border-sky-100 dark:border-sky-900/35',
    listMarker: 'bg-sky-300 dark:bg-sky-600',
  },
  strengths: {
    tone: 'emerald',
    dot: 'bg-emerald-400',
    navActive: 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500',
    navIdle:
      'border-emerald-100 bg-emerald-50/60 text-emerald-900 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50 lg:border-0 lg:bg-transparent',
    badgeActive: 'bg-white/25 text-white',
    badgeIdle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    panelHeader:
      'border-emerald-100/80 bg-gradient-to-r from-emerald-50/90 to-transparent dark:border-emerald-900/40 dark:from-emerald-950/35',
    panelBorder: 'border-emerald-100 dark:border-emerald-900/35',
    listMarker: 'bg-emerald-300 dark:bg-emerald-600',
  },
  weaknesses: {
    tone: 'amber',
    dot: 'bg-amber-400',
    navActive: 'bg-amber-600 text-white shadow-sm dark:bg-amber-500',
    navIdle:
      'border-amber-100 bg-amber-50/60 text-amber-950 hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50 lg:border-0 lg:bg-transparent',
    badgeActive: 'bg-white/25 text-white',
    badgeIdle: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    panelHeader:
      'border-amber-100/80 bg-gradient-to-r from-amber-50/90 to-transparent dark:border-amber-900/40 dark:from-amber-950/35',
    panelBorder: 'border-amber-100 dark:border-amber-900/35',
    listMarker: 'bg-amber-300 dark:bg-amber-600',
  },
  improvements: {
    tone: 'violet',
    dot: 'bg-violet-400',
    navActive: 'bg-violet-600 text-white shadow-sm dark:bg-violet-500',
    navIdle:
      'border-violet-100 bg-violet-50/60 text-violet-900 hover:bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200 dark:hover:bg-violet-950/50 lg:border-0 lg:bg-transparent',
    badgeActive: 'bg-white/25 text-white',
    badgeIdle: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    panelHeader:
      'border-violet-100/80 bg-gradient-to-r from-violet-50/90 to-transparent dark:border-violet-900/40 dark:from-violet-950/35',
    panelBorder: 'border-violet-100 dark:border-violet-900/35',
    listMarker: 'bg-violet-300 dark:bg-violet-600',
  },
}

const PRIORITY_DOT: Record<PrioritizedImprovement['priority'], string> = {
  high: 'bg-rose-500 dark:bg-rose-400',
  medium: 'bg-amber-500 dark:bg-amber-400',
  low: 'bg-neutral-300 dark:bg-neutral-600',
}

function Checklist({ items }: { items: PrioritizedImprovement[] }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">No prioritized items returned—try re-running with a fuller resume.</p>
  }
  return (
    <ol className="space-y-4">
      {items.map((it, i) => (
        <li
          key={`${it.title}-${i}`}
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
        </li>
      ))}
    </ol>
  )
}

function BulletRewriteDisclosure({ item, index }: { item: BulletRewriteItem; index: number }) {
  const preview =
    item.original_bullet.length > 72 ? `${item.original_bullet.slice(0, 72).trim()}…` : item.original_bullet

  return (
    <FeedbackDisclosure title={`Rewrite ${index + 1}`} subtitle={preview} tone="violet">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/25">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600/80 dark:text-rose-400/90">Before</p>
          <p className="mt-2 break-words text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
            {item.original_bullet}
          </p>
          {item.weakness_tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.weakness_tags.map((t) => (
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
        <div className="min-w-0 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/25">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-400/90">
            Suggested rewrite
          </p>
          <p className="mt-2 break-words text-sm font-medium leading-relaxed text-neutral-900 dark:text-neutral-50">
            {item.improved_bullet}
          </p>
          {item.why_stronger ? (
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{item.why_stronger}</p>
          ) : null}
        </div>
      </div>
    </FeedbackDisclosure>
  )
}

function ContextSkillDisclosure({ row }: { row: ContextualMissingSkill }) {
  return (
    <FeedbackDisclosure title={row.skill_or_term} subtitle="Why it matters for this role" tone="amber">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Why it matters</dt>
          <dd className="mt-0.5 text-neutral-700 dark:text-neutral-300">{row.why_it_matters}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">In the posting</dt>
          <dd className="mt-0.5 text-neutral-700 dark:text-neutral-300">{row.where_in_job_posting}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Transferable angle</dt>
          <dd className="mt-0.5 text-neutral-700 dark:text-neutral-300">{row.transferable_angle}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">How to surface</dt>
          <dd className="mt-0.5 text-neutral-700 dark:text-neutral-300">{row.how_to_surface}</dd>
        </div>
      </dl>
    </FeedbackDisclosure>
  )
}

type LegacySectionDef = { key: keyof AiRejectionStructuredFeedback; title: string; subtitle?: string }

const LEGACY_STRENGTH_DEFS: LegacySectionDef[] = [
  { key: 'strong_areas', title: 'Additional strengths', subtitle: 'From extended analysis fields.' },
]

const LEGACY_WEAKNESS_DEFS: LegacySectionDef[] = [
  { key: 'possible_rejection_factors', title: 'Screening risks', subtitle: 'What a busy recruiter might flag.' },
  { key: 'missing_skills', title: 'Skill gaps', subtitle: 'Technologies or areas the role expects but the resume lacks.' },
  { key: 'resume_weaknesses', title: 'Clarity & depth' },
  { key: 'keyword_deficiencies', title: 'Missing keywords', subtitle: 'Posting language vs. how the resume reads today.' },
  { key: 'company_culture_notes', title: 'Company culture fit', subtitle: 'Culture signals in the posting.' },
  { key: 'experience_mismatch_notes', title: 'Scope & seniority' },
  { key: 'project_alignment_notes', title: 'Project alignment' },
  { key: 'formatting_readability_notes', title: 'Structure & readability' },
]

const LEGACY_IMPROVEMENT_DEFS: LegacySectionDef[] = [
  { key: 'suggested_improvements', title: 'Extra suggestions' },
  { key: 'recommended_next_steps', title: 'Next steps' },
]

function LegacyDisclosures({
  defs,
  fb,
  tone,
  listMarker,
}: {
  defs: LegacySectionDef[]
  fb: AiRejectionStructuredFeedback
  tone: FeedbackTone
  listMarker: string
}) {
  const rows = defs
    .map(({ key, title, subtitle }) => {
      const items = (fb[key] as string[] | undefined) ?? []
      if (!items.length) return null
      return (
        <FeedbackDisclosure key={String(key)} title={title} subtitle={subtitle} tone={tone}>
          <BulletList items={items} markerClass={listMarker} />
        </FeedbackDisclosure>
      )
    })
    .filter(Boolean)
  if (!rows.length) return null
  return <div className="space-y-0">{rows}</div>
}

function BulletList({ items, markerClass }: { items: string[]; markerClass?: string }) {
  if (!items.length) return <p className="text-sm text-neutral-500">No items.</p>
  const marker = markerClass ?? 'bg-neutral-300 dark:bg-neutral-600'
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span className={cn('mt-2 h-1 w-1 shrink-0 rounded-full', marker)} aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

function SectionNav({
  sections,
  active,
  onSelect,
}: {
  sections: { id: SectionId; label: string; count: number }[]
  active: SectionId
  onSelect: (id: SectionId) => void
}) {
  return (
    <nav
      aria-label="Feedback sections"
      className="flex min-w-max flex-row gap-2 lg:min-w-0 lg:flex-col lg:gap-1"
    >
      <p className="mb-2 hidden px-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 lg:block">
        Explore
      </p>
      {sections.map((s) => {
        const isActive = s.id === active
        const theme = SECTION_THEME[s.id]
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              'flex shrink-0 items-center justify-between gap-2 rounded-full border px-3.5 py-2 text-left text-sm transition-colors lg:w-full lg:rounded-lg lg:border-0 lg:px-3 lg:py-2.5',
              isActive ? cn('font-medium', theme.navActive) : theme.navIdle,
            )}
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span
                className={cn('h-1.5 w-1.5 shrink-0 rounded-full', theme.dot, isActive && 'ring-2 ring-white/40')}
                aria-hidden
              />
              {s.label}
            </span>
            {s.count > 0 ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                  isActive ? theme.badgeActive : theme.badgeIdle,
                )}
              >
                {s.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}

function PanelShell({
  title,
  subtitle,
  children,
  tone,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  tone: SectionId
}) {
  const theme = SECTION_THEME[tone]
  return (
    <Card className={cn('overflow-hidden p-0', theme.panelBorder)}>
      <div className={cn('border-b px-5 py-4', theme.panelHeader)}>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
      </div>
      <div className="px-5 py-2">{children}</div>
    </Card>
  )
}

export function ResumeStrategistPanel({ fb }: { fb: AiRejectionStructuredFeedback }) {
  const summary = fb.executive_summary?.trim()
  const strengthsResume = fb.resume_strengths?.length ?? 0
  const weaknessesRecruiter = fb.recruiter_observations?.length ?? 0
  const weaknessesContext = fb.contextual_missing_skills?.length ?? 0
  const weaknessesImpact = fb.impact_metrics_gaps?.length ?? 0
  const improvementsBullets = fb.bullet_rewrites?.length ?? 0
  const improvementsPriority = fb.prioritized_improvements?.length ?? 0
  const improvementsPosition = fb.positioning_recommendations?.length ?? 0

  const strengthLegacyCount = LEGACY_STRENGTH_DEFS.reduce(
    (n, d) => n + ((fb[d.key] as string[] | undefined)?.length ?? 0),
    0,
  )
  const weaknessLegacyCount = LEGACY_WEAKNESS_DEFS.reduce(
    (n, d) => n + ((fb[d.key] as string[] | undefined)?.length ?? 0),
    0,
  )
  const improveLegacyCount = LEGACY_IMPROVEMENT_DEFS.reduce(
    (n, d) => n + ((fb[d.key] as string[] | undefined)?.length ?? 0),
    0,
  )

  const strengthsCount = strengthsResume + (strengthLegacyCount > 0 ? 1 : 0)
  const weaknessesCount =
    weaknessesRecruiter + weaknessesContext + weaknessesImpact + (weaknessLegacyCount > 0 ? 1 : 0)
  const improvementsCount =
    improvementsBullets + improvementsPriority + improvementsPosition + (improveLegacyCount > 0 ? 1 : 0)

  const sections = useMemo(() => {
    const list: { id: SectionId; label: string; count: number }[] = []
    if (summary) list.push({ id: 'overview', label: 'Overview', count: 1 })
    if (strengthsCount > 0 || strengthsResume > 0) list.push({ id: 'strengths', label: 'Strengths', count: strengthsCount })
    if (weaknessesCount > 0)
      list.push({ id: 'weaknesses', label: 'Weaknesses', count: weaknessesCount })
    if (improvementsCount > 0)
      list.push({ id: 'improvements', label: 'Improvements', count: improvementsCount })
    return list
  }, [summary, strengthsCount, weaknessesCount, improvementsCount, strengthsResume])

  const defaultSection = sections[0]?.id ?? 'overview'
  const [active, setActive] = useState<SectionId>(defaultSection)

  useEffect(() => {
    if (!sections.some((s) => s.id === active)) {
      setActive(defaultSection)
    }
  }, [active, defaultSection, sections])

  const activeSafe = sections.some((s) => s.id === active) ? active : defaultSection

  if (!sections.length) {
    return <p className="text-sm text-neutral-500">No structured feedback yet—run analysis to see strategist output.</p>
  }

  return (
    <div className="relative space-y-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-4 h-28 w-28 rounded-full bg-violet-200/35 blur-3xl dark:bg-violet-800/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-2 bottom-24 h-20 w-20 rounded-full bg-sky-200/30 blur-2xl dark:bg-sky-800/10"
      />

      <p className="relative rounded-lg border border-violet-100/90 bg-violet-50/50 px-3 py-2 text-xs text-violet-900/90 dark:border-violet-900/40 dark:bg-violet-950/25 dark:text-violet-200/90">
        Pick a topic on the left. Details stay folded until you expand them.
      </p>

      <div className="relative flex flex-col gap-4 lg:flex-row lg:gap-6">
        <aside className="lg:sticky lg:top-4 lg:w-44 lg:shrink-0 lg:self-start">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
            <SectionNav sections={sections} active={activeSafe} onSelect={setActive} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {activeSafe === 'overview' && summary ? (
            <Card className="relative overflow-hidden border-sky-100 bg-sky-50/40 p-5 dark:border-sky-900/40 dark:bg-sky-950/20">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-4 top-0 h-16 w-16 rounded-full bg-sky-200/50 blur-2xl dark:bg-sky-700/20"
              />
              <p className="relative text-xs font-semibold uppercase tracking-wide text-sky-700/80 dark:text-sky-400/90">
                Strategic read
              </p>
              <p className="relative mt-3 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">{summary}</p>
            </Card>
          ) : null}

          {activeSafe === 'strengths' ? (
            <PanelShell
              tone="strengths"
              title="Strengths"
              subtitle="What already supports your fit—lean on these when you edit."
            >
              {strengthsResume > 0 ? (
                <FeedbackDisclosure
                  tone="emerald"
                  title="Resume highlights"
                  subtitle={`${strengthsResume} signal${strengthsResume === 1 ? '' : 's'} flagged`}
                >
                  <BulletList items={fb.resume_strengths!} markerClass={SECTION_THEME.strengths.listMarker} />
                </FeedbackDisclosure>
              ) : null}
              <LegacyDisclosures
                defs={LEGACY_STRENGTH_DEFS}
                fb={fb}
                tone="emerald"
                listMarker={SECTION_THEME.strengths.listMarker}
              />
              {strengthsResume === 0 && strengthLegacyCount === 0 ? (
                <p className="py-4 text-sm text-neutral-500">No strengths listed for this run.</p>
              ) : null}
            </PanelShell>
          ) : null}

          {activeSafe === 'weaknesses' ? (
            <PanelShell
              tone="weaknesses"
              title="Weaknesses"
              subtitle="Gaps and friction—open only what you want to dig into."
            >
              {weaknessesRecruiter > 0 ? (
                <FeedbackDisclosure
                  tone="amber"
                  title="Screener-style observations"
                  subtitle={`${weaknessesRecruiter} note${weaknessesRecruiter === 1 ? '' : 's'}`}
                >
                  <BulletList items={fb.recruiter_observations!} markerClass={SECTION_THEME.weaknesses.listMarker} />
                </FeedbackDisclosure>
              ) : null}
              {weaknessesContext > 0
                ? (fb.contextual_missing_skills as ContextualMissingSkill[]).map((row, i) => (
                    <ContextSkillDisclosure key={`${row.skill_or_term}-${i}`} row={row} />
                  ))
                : null}
              {weaknessesImpact > 0 ? (
                <FeedbackDisclosure
                  tone="amber"
                  title="Impact & metrics gaps"
                  subtitle={`${weaknessesImpact} area${weaknessesImpact === 1 ? '' : 's'}`}
                >
                  <ul className="space-y-3">
                    {(fb.impact_metrics_gaps as ImpactMetricsGap[]).map((x, i) => (
                      <li key={i} className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {x.resume_excerpt ? (
                          <p className="rounded border border-amber-100 bg-amber-50/60 px-2 py-1 font-medium text-neutral-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-neutral-200">
                            “{x.resume_excerpt}”
                          </p>
                        ) : null}
                        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">Gap:</span> {x.gap}
                        </p>
                        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">Direction:</span>{' '}
                          {x.suggested_direction}
                        </p>
                      </li>
                    ))}
                  </ul>
                </FeedbackDisclosure>
              ) : null}
              <LegacyDisclosures
                defs={LEGACY_WEAKNESS_DEFS}
                fb={fb}
                tone="amber"
                listMarker={SECTION_THEME.weaknesses.listMarker}
              />
            </PanelShell>
          ) : null}

          {activeSafe === 'improvements' ? (
            <PanelShell
              tone="improvements"
              title="Improvements"
              subtitle="Actionable rewrites and next steps—expand one at a time."
            >
              {improvementsBullets > 0
                ? (fb.bullet_rewrites as BulletRewriteItem[]).map((b, i) => (
                    <BulletRewriteDisclosure key={i} item={b} index={i} />
                  ))
                : null}
              {improvementsPriority > 0 ? (
                <FeedbackDisclosure
                  tone="violet"
                  title="Prioritized checklist"
                  subtitle={`${improvementsPriority} action${improvementsPriority === 1 ? '' : 's'}—work top down`}
                >
                  <Checklist items={fb.prioritized_improvements as PrioritizedImprovement[]} />
                </FeedbackDisclosure>
              ) : null}
              {improvementsPosition > 0 ? (
                <FeedbackDisclosure
                  tone="violet"
                  title="Positioning & structure"
                  subtitle={`${improvementsPosition} recommendation${improvementsPosition === 1 ? '' : 's'}`}
                >
                  <BulletList
                    items={fb.positioning_recommendations!}
                    markerClass={SECTION_THEME.improvements.listMarker}
                  />
                </FeedbackDisclosure>
              ) : null}
              <LegacyDisclosures
                defs={LEGACY_IMPROVEMENT_DEFS}
                fb={fb}
                tone="violet"
                listMarker={SECTION_THEME.improvements.listMarker}
              />
            </PanelShell>
          ) : null}
        </div>
      </div>
    </div>
  )
}
