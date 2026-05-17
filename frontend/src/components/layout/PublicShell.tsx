import { motion } from 'framer-motion'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/cn'

const linkBtn =
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]'

export function PublicShell() {
  const { pathname } = useLocation()
  const isAuth = pathname === '/login' || pathname === '/register'

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-50">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            WhyNot
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuth ? (
              <Link
                to="/"
                className={cn(
                  linkBtn,
                  'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900',
                )}
              >
                Home
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    linkBtn,
                    'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
                  )}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    linkBtn,
                    'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-white',
                  )}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>
    </div>
  )
}
