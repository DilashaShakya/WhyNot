import { Button } from '@/components/ui/Button'
import { useThemeStore } from '@/stores/themeStore'

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useThemeStore()

  const cycle = () => {
    const order = ['system', 'light', 'dark'] as const
    const next = order[(order.indexOf(preference) + 1) % order.length]
    setPreference(next)
  }

  const label =
    preference === 'system' ? 'Theme: system' : preference === 'light' ? 'Theme: light' : 'Theme: dark'

  return (
    <Button type="button" variant="ghost" className={className} onClick={cycle} aria-label={label} title={label}>
      <span className="text-xs font-normal tabular-nums text-neutral-600 dark:text-neutral-400">
        {preference === 'system' ? 'Auto' : preference === 'light' ? 'Light' : 'Dark'}
      </span>
    </Button>
  )
}
