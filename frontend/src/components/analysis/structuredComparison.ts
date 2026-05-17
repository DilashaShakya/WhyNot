import type { ExperienceAlignment, KeywordOverlap, SkillRow } from '@/api/types'

export type StructuredComparisonData = {
  matching_skills: SkillRow[]
  missing_skills: SkillRow[]
  extra_resume_skills?: SkillRow[]
  keyword_overlap: KeywordOverlap
  experience_alignment: ExperienceAlignment
}

export function isStructuredComparison(value: unknown): value is StructuredComparisonData {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (!Array.isArray(v.matching_skills) || !Array.isArray(v.missing_skills)) return false
  if (typeof v.keyword_overlap !== 'object' || v.keyword_overlap === null) return false
  if (typeof v.experience_alignment !== 'object' || v.experience_alignment === null) return false
  const ea = v.experience_alignment as Record<string, unknown>
  return typeof ea.score === 'number' && Array.isArray(ea.signals)
}
