import { api } from '@/api/client'

/** AI studio calls can exceed the default axios timeout on long resumes. */
const STUDIO_AI_TIMEOUT_MS = 180_000

export type ResumeStudioSnapshot = {
  resume_id: number
  title: string
  baseline_parsed_text: string | null
  latest_version: ResumeStudioVersion | null
}

export type ResumeStudioVersion = {
  id: number
  body_text: string
  label: string
  source: string
  job_application_id: number | null
  created_at: string
}

export type ResumeStudioRewrite = {
  id: number
  prompt_kind: 'bullet' | 'section' | 'tailoring' | 'impact' | 'writing_insights'
  input: Record<string, unknown>
  output: Record<string, unknown>
  job_application_id: number | null
  created_at: string
}

export async function fetchResumeStudio(resumeId: number): Promise<ResumeStudioSnapshot> {
  const { data } = await api.get<{ studio: ResumeStudioSnapshot }>(`/api/v1/resumes/${resumeId}/studio`)
  return data.studio
}

export async function fetchResumeStudioVersions(resumeId: number): Promise<ResumeStudioVersion[]> {
  const { data } = await api.get<{ resume_studio_versions: ResumeStudioVersion[] }>(
    `/api/v1/resumes/${resumeId}/studio/versions`,
  )
  return data.resume_studio_versions
}

export async function fetchResumeStudioRewrites(resumeId: number): Promise<ResumeStudioRewrite[]> {
  const { data } = await api.get<{ resume_studio_rewrites: ResumeStudioRewrite[] }>(
    `/api/v1/resumes/${resumeId}/studio/rewrites`,
  )
  return data.resume_studio_rewrites
}

export async function saveResumeStudioVersion(
  resumeId: number,
  payload: { body_text: string; label?: string; source?: string; job_application_id?: number },
): Promise<ResumeStudioVersion> {
  const { data } = await api.post<{ resume_studio_version: ResumeStudioVersion }>(
    `/api/v1/resumes/${resumeId}/studio/save_version`,
    payload,
  )
  return data.resume_studio_version
}

export type BulletRewriteResult = {
  improved_bullet: string
  rationale: string
  verification_prompts?: string[]
}

export async function studioBulletRewrite(
  resumeId: number,
  payload: { bullet_text: string; section_heading?: string; job_application_id?: number },
): Promise<BulletRewriteResult> {
  const { data } = await api.post<{ result: BulletRewriteResult }>(
    `/api/v1/resumes/${resumeId}/studio/bullet_rewrite`,
    payload,
    { timeout: STUDIO_AI_TIMEOUT_MS },
  )
  return data.result
}

export type InsightStatus = 'critical_gap' | 'moderate_gap' | 'strong_match'

export type InsightExampleSnippet = {
  label: string
  text: string
}

export type InsightRewriteSection = {
  headline: string
  bullets: string[]
  example_snippets?: InsightExampleSnippet[]
}

export type MatchInsightItem = {
  rank: number
  importance_rank: number
  title: string
  description: string
  status: InsightStatus
  points_earned: number
  points_possible: number
  resume_evidence?: string
  coaching?: string
  rewrite_section?: InsightRewriteSection
}

export type InsightSummaryCounts = {
  critical_gaps: number
  moderate_gaps: number
  strong_matches: number
}

/** Legacy title/detail rows from older prompts */
export type WritingInsight = {
  title: string
  detail: string
}

export type SectionWritingNote = {
  section_heading: string
  insights: string[]
}

export type ResumeWritingInsightsResult = {
  overview?: string
  summary?: InsightSummaryCounts
  match_items?: MatchInsightItem[]
  writing_insights?: WritingInsight[]
  section_notes?: SectionWritingNote[]
  cross_cutting?: string[]
  ats_readability_notes?: string[]
}

