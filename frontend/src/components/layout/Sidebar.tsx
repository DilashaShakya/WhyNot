import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'

const items = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/resume', label: 'My resume', end: true },
  { to: '/app/job', label: 'Job review', end: false },
  { to: '/app/studio', label: 'Studio', end: true },
]

export function Sidebar({
  mobileOpen,
  onNavigate,
}: {
  mobileOpen: boolean
  onNavigate?: () => void
}) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'block rounded-md px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100',
    )

  const inner = (
    <div className="flex h-full flex-col gap-1 px-3 py-4">
      <div className="mb-6 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        WhyNot
      </div>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            onClick={() => onNavigate?.()}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      <aside className="hidden h-full w-56 shrink-0 border-r border-neutral-200 bg-[var(--color-surface)] dark:border-neutral-800 md:flex">
        {inner}
      </aside>

      <motion.aside
        initial={false}
        animate={{
          x: mobileOpen ? 0 : '-100%',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className={`fixed inset-y-0 left-0 z-40 flex w-56 border-r border-neutral-200 bg-[var(--color-surface)] shadow-[var(--shadow-soft)] dark:border-neutral-800 md:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {inner}
      </motion.aside>
    </>
  )
}
