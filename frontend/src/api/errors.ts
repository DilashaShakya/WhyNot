import axios, { type AxiosError } from 'axios'
import type { ApiErrorBody } from '@/api/types'

export function getApiErrors(error: unknown): string[] {
  if (!axios.isAxiosError(error)) {
    return ['Something went wrong. Please try again.']
  }
  const body = error.response?.data as ApiErrorBody | undefined
  if (body?.errors?.length) {
    return body.errors.map((e) => e.message)
  }
  const ax = error as AxiosError
  return [ax.message || 'Request failed']
}
