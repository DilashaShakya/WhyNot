import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '@/api/auth.api'
import type { RegisterPayload, User } from '@/api/types'

type AuthState = {
  token: string | null
  user: User | null
  setSession: (token: string, user: User) => void
  clearSession: () => void
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
      login: async (email, password) => {
        const { token, user } = await authApi.loginRequest(email, password)
        set({ token, user })
      },
      register: async (payload) => {
        const { token, user } = await authApi.registerRequest(payload)
        set({ token, user })
      },
    }),
    {
      name: 'whynot-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
)
