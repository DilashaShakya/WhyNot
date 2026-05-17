import { useToastStore } from '@/stores/toastStore'

export function useToast() {
  const push = useToastStore((s) => s.push)
  return {
    toast: push,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
  }
}