function coerceInsightStatus(raw: unknown): InsightStatus {
  const s = String(raw ?? '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  if (s.includes('critical')) return 'critical_gap'
  if (s.includes('strong') || s.includes('aligned')) return 'strong_match'
  return 'moderate_gap'
}

function coerceMatchItemsRaw(raw: unknown): MatchInsightItem[] {
  const rows = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw as object) : []
  const out: MatchInsightItem[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const title = String(r.title ?? r.heading ?? r.name ?? '').trim() || 'Requirement'
    const description = String(
      r.description ?? r.detail ?? r.body ?? r.requirement_text ?? '',
    ).trim()
    let pp = Number(r.points_possible ?? r.pointsPossible ?? 0)
    let pe = Number(r.points_earned ?? r.pointsEarned ?? 0)
    if (!Number.isFinite(pp) || pp <= 0) pp = 10
    if (!Number.isFinite(pe) || pe < 0) pe = 0
    pe = Math.min(pe, pp)
    const importance_rank = Number(r.importance_rank ?? r.importanceRank ?? r.importance ?? 0) || 0
    const rank = Number(r.rank ?? 0) || 0
    const coaching = r.coaching != null ? String(r.coaching).trim() : undefined
    const resume_evidence = r.resume_evidence != null ? String(r.resume_evidence).trim() : undefined

    let rewrite: InsightRewriteSection | undefined
    const rs = r.rewrite_section ?? r.rewriteSection ?? r.rewrite
    if (rs && typeof rs === 'object') {
      const o = rs as Record<string, unknown>
      const headline = String(o.headline ?? 'Ways to strengthen this on your resume').trim()
      const bulletSrc = o.bullets ?? o.rewrite_bullets ?? o.actions
      const bullets = Array.isArray(bulletSrc)
        ? bulletSrc.map((x) => String(x).trim()).filter(Boolean)
        : typeof bulletSrc === 'string' && bulletSrc.trim()
          ? [bulletSrc.trim()]
          : []
      const exRaw = o.example_snippets ?? o.exampleSnippets ?? o.snippets
      const example_snippets: InsightExampleSnippet[] = []
      if (Array.isArray(exRaw)) {
        for (const ex of exRaw) {
          if (!ex || typeof ex !== 'object') continue
          const e = ex as Record<string, unknown>
          const label = String(e.label ?? e.title ?? 'Option').trim()
          const text = String(e.text ?? e.snippet ?? '').trim()
          if (text) example_snippets.push({ label: label || 'Option', text })
        }
      }
      if (bullets.length || example_snippets.length || headline)
        rewrite = { headline: headline || 'Ways to strengthen this on your resume', bullets, example_snippets }
    }
    if (!rewrite && coaching)
      rewrite = { headline: 'Rewrite & next steps', bullets: [coaching], example_snippets: [] }

    out.push({
      rank,
      importance_rank,
      title,
      description,
      status: coerceInsightStatus(r.status),
      points_earned: pe,
      points_possible: pp,
      resume_evidence: resume_evidence || undefined,
      coaching: coaching || undefined,
      rewrite_section: rewrite,
    })
  }
  if (out.length === 0) return out
  out.forEach((i) => {
    if (i.importance_rank <= 0) i.importance_rank = 1_000
  })
  out.sort((a, b) => a.importance_rank - b.importance_rank || a.title.localeCompare(b.title))
  out.forEach((i, iidx) => {
    i.rank = iidx + 1
  })
  return out
}

function coerceSummary(_raw: unknown, items: MatchInsightItem[]): InsightSummaryCounts {
  return {
    critical_gaps: items.filter((i) => i.status === 'critical_gap').length,
    moderate_gaps: items.filter((i) => i.status === 'moderate_gap').length,
    strong_matches: items.filter((i) => i.status === 'strong_match').length,
  }
}

function legacyItemsFromWritingInsights(insights: WritingInsight[]): MatchInsightItem[] {
  return insights.map((row, idx) => ({
    rank: idx + 1,
    importance_rank: idx + 1,
    title: row.title || 'Note',
    description: row.detail,
    status: 'moderate_gap' as const,
    points_earned: 5,
    points_possible: 10,
    coaching: row.detail,
    rewrite_section: {
      headline: 'Ways to strengthen this on your resume',
      bullets: row.detail ? [row.detail] : [],
      example_snippets: [],
    },
  }))
}

