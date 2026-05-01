import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/authContext.js'

export default function PrivateRoute() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

