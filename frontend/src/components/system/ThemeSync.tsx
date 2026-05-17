import { useEffect, useLayoutEffect } from 'react'
import { resolveTheme, useThemeStore } from '@/stores/themeStore'

export function ThemeSync() {
  const preference = useThemeStore((s) => s.preference)
  const setState = useThemeStore.setState

  useEffect(() => {
    if (useThemeStore.persist.hasHydrated()) {
      useThemeStore.getState().applyFromStorage()
      return
    }
    const unsub = useThemeStore.persist.onFinishHydration(() => {
      useThemeStore.getState().applyFromStorage()
    })
    return unsub
  }, [])

  useLayoutEffect(() => {
    function apply() {
      const resolved = resolveTheme(preference)
      document.documentElement.classList.toggle('dark', resolved === 'dark')
      setState({ resolved })
    }

    apply()

    if (preference !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => apply()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference, setState])

  return null
}
