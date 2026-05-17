import type { SkillRow } from '@/api/types'

export type SemanticSkillMapping = {
  job_skill: SkillRow
  resume_skill: SkillRow
  similarity: number
  relationship: 'transferable' | 'synonym_or_close'
}

export type SemanticRelatedExperience = {
  resume_excerpt: string
  job_anchor_excerpt: string
  similarity: number
}

export type SemanticLayer = {
  status: string
  model_id?: string
  message?: string
  document_similarity?: number
  semantic_document_score?: number
  blended_fit_score?: number
  semantic_skill_coverage_ratio?: number
  lexical_skill_coverage_ratio?: number
  semantic_skill_alignment_score?: number
  best_chunk_similarity?: number
  best_chunk_score?: number
  keyword_semantic_lift?: number
  related_skill_mappings?: SemanticSkillMapping[]
  transferable_skill_mappings?: SemanticSkillMapping[]
  synonym_skill_mappings?: SemanticSkillMapping[]
  semantic_true_gaps?: SkillRow[]
  related_experience?: SemanticRelatedExperience[]
  embedding_latency_ms?: number
  cache?: { resume_doc_vector?: boolean; job_doc_vector?: boolean }
}

export function parseSemanticLayer(raw: unknown): SemanticLayer | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (typeof s.status !== 'string') return null
  return raw as SemanticLayer
}
