import { api } from '@/api/client'
import type { AuthSuccess, RegisterPayload } from '@/api/types'

export async function loginRequest(email: string, password: string): Promise<AuthSuccess> {
  const { data } = await api.post<AuthSuccess>('/api/v1/auth/login', { email, password })
  return data
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthSuccess> {
  const { data } = await api.post<AuthSuccess>('/api/v1/auth/register', {
    user: {
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      display_name: payload.display_name,
    },
  })
  return data
}
