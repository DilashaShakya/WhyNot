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

export type JobApplicationListItem = {
  id: number
  resume_id: number
  job_title: string | null
  company_name: string | null
  status: string
  job_description_preview: string
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
  created_at: string
  updated_at: string
}
