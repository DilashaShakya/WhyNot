import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '@/stores/toastStore'

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex max-w-sm flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            layout
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto"
          >
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className={
                t.variant === 'error'
                  ? 'w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-left text-sm text-neutral-900 shadow-[var(--shadow-soft)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50'
                  : t.variant === 'success'
                    ? 'w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left text-sm text-neutral-900 shadow-[var(--shadow-soft)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50'
                    : 'w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left text-sm text-neutral-800 shadow-[var(--shadow-soft)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
              }
            >
              {t.message}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
