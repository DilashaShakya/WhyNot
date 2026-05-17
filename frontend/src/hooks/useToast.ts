import { useCallback } from 'react'
import { useToastStore } from '@/stores/toastStore'

export function useToast() {
  const push = useToastStore((s) => s.push)
  const success = useCallback((message: string) => push(message, 'success'), [push])
  const error = useCallback((message: string) => push(message, 'error'), [push])
  return { toast: push, success, error }
}
