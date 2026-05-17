import { api } from '@/api/client'

export type AiRejectionAnalysisSummary = {
  id: number
  job_application_id: number
  status: string
  overall_confidence: number | null
  model_id: string | null
  prompt_version: string
  created_at: string
  updated_at: string
  executive_preview?: string
  error_message?: string
}

export type BulletRewriteItem = {
  original_bullet: string
  weakness_tags: string[]
  improved_bullet: string
  why_stronger: string
}

export type ContextualMissingSkill = {
  skill_or_term: string
  why_it_matters: string
  where_in_job_posting: string
  transferable_angle: string
  how_to_surface: string
}

export type ImpactMetricsGap = {
  resume_excerpt: string
  gap: string
  suggested_direction: string
}

export type PrioritizedImprovement = {
  priority: 'high' | 'medium' | 'low'
  title: string
  detail: string
  category: 'bullets' | 'skills' | 'positioning' | 'metrics' | 'keywords' | 'structure' | 'other'
}

export type AiRejectionStructuredFeedback = {
  executive_summary?: string
  prompt_schema_version?: string
  possible_rejection_factors?: string[]
  missing_skills?: string[]
  resume_weaknesses?: string[]
  suggested_improvements?: string[]
  strong_areas?: string[]
  recommended_next_steps?: string[]
  keyword_deficiencies?: string[]
  experience_mismatch_notes?: string[]
  project_alignment_notes?: string[]
  formatting_readability_notes?: string[]
  recruiter_observations?: string[]
  bullet_rewrites?: BulletRewriteItem[]
  contextual_missing_skills?: ContextualMissingSkill[]
  positioning_recommendations?: string[]
  impact_metrics_gaps?: ImpactMetricsGap[]
  resume_strengths?: string[]
  prioritized_improvements?: PrioritizedImprovement[]
}

export type AiRejectionAnalysisDetail = AiRejectionAnalysisSummary & {
  structured_feedback: AiRejectionStructuredFeedback & Record<string, unknown>
  confidence_by_section: Record<string, number>
  openai_response_id?: string | null
  error_message?: string | null
}

export async function fetchAiRejectionAnalyses(jobApplicationId: number): Promise<AiRejectionAnalysisSummary[]> {
  const { data } = await api.get<{ ai_rejection_analyses: AiRejectionAnalysisSummary[] }>(
    `/api/v1/job_applications/${jobApplicationId}/ai_rejection_analyses`,
  )
  return data.ai_rejection_analyses
}

export async function fetchAiRejectionAnalysis(
  jobApplicationId: number,
  id: number,
): Promise<AiRejectionAnalysisDetail> {
  const { data } = await api.get<{ ai_rejection_analysis: AiRejectionAnalysisDetail }>(
    `/api/v1/job_applications/${jobApplicationId}/ai_rejection_analyses/${id}`,
  )
  return data.ai_rejection_analysis
}

export async function createAiRejectionAnalysis(jobApplicationId: number): Promise<AiRejectionAnalysisDetail> {
  const { data } = await api.post<{ ai_rejection_analysis: AiRejectionAnalysisDetail }>(
    `/api/v1/job_applications/${jobApplicationId}/ai_rejection_analyses`,
    {},
    { validateStatus: (s) => (s >= 200 && s < 300) || s === 202 },
  )
  return data.ai_rejection_analysis
}