function coerceWritingInsightsRaw(raw: unknown): ResumeWritingInsightsResult {
  if (raw == null) return {}
  let o: Record<string, unknown> = {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) o = parsed as Record<string, unknown>
    } catch {
      return { overview: raw }
    }
  } else if (typeof raw === 'object' && !Array.isArray(raw)) {
    o = raw as Record<string, unknown>
  } else {
    return {}
  }

  const pick = <T>(...keys: string[]): T | undefined => {
    for (const k of keys) {
      if (k in o && o[k] != null) return o[k] as T
    }
    return undefined
  }

  const nested = pick<Record<string, unknown>>('resume_writing_insights', 'resumeWritingInsights')
  if (nested) {
    o = { ...nested, ...o }
  }

  const overview = pick<string>('overview', 'document_overview', 'documentOverview', 'summary')
  const writingInsightsRaw = pick<unknown>('writing_insights', 'writingInsights', 'insights', 'writing_principles')
  let writing_insights: WritingInsight[] | undefined
  if (Array.isArray(writingInsightsRaw)) {
    writing_insights = writingInsightsRaw
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const r = row as Record<string, unknown>
        const title = String(r.title ?? r.heading ?? r.name ?? '').trim()
        const detail = String(r.detail ?? r.body ?? r.description ?? '').trim()
        if (!title && !detail) return null
        return { title: title || 'Note', detail: detail || title }
      })
      .filter(Boolean) as WritingInsight[]
  }

  const sectionNotesRaw = pick<unknown>('section_notes', 'sectionNotes', 'by_section', 'bySection')
  let section_notes: SectionWritingNote[] | undefined
  if (Array.isArray(sectionNotesRaw)) {
    section_notes = sectionNotesRaw
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const r = row as Record<string, unknown>
        const section_heading = String(
          r.section_heading ?? r.heading ?? r.section ?? r.name ?? '',
        ).trim()
        const ins = r.insights ?? r.notes ?? r.bullets
        const insights = Array.isArray(ins)
          ? ins.map((x) => String(x).trim()).filter(Boolean)
          : typeof ins === 'string' && ins.trim()
            ? [ins.trim()]
            : []
        if (!section_heading && insights.length === 0) return null
        return { section_heading: section_heading || 'Section', insights }
      })
      .filter(Boolean) as SectionWritingNote[]
  }

  const crossRaw = pick<unknown>('cross_cutting', 'crossCutting')
  const cross_cutting = Array.isArray(crossRaw)
    ? crossRaw.map((x) => String(x).trim()).filter(Boolean)
    : typeof crossRaw === 'string' && crossRaw.trim()
      ? [crossRaw.trim()]
      : undefined

  const atsRaw = pick<unknown>('ats_readability_notes', 'atsReadabilityNotes')
  const ats_readability_notes = Array.isArray(atsRaw)
    ? atsRaw.map((x) => String(x).trim()).filter(Boolean)
    : typeof atsRaw === 'string' && atsRaw.trim()
      ? [atsRaw.trim()]
      : undefined

  const matchItemsRaw = pick<unknown>(
    'match_items',
    'matchItems',
    'requirements',
    'top_requirements',
    'topRequirements',
  )
  let match_items = coerceMatchItemsRaw(matchItemsRaw)
  if (match_items.length === 0 && writing_insights?.length)
    match_items = legacyItemsFromWritingInsights(writing_insights)

  const summary = coerceSummary(pick('summary'), match_items)

  return {
    overview: typeof overview === 'string' ? overview : undefined,
    summary,
    match_items: match_items.length ? match_items : undefined,
    writing_insights,
    section_notes,
    cross_cutting,
    ats_readability_notes,
  }
}

export async function studioWritingInsights(
  resumeId: number,
  payload: { resume_body: string; job_application_id?: number },
): Promise<ResumeWritingInsightsResult> {
  const { data } = await api.post<{ result: unknown }>(
    `/api/v1/resumes/${resumeId}/studio/writing_insights`,
    payload,
    { timeout: STUDIO_AI_TIMEOUT_MS },
  )
  return coerceWritingInsightsRaw(data.result)
}

export type TailoringResult = {
  skills_to_emphasize?: { skill: string; why: string }[]
  projects_to_raise?: { project_hint: string; reason: string }[]
  technologies_to_surface?: { technology: string; where: string }[]
  strongest_experience_alignment?: string[]
  executive_summary_angle?: string
}

export async function studioTailoring(
  resumeId: number,
  payload: { resume_body: string; job_application_id: number },
): Promise<TailoringResult> {
  const { data } = await api.post<{ result: TailoringResult }>(
    `/api/v1/resumes/${resumeId}/studio/tailoring`,
    payload,
    { timeout: STUDIO_AI_TIMEOUT_MS },
  )
  return data.result
}

export type ImpactScanResult = {
  weak_bullets?: { excerpt: string; issue: string; suggested_direction: string; metric_prompt: string }[]
}

export async function studioImpactScan(
  resumeId: number,
  payload: { resume_body: string; job_application_id?: number },
): Promise<ImpactScanResult> {
  const { data } = await api.post<{ result: ImpactScanResult }>(
    `/api/v1/resumes/${resumeId}/studio/impact_scan`,
    payload,
    { timeout: STUDIO_AI_TIMEOUT_MS },
  )
  return data.result
}
