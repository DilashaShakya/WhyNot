import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function GuestRoute() {
  const token = useAuthStore((s) => s.token)

  if (token) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
