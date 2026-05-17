import type { ExperienceAlignment, KeywordOverlap, SkillRow } from '@/api/types'
import type { SemanticLayer } from '@/lib/analytics/semanticLayer'

/** Minimal shape for dashboard analytics (persisted structured_feedback payloads). */
export type AnalyticsStructuredComparison = {
  matching_skills: SkillRow[]
  missing_skills: SkillRow[]
  extra_resume_skills?: SkillRow[]
  keyword_overlap: KeywordOverlap
  experience_alignment: ExperienceAlignment
  resume_skill_count?: number
}

/** Recharts radar row shape */
export type RadarAxisRow = {
  subject: string
  A: number
  fullMark: number
}

const STOPWORDS = new Set([
  'that',
  'this',
  'with',
  'from',
  'your',
  'will',
  'have',
  'been',
  'were',
  'they',
  'their',
  'what',
  'when',
  'where',
  'which',
  'about',
  'into',
  'than',
  'then',
  'more',
  'some',
  'such',
  'only',
  'just',
  'also',
  'very',
  'work',
  'team',
  'role',
  'years',
  'year',
  'looking',
  'seeking',
])

export function buildAlignmentRadar(
  comparison: AnalyticsStructuredComparison,
  semantic?: SemanticLayer | null,
): RadarAxisRow[] {
  const match = comparison.matching_skills.length
  const miss = comparison.missing_skills.length
  const total = match + miss
  const lexicalSkill = total === 0 ? 55 : Math.round((match / total) * 100)
  const skillScore =
    semantic?.status === 'active' && typeof semantic.semantic_skill_alignment_score === 'number'
      ? Math.max(lexicalSkill, Math.round(semantic.semantic_skill_alignment_score))
      : lexicalSkill

  const kwLex = Math.min(100, Math.round(comparison.keyword_overlap.coverage_percent))
  const kw =
    semantic?.status === 'active' && typeof semantic.semantic_document_score === 'number'
      ? Math.min(100, Math.round(kwLex * 0.42 + semantic.semantic_document_score * 0.58))
      : kwLex

  const expBase = Math.min(100, Math.round(comparison.experience_alignment.score))
  const exp =
    semantic?.status === 'active' && typeof semantic.best_chunk_score === 'number'
      ? Math.min(100, Math.round(expBase * 0.65 + semantic.best_chunk_score * 0.35))
      : expBase

  const extras = comparison.extra_resume_skills?.length ?? 0
  const depthSignal = Math.min(100, Math.round(35 + extras * 9 + (comparison.resume_skill_count ?? 0) * 2))

  return [
    { subject: 'Skill match', A: skillScore, fullMark: 100 },
    { subject: 'Keyword fit', A: kw, fullMark: 100 },
    { subject: 'Experience fit', A: exp, fullMark: 100 },
    { subject: 'Signal depth', A: depthSignal, fullMark: 100 },
  ]
}

export function computeMatchConfidence(
  comparison: AnalyticsStructuredComparison,
  semantic?: SemanticLayer | null,
): number {
  if (semantic?.status === 'active' && typeof semantic.blended_fit_score === 'number') {
    return Math.round(semantic.blended_fit_score)
  }
  const rows = buildAlignmentRadar(comparison, semantic)
  const avg = rows.reduce((s, r) => s + r.A, 0) / rows.length
  return Math.round(avg)
}

/** Mini radar from list summary when full comparison is unavailable */
export function buildRadarFromSummary(params: {
  matching: number
  missing: number
  overlapPercent: number
  alignment?: number
}): RadarAxisRow[] {
  const { matching, missing, overlapPercent, alignment } = params
  const total = matching + missing
  const skill = total === 0 ? 50 : Math.round((matching / total) * 100)
  const kw = Math.min(100, Math.round(overlapPercent))
  const exp = typeof alignment === 'number' ? Math.min(100, Math.round(alignment)) : 58
  const balance = Math.min(100, Math.round((skill + kw) / 2 + 8))

  return [
    { subject: 'Skill match', A: skill, fullMark: 100 },
    { subject: 'Keyword fit', A: kw, fullMark: 100 },
    { subject: 'Experience fit', A: exp, fullMark: 100 },
    { subject: 'Balance', A: balance, fullMark: 100 },
  ]
}

