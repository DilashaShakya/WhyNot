import { useState } from 'react'
import { useMatch, Outlet } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { MobileNavOverlay, TopNavbar } from '@/components/layout/TopNavbar'
import { Sidebar } from '@/components/layout/Sidebar'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const studioRoute = useMatch({ path: '/app/studio', end: true })
  const jobReviewRoute = useMatch({ path: '/app/job', end: false })
  const wideDashboard = Boolean(studioRoute || jobReviewRoute)

  return (
    <div
      className={cn(
        'flex h-[100dvh] overflow-hidden bg-[var(--color-surface)]',
        wideDashboard && 'bg-white dark:bg-neutral-950',
      )}
    >
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <MobileNavOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar mobileMenuOpen={mobileOpen} onToggleMobileMenu={() => setMobileOpen((v) => !v)} />
        <main
          className={cn(
            'min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-10',
            wideDashboard && 'bg-white dark:bg-neutral-950',
          )}
        >
          <div className={cn('mx-auto', wideDashboard ? 'max-w-7xl' : 'max-w-4xl')}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
