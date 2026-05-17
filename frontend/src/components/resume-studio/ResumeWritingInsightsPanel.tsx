import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import type { InsightStatus, MatchInsightItem, ResumeWritingInsightsResult } from '@/api/resumeStudio.api'

function PanelCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

const STATUS_ORDER: Record<InsightStatus, number> = {
  critical_gap: 0,
  moderate_gap: 1,
  strong_match: 2,
}

function rowSurface(status: InsightStatus): string {
  switch (status) {
    case 'critical_gap':
      return 'border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/35'
    case 'moderate_gap':
      return 'border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/25'
    default:
      return 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/25'
  }
}

function statusLabel(status: InsightStatus): string {
  switch (status) {
    case 'critical_gap':
      return 'Critical gap'
    case 'moderate_gap':
      return 'Moderate gap'
    default:
      return 'Strong match'
  }
}

function statusGlyph(status: InsightStatus): string {
  switch (status) {
    case 'critical_gap':
      return '!'
    case 'moderate_gap':
      return '▲'
    default:
      return '✓'
  }
}

type SortMode = 'importance' | 'status'

export function ResumeWritingInsightsPanel({
  loading,
  result,
  hasTargetJob,
  onDismiss,
}: {
  loading: boolean
  result: ResumeWritingInsightsResult | null
  hasTargetJob: boolean
  onDismiss: () => void
}) {
  const [sortMode, setSortMode] = useState<SortMode>('importance')
  const [openRank, setOpenRank] = useState<number | null>(null)

  const items = useMemo(() => {
    const raw = result?.match_items ?? []
    const copy = [...raw]
    if (sortMode === 'importance') {
      copy.sort((a, b) => a.importance_rank - b.importance_rank || a.rank - b.rank)
    } else {
      copy.sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          a.importance_rank - b.importance_rank ||
          a.rank - b.rank,
      )
    }
    return copy
  }, [result, sortMode])

  if (!loading && !result) return null

  if (loading) {
    return (
      <PanelCard>
        <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          <Spinner className="h-5 w-5 shrink-0" />
          Scoring your resume against expectations (this can take a minute)…
        </div>
      </PanelCard>
    )
  }

  const r = result!
  const summary = r.summary ?? {
    critical_gaps: 0,
    moderate_gaps: 0,
    strong_matches: 0,
  }

  const hasRows = items.length > 0

  return (
    <PanelCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Top requirements &amp; your matches
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {hasTargetJob
              ? 'Rows are grounded in your selected job posting where possible.'
              : 'Rows score resume quality and common hire expectations—select a target job for posting-specific alignment.'}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => {
              setSortMode('importance')
              setOpenRank(null)
            }}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              sortMode === 'importance'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            )}
          >
            By importance
          </button>
          <button
            type="button"
            onClick={() => {
              setSortMode('status')
              setOpenRank(null)
            }}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              sortMode === 'status'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            )}
          >
            By status
          </button>
        </div>
      </div>

      {r.overview?.trim() ? (
        <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{r.overview}</p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-rose-200 bg-rose-50/90 px-3 py-3 dark:border-rose-900/45 dark:bg-rose-950/40">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-200 text-sm font-bold text-rose-800 dark:bg-rose-900 dark:text-rose-100">
              !
            </span>
            <div>
              <p className="text-sm font-semibold text-rose-950 dark:text-rose-100">
                {summary.critical_gaps} Critical {summary.critical_gaps === 1 ? 'gap' : 'gaps'}
              </p>
              <p className="text-[11px] text-rose-800/90 dark:text-rose-200/90">Missing from your resume</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-3 dark:border-amber-900/45 dark:bg-amber-950/40">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-100">
              ▲
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                {summary.moderate_gaps} Moderate {summary.moderate_gaps === 1 ? 'gap' : 'gaps'}
              </p>
              <p className="text-[11px] text-amber-900/85 dark:text-amber-200/85">Could be strengthened</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-3 dark:border-emerald-900/45 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
              ✓
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                {summary.strong_matches} Strong {summary.strong_matches === 1 ? 'match' : 'matches'}
              </p>
              <p className="text-[11px] text-emerald-900/85 dark:text-emerald-200/85">Already aligned</p>
            </div>
          </div>
        </div>
      </div>

      {!hasRows ? (
        <p className="mt-4 text-sm text-neutral-500">
          No scored rows returned. Confirm OPENAI_API_KEY on the API and try again.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <InsightRow
              key={`${item.rank}-${item.title}`}
              item={item}
              expanded={openRank === item.rank}
              onToggle={() => setOpenRank((v) => (v === item.rank ? null : item.rank))}
            />
          ))}
        </ul>
      )}

      {r.cross_cutting?.length ? (
        <div className="mt-5 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Across the resume</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-neutral-600 dark:text-neutral-400">
            {r.cross_cutting.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {r.ats_readability_notes?.length ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">ATS &amp; scannability</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-neutral-600 dark:text-neutral-400">
            {r.ats_readability_notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {r.section_notes?.length ? (
        <div className="mt-5 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">By section</p>
          <ul className="mt-2 space-y-2">
            {r.section_notes.map((sn, i) => (
              <li
                key={`${sn.section_heading}-${i}`}
                className="rounded-md border border-neutral-200 px-3 py-2 text-xs dark:border-neutral-700"
              >
                <p className="font-medium text-neutral-800 dark:text-neutral-200">{sn.section_heading}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-neutral-600 dark:text-neutral-400">
                  {sn.insights.map((line, j) => (
                    <li key={`${i}-${j}`}>{line}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </PanelCard>
  )
}

function InsightRow({
  item,
  expanded,
  onToggle,
}: {
  item: MatchInsightItem
  expanded: boolean
  onToggle: () => void
}) {
  const rw = item.rewrite_section

  return (
    <li>
      <div
        className={cn(
          'overflow-hidden rounded-xl border shadow-sm transition-shadow',
          rowSurface(item.status),
          expanded && 'ring-1 ring-neutral-400/30 dark:ring-neutral-600/40',
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-stretch gap-3 px-3 py-3 text-left transition-colors hover:bg-white/40 dark:hover:bg-white/5"
        >
          <span className="flex w-8 shrink-0 flex-col items-center justify-start pt-0.5">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{item.rank}</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{item.title}</p>
                <p className="mt-0.5 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                  {item.description}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  {statusLabel(item.status)}{' '}
                  <span className="font-normal normal-case text-neutral-400">· {statusGlyph(item.status)}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    {item.points_earned}/{item.points_possible} pt
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Impact points</p>
                </div>
                <span
                  className={cn(
                    'text-neutral-400 transition-transform dark:text-neutral-500',
                    expanded && 'rotate-90',
                  )}
                  aria-hidden
                >
                  ›
                </span>
              </div>
            </div>
          </div>
        </button>

        {expanded ? (
          <div className="space-y-3 border-t border-black/5 bg-white/60 px-3 py-3 text-sm dark:border-white/10 dark:bg-neutral-950/40">
            {item.resume_evidence?.trim() ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Resume evidence</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {item.resume_evidence}
                </p>
              </div>
            ) : null}
            {item.coaching?.trim() ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Why this score</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">{item.coaching}</p>
              </div>
            ) : null}
            {rw ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900/50">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                  {rw.headline || 'Rewrite'}
                </p>
                {rw.bullets?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {rw.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
                {rw.example_snippets?.length ? (
                  <div className="mt-3 space-y-2">
                    {rw.example_snippets.map((sn) => (
                      <div
                        key={`${sn.label}-${sn.text.slice(0, 24)}`}
                        className="rounded-md border border-neutral-200 bg-white px-2 py-2 dark:border-neutral-600 dark:bg-neutral-950"
                      >
                        <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-200">{sn.label}</p>
                        <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                          {sn.text}
                        </pre>
                        <button
                          type="button"
                          className="mt-2 text-[11px] font-medium text-violet-700 underline underline-offset-2 dark:text-violet-400"
                          onClick={(e) => {
                            e.stopPropagation()
                            void navigator.clipboard.writeText(sn.text)
                          }}
                        >
                          Copy snippet
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  )
}