export type HeatZone = {
  id: string
  label: string
  intensity: number
  hint: string
}

/**
 * Heuristic "recruiter skim" heat along the resume: job-relevant term density per vertical slice.
 */
export function buildResumeAttentionHeatZones(
  resumeText: string,
  jobDescription: string,
  extraTerms: string[],
): HeatZone[] {
  const resume = resumeText.toLowerCase()
  const len = resume.length
  const terms = pickTerms(jobDescription, extraTerms)

  if (len === 0) {
    return [
      { id: 'z0', label: 'Lead-in', intensity: 0, hint: 'No parsed resume text' },
      { id: 'z1', label: 'Early core', intensity: 0, hint: '' },
      { id: 'z2', label: 'Mid body', intensity: 0, hint: '' },
      { id: 'z3', label: 'Proof blocks', intensity: 0, hint: '' },
      { id: 'z4', label: 'Close', intensity: 0, hint: '' },
    ]
  }

  const bands = 5
  const zones: HeatZone[] = []
  const labels = ['Lead-in', 'Early core', 'Mid body', 'Proof blocks', 'Close']

  for (let i = 0; i < bands; i++) {
    const start = Math.floor((len * i) / bands)
    const end = Math.floor((len * (i + 1)) / bands)
    const slice = resume.slice(start, end)
    let hits = 0
    for (const t of terms) {
      if (t.length >= 3 && slice.includes(t)) hits += 1
    }
    const intensity =
      terms.length === 0 ? 20 : Math.min(100, Math.round((hits / terms.length) * 140))
    zones.push({
      id: `z${i}`,
      label: labels[i] ?? `Section ${i + 1}`,
      intensity,
      hint: hits ? `${hits} posting term hits` : 'Low posting-term density',
    })
  }

  return zones
}

function pickTerms(jobDescription: string, extraTerms: string[]): string[] {
  const fromJob = (jobDescription.toLowerCase().match(/\b[a-z][a-z0-9]{3,}\b/g) ?? []).filter(
    (w) => !STOPWORDS.has(w),
  )
  const merged = [...new Set([...fromJob, ...extraTerms.map((t) => t.toLowerCase())])]
  return merged.slice(0, 18)
}

export type TrendPoint = {
  date: string
  label: string
  overlap: number
  confidence: number
}

export function buildApplicationsTrend(
  apps: {
    id: number
    created_at: string
    analysis_summary: {
      overlap_percent?: number
      matching_skill_count?: number
      missing_skill_count?: number
      alignment_score?: number
      semantic_blended_fit_score?: number
      state: string
    }
  }[],
): TrendPoint[] {
  const usable = apps.filter((a) => a.analysis_summary.state !== 'failed' && a.analysis_summary.state !== 'none')
  return usable
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((a) => {
      const m = a.analysis_summary.matching_skill_count ?? 0
      const miss = a.analysis_summary.missing_skill_count ?? 0
      const ov = a.analysis_summary.overlap_percent ?? 0
      const al = a.analysis_summary.alignment_score
      const radar = buildRadarFromSummary({
        matching: m,
        missing: miss,
        overlapPercent: ov,
        alignment: al,
      })
      const semFit = a.analysis_summary.semantic_blended_fit_score
      const confidence =
        typeof semFit === 'number'
          ? Math.round(semFit)
          : Math.round(radar.reduce((s, r) => s + r.A, 0) / radar.length)
      return {
        date: a.created_at,
        label: String(a.id),
        overlap: Math.round(ov),
        confidence,
      }
    })
}
