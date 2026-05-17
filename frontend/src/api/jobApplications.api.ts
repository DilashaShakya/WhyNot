import { api } from '@/api/client'
import type { AnalysisResult, JobApplicationDetail, JobApplicationListItem } from '@/api/types'

export async function fetchJobApplications(): Promise<JobApplicationListItem[]> {
  const { data } = await api.get<{ job_applications: JobApplicationListItem[] }>('/api/v1/job_applications')
  return data.job_applications
}

export async function fetchJobApplication(id: number): Promise<JobApplicationDetail> {
  const { data } = await api.get<{ job_application: JobApplicationDetail }>(`/api/v1/job_applications/${id}`)
  return data.job_application
}

export type CreateJobApplicationPayload = {
  resume_id: number
  job_title?: string
  company_name?: string
  job_description: string
}

export async function createJobApplication(payload: CreateJobApplicationPayload): Promise<JobApplicationDetail> {
  const { data } = await api.post<{ job_application: JobApplicationDetail }>('/api/v1/job_applications', {
    job_application: payload,
  })
  return data.job_application
}

export type UpdateJobApplicationPayload = CreateJobApplicationPayload

export async function updateJobApplication(
  id: number,
  payload: UpdateJobApplicationPayload,
): Promise<JobApplicationDetail> {
  const { data } = await api.patch<{ job_application: JobApplicationDetail }>(`/api/v1/job_applications/${id}`, {
    job_application: payload,
  })
  return data.job_application
}

export async function refreshJobAnalysis(jobApplicationId: number): Promise<AnalysisResult> {
  const { data } = await api.post<{ analysis_result: AnalysisResult }>(
    `/api/v1/job_applications/${jobApplicationId}/analysis_result`,
  )
  return data.analysis_result
}
