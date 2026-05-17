import { api } from '@/api/client'
import type { ResumeDetail, ResumeListItem } from '@/api/types'

export async function fetchResumes(): Promise<ResumeListItem[]> {
  const { data } = await api.get<{ resumes: ResumeListItem[] }>('/api/v1/resumes')
  return data.resumes
}

export async function fetchResume(id: number): Promise<ResumeDetail> {
  const { data } = await api.get<{ resume: ResumeDetail }>(`/api/v1/resumes/${id}`)
  return data.resume
}

export type CreateResumePayload = {
  title: string
  notes?: string
  file: File
}

export async function createResume(
  payload: CreateResumePayload,
  onUploadProgress?: (percent: number) => void,
): Promise<ResumeDetail> {
  const body = new FormData()
  body.append('resume[title]', payload.title)
  if (payload.notes) {
    body.append('resume[notes]', payload.notes)
  }
  body.append('resume[file]', payload.file)

  const { data } = await api.post<{ resume: ResumeDetail }>('/api/v1/resumes', body, {
    timeout: 120_000,
    onUploadProgress: (evt) => {
      if (!onUploadProgress || !evt.total) return
      onUploadProgress(Math.round((evt.loaded / evt.total) * 100))
    },
  })

  return data.resume
}

export async function deleteResume(id: number): Promise<void> {
  await api.delete(`/api/v1/resumes/${id}`)
}
