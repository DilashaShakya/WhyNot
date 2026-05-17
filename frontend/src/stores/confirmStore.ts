import { create } from 'zustand'

export type ConfirmTone = 'danger' | 'default'

export type ConfirmOptions = {
  title: string
  description: string
  /** Highlighted name of the item being removed */
  itemLabel?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
}

type ConfirmState = {
  open: boolean
  options: ConfirmOptions | null
  resolve: ((value: boolean) => void) | null
  request: (options: ConfirmOptions) => Promise<boolean>
  answer: (value: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,

  request: (options) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, options, resolve })
    }),

  answer: (value) => {
    const { resolve } = get()
    resolve?.(value)
    set({ open: false, options: null, resolve: null })
  },
}))

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().request(options)
}

export function confirmDelete(itemLabel: string, kind: 'resume' | 'job review'): Promise<boolean> {
  const label = itemLabel.trim() || (kind === 'resume' ? 'Untitled resume' : 'Untitled review')
  return confirm({
    title: kind === 'resume' ? 'Delete this resume?' : 'Delete this job review?',
    description:
      kind === 'resume'
        ? 'The PDF, parsed text, and studio history for this resume will be permanently removed.'
        : 'AI feedback and job pairing for this review will be permanently removed.',
    itemLabel: label,
    confirmLabel: 'Delete',
    cancelLabel: 'Keep',
    tone: 'danger',
  })
}
