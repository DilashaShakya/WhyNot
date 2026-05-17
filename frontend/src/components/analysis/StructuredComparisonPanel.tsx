import type { ExperienceAlignment, KeywordOverlap, SkillRow } from '@/api/types'
import { SkillListCard } from '@/components/analysis/SkillListCard'
import { Card } from '@/components/ui/Card'
import type { SemanticLayer } from '@/lib/analytics/semanticLayer'

type StructuredComparisonPanelProps = {
  matching: SkillRow[]
  missing: SkillRow[]
  extras: SkillRow[]
  overlap: KeywordOverlap
  alignment: ExperienceAlignment
  /** Optional embedding-based scores when analysis included semantic layer. */
  semanticLayer?: SemanticLayer | null
}

export function StructuredComparisonPanel({
  matching,
  missing,
  extras,
  overlap,
  alignment,
  semanticLayer = null,
}: StructuredComparisonPanelProps) {
  const semanticDoc =
    semanticLayer?.status === 'active' && typeof semanticLayer.semantic_document_score === 'number'
      ? semanticLayer.semantic_document_score
      : null
  const blended =
    semanticLayer?.status === 'active' && typeof semanticLayer.blended_fit_score === 'number'
      ? semanticLayer.blended_fit_score
      : null

  return (
    <div className="space-y-5">
      <Card className="border-neutral-200 p-5 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Fit snapshot</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          <span className="font-medium text-neutral-900 dark:text-neutral-50">{matching.length}</span> curated skills
          overlap this posting;{' '}
          <span className="font-medium text-neutral-900 dark:text-neutral-50">{missing.length}</span> appear in the job
          but are not evident from the parsed resume. Keyword coverage (job terms mirrored on the resume) is about{' '}
          <span className="font-medium text-neutral-900 dark:text-neutral-50">
            {Math.round(overlap.coverage_percent)}%
          </span>{' '}
          <span className="text-neutral-500 dark:text-neutral-400">
            ({overlap.matched_term_count} of {overlap.job_term_count} distilled terms)
          </span>
          . Experience heuristic score:{' '}
          <span className="font-medium text-neutral-900 dark:text-neutral-50">{alignment.score}</span>/100.
          {semanticDoc != null ? (
            <>
              {' '}
              Embedding similarity (when enabled):{' '}
              <span className="font-medium text-neutral-900 dark:text-neutral-50">{semanticDoc}</span>/100
              {blended != null ? (
                <>
                  , blended fit <span className="font-medium text-neutral-900 dark:text-neutral-50">{blended}</span>/100
                </>
              ) : null}
              .
            </>
          ) : null}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkillListCard
          tone="positive"
          title="Matching skills"
          subtitle="Shared signals between your resume and the posting."
          skills={matching}
          emptyText="No overlapping skills detected with the current lexicon—try richer job or resume copy."
        />
        <SkillListCard
          tone="muted"
          title="Skill gaps"
          subtitle="Job asks for these; they are absent from the parsed resume."
          skills={missing}
          emptyText="No explicit gaps surfaced—great alignment on the curated skill list."
        />
      </div>

      {extras.length > 0 ? (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Extra resume signals</h3>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {extras.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Present on your resume but not emphasized in the job text—useful for positioning and follow-ups.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {extras.map((s) => (
              <li
                key={s.slug}
                className="rounded-md border border-dashed border-neutral-200 bg-[var(--color-surface)] px-2.5 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
              >
                {s.label}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Keyword overlap</h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Non-stopword terms ≥4 characters. Coverage is matched ÷ job terms (plain numbers—no charts).
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-50">Vs. job description:</span>{' '}
              {overlap.coverage_percent.toFixed(0)}% — {overlap.matched_term_count} of {overlap.job_term_count} distilled
              job terms also appear in your resume.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-50">Vs. resume:</span>{' '}
              {overlap.resume_keyword_coverage_percent.toFixed(0)}% of distilled resume keywords overlap the job text.
            </li>
          </ul>
          {overlap.matched_terms_sample.length > 0 ? (
            <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">Sample overlap</p>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                {overlap.matched_terms_sample.join(', ')}
              </p>
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Experience alignment</h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Lightweight heuristics over years and seniority language—not a verdict on fit.
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold tabular-nums text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">
              {alignment.score}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {(alignment.signals ?? []).length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No strong year or seniority signals detected in either document.
              </p>
            ) : (
              (alignment.signals ?? []).map((s, idx) => (
                <div
                  key={`${s.kind}-${idx}`}
                  className="rounded-md border border-neutral-200 bg-[var(--color-surface)] px-3 py-2 text-sm text-neutral-800 dark:border-neutral-800 dark:text-neutral-100"
                >
                  {s.message}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
