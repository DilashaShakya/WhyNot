import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const label = user?.display_name?.trim() || user?.email || 'Account'

  function logout() {
    clearSession()
    setOpen(false)
    navigate('/login')
  }

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        className="max-w-[12rem] truncate px-2"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate text-left text-xs font-normal">{label}</span>
        <span className="text-neutral-400" aria-hidden>
          ▾
        </span>
      </Button>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-[var(--color-surface)] py-1 text-sm shadow-[var(--shadow-soft)] dark:border-neutral-800"
        >
          <div className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400">Signed in as</div>
          <div className="truncate px-3 pb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {user?.email}
          </div>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
            onClick={logout}
          >
            Log out
          </button>
        </motion.div>
      ) : null}
    </div>
  )
}
