import { AnimatePresence, motion } from 'framer-motion'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { UserMenu } from '@/components/layout/UserMenu'

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-neutral-700 dark:text-neutral-200">
      {open ? (
        <path
          d="M6 18L18 6M6 6l12 12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

export function TopNavbar({
  mobileMenuOpen,
  onToggleMobileMenu,
}: {
  mobileMenuOpen: boolean
  onToggleMobileMenu: () => void
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-[var(--color-surface)] px-4 dark:border-neutral-800 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex rounded-md p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900 md:hidden"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={onToggleMobileMenu}
        >
          <MenuIcon open={mobileMenuOpen} />
        </button>
        <span className="hidden text-sm font-medium text-neutral-600 dark:text-neutral-300 md:inline">
          Dashboard
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}

export function MobileNavOverlay({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.button
          type="button"
          aria-label="Close navigation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
        />
      ) : null}
    </AnimatePresence>
  )
}
