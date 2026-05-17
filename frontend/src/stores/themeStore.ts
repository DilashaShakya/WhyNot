import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

type ThemeState = {
  preference: ThemePreference
  resolved: 'light' | 'dark'
  setPreference: (preference: ThemePreference) => void
  applyFromStorage: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'system',
      resolved: 'light',
      setPreference: (preference) => {
        const resolved = resolveTheme(preference)
        document.documentElement.classList.toggle('dark', resolved === 'dark')
        set({ preference, resolved })
      },
      applyFromStorage: () => {
        const { preference } = get()
        const resolved = resolveTheme(preference)
        document.documentElement.classList.toggle('dark', resolved === 'dark')
        set({ resolved })
      },
    }),
    {
      name: 'whynot-theme',
      partialize: (s) => ({ preference: s.preference }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ThemeState> | undefined
        return {
          ...current,
          preference: p?.preference ?? current.preference,
          resolved: current.resolved,
        }
      },
    },
  ),
)
