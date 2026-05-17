import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { configureApiAuth, configureUnauthorizedHandler } from '@/api/client'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ToastViewport } from '@/components/feedback/ToastViewport'
import { ThemeSync } from '@/components/system/ThemeSync'
import { AppRoutes } from '@/routes/AppRoutes'
import { useAuthStore } from '@/stores/authStore'
import './index.css'

function redirectToLoginIfNeeded(): void {
  const path = window.location.pathname
  if (path === '/login' || path === '/register') {
    return
  }
  window.location.assign('/login')
}

/**
 * Load persisted auth from localStorage before the first React paint so ProtectedRoute
 * sees the real token immediately 
 */
async function bootstrap(): Promise<void> {
  await useAuthStore.persist.rehydrate()

  configureApiAuth(() => useAuthStore.getState().token)

  configureUnauthorizedHandler(() => {
    useAuthStore.getState().clearSession()
    redirectToLoginIfNeeded()
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ThemeSync />
        <AppRoutes />
        <ToastViewport />
        <ConfirmDialog />
      </BrowserRouter>
    </StrictMode>,
  )
}

void bootstrap()
