export type ApiErrorItem = {
  field?: string
  code?: string
  message: string
}

export type ApiErrorBody = {
  errors: ApiErrorItem[]
}

export type User = {
  id: number
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export type AuthSuccess = {
  token: string
  user: User
}

export type RegisterPayload = {
  email: string
  password: string
  password_confirmation: string
  display_name?: string
}

export type ResumeFileMeta = {
  filename: string
  byte_size: number
  content_type: string
}

export type ResumeListItem = {
  id: number
  title: string
  notes: string | null
  file: ResumeFileMeta | null
  parsed_at: string | null
  parse_error: string | null
  parsed_preview: string | null
  created_at: string
  updated_at: string
}

export type ResumeDetail = ResumeListItem & {
  parsed_text: string | null
  parsed_preview?: string | null
}

export type SkillRow = {
  slug: string
  label: string
}

export type KeywordOverlap = {
  job_term_count: number
  resume_term_count: number
  matched_term_count: number
  coverage_percent: number
  resume_keyword_coverage_percent: number
  matched_terms_sample: string[]
}

export type ExperienceSignal = {
  kind: string
  tone?: string
  message: string
}

export type ExperienceAlignment = {
  score: number
  job_years_mentioned?: number | null
  resume_years_mentioned?: number | null
  job_seniority_hits?: string[]
  resume_seniority_hits?: string[]
  signals: ExperienceSignal[]
}

export type StructuredComparison = {
  version: number
  engine: string
  generated_at: string
  error_code?: string
  job_skill_count?: number
  resume_skill_count?: number
  matching_skills: SkillRow[]
  missing_skills: SkillRow[]
  extra_resume_skills: SkillRow[]
  keyword_overlap: KeywordOverlap
  experience_alignment: ExperienceAlignment
}

export type AnalysisResult = {
  id: number
  job_application_id: number
  status: string
  summary: string | null
  structured_feedback: StructuredComparison | Record<string, unknown>
  error_message: string | null
  created_at: string
  updated_at: string
}

export type JobApplicationAnalysisSummary = {
  state: string
  overlap_percent?: number
  matching_skill_count?: number
  missing_skill_count?: number
  alignment_score?: number
  error_message?: string
  semantic_blended_fit_score?: number
  semantic_document_score?: number
  semantic_status?: string
}

export type JobApplicationListItem = {
  id: number
  resume_id: number
  job_title: string | null
  company_name: string | null
  status: string
  job_description_preview: string
  analysis_summary: JobApplicationAnalysisSummary
  created_at: string
  updated_at: string
}

export type JobApplicationDetail = {
  id: number
  resume_id: number
  job_title: string | null
  company_name: string | null
  job_description: string
  status: string
  analysis_result: AnalysisResult | null
  created_at: string
  updated_at: string
}
