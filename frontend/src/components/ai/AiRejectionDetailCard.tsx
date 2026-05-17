import type { AiRejectionAnalysisDetail, AiRejectionStructuredFeedback } from '@/api/aiRejection.api'
import { FeedbackDisclosure } from '@/components/ai/FeedbackDisclosure'
import { ResumeStrategistPanel } from '@/components/ai/ResumeStrategistPanel'
import { Card } from '@/components/ui/Card'

const LEGACY_SECTION_DEFS: { key: keyof AiRejectionStructuredFeedback; title: string; subtitle?: string }[] = [
  {
    key: 'possible_rejection_factors',
    title: 'Possible rejection factors',
    subtitle: 'What a busy recruiter might mentally flag before a phone screen.',
  },
  { key: 'missing_skills', title: 'Missing skills & stack gaps', subtitle: 'Grounded in the job vs. resume comparison.' },
  { key: 'resume_weaknesses', title: 'Resume weaknesses', subtitle: 'Clarity, depth, and positioning—not personal judgments.' },
  { key: 'keyword_deficiencies', title: 'Keyword & language gaps', subtitle: 'Posting language vs. how your resume reads today.' },
  { key: 'experience_mismatch_notes', title: 'Experience alignment', subtitle: 'Seniority, scope, and tenure heuristics.' },
  { key: 'project_alignment_notes', title: 'Project alignment', subtitle: 'Whether your work examples feel on-brief for the role.' },
  { key: 'formatting_readability_notes', title: 'Formatting & readability', subtitle: 'Only flagged when structure is evident in the text.' },
  { key: 'strong_areas', title: 'Strong areas', subtitle: 'Signals that would keep you in consideration.' },
  { key: 'suggested_improvements', title: 'Suggested improvements', subtitle: 'Concrete edits and experiments to try.' },
  { key: 'recommended_next_steps', title: 'Recommended next steps', subtitle: 'A tight plan for the next iteration.' },
]

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">No items for this section.</p>
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

function isStrategistFeedback(fb: AiRejectionStructuredFeedback) {
  return (
    (Array.isArray(fb.prioritized_improvements) && fb.prioritized_improvements.length > 0) ||
    (Array.isArray(fb.bullet_rewrites) && fb.bullet_rewrites.length > 0) ||
    (Array.isArray(fb.recruiter_observations) && fb.recruiter_observations.length > 0)
  )
}

function LegacyAiDetailCard({ fb }: { fb: AiRejectionStructuredFeedback }) {
  const summary = fb.executive_summary?.trim()

  return (
    <div className="space-y-5">
      {summary ? (
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Executive read</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">{summary}</p>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Structured feedback</p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Expand sections to review recruiter-style notes. Content is generated from your materials—verify before acting.
          </p>
        </div>
        <div className="px-5">
          {LEGACY_SECTION_DEFS.map(({ key, title, subtitle }) => {
            const items = (fb[key] as string[] | undefined) ?? []
            return (
              <FeedbackDisclosure key={key} title={title} subtitle={subtitle}>
                <BulletList items={items} />
              </FeedbackDisclosure>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export function AiRejectionDetailCard({ detail }: { detail: AiRejectionAnalysisDetail }) {
  const fb = (detail.structured_feedback || {}) as AiRejectionStructuredFeedback

  if (detail.status === 'failed') {
    return (
      <Card className="border-amber-200/80 bg-amber-50/40 p-5 dark:border-amber-900/50 dark:bg-amber-950/25">
        <p className="text-sm font-medium text-amber-950 dark:text-amber-100">AI run did not complete</p>
        <p className="mt-2 text-sm text-amber-900/90 dark:text-amber-200/90">{detail.error_message ?? 'Unknown error.'}</p>
      </Card>
    )
  }

  if (detail.status === 'pending' || detail.status === 'processing') {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <p className="pt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Generating resume strategist feedback—typically under a minute. This page will update automatically.
          </p>
        </div>
      </Card>
    )
  }

  const strategist = isStrategistFeedback(fb)

  return (
    <div className="space-y-5">
      {strategist ? <ResumeStrategistPanel fb={fb} /> : <LegacyAiDetailCard fb={fb} />}

      {detail.model_id ? (
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Model: {detail.model_id}</p>
      ) : null}
    </div>
  )
}
