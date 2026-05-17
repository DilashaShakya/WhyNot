import { create } from 'zustand'

export type ToastVariant = 'neutral' | 'success' | 'error'

export type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastState = {
  toasts: Toast[]
  push: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

const AUTO_DISMISS_MS = 4_500

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = 'neutral') => {
    const id = globalThis.crypto?.randomUUID?.() ?? `toast-${Date.now()}`
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }))
    window.setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, AUTO_DISMISS_MS)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
