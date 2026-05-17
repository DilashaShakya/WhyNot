import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useConfirmStore } from '@/stores/confirmStore'

export function ConfirmDialog() {
  const open = useConfirmStore((s) => s.open)
  const options = useConfirmStore((s) => s.options)
  const answer = useConfirmStore((s) => s.answer)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && options) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [open, options])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      answer(false)
    }
    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
  }, [answer])

  if (!options) return null

  const destructive = options.tone === 'danger'

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[200] m-0 h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-neutral-950/55 backdrop:backdrop-blur-sm open:backdrop:bg-neutral-950/55"
      onClick={(e) => {
        if (e.target === dialogRef.current) answer(false)
      }}
    >
      <motion.div
        className="flex min-h-full items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        <motion.div
          role="alertdialog"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          className="w-full max-w-md rounded-xl border border-neutral-200 bg-[var(--color-surface)] p-6 shadow-2xl dark:border-neutral-800"
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={
              destructive
                ? 'mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                : 'mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
            }
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              {destructive ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              )}
            </svg>
          </div>

          <h2 id="confirm-dialog-title" className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {options.title}
          </h2>
          <p id="confirm-dialog-desc" className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {options.description}
          </p>

          {options.itemLabel ? (
            <p className="mt-4 truncate rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-medium text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-100">
              {options.itemLabel}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="sm:min-w-[6.5rem]" autoFocus onClick={() => answer(false)}>
              {options.cancelLabel ?? 'Cancel'}
            </Button>
            <button
              type="button"
              className={
                destructive
                  ? 'inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-45 dark:hover:bg-red-500 sm:min-w-[6.5rem]'
                  : 'inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white sm:min-w-[6.5rem]'
              }
              onClick={() => answer(true)}
            >
              {options.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </dialog>
  )
}
