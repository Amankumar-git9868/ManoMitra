import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/authContext.js'

export default function AdminRoute() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/app" replace />

  return <Outlet />
}
