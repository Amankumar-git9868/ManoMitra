import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from '../components/PrivateRoute.jsx'
import AdminRoute from '../components/AdminRoute.jsx'
import Login from '../pages/Login.jsx'
import Signup from '../pages/Signup.jsx'
import AdminDashboard from '../pages/AdminDashboard.jsx'
import App from '../App.jsx'
import Landing from '../pages/Landing.jsx'
import { useAuth } from '../auth/authContext.js'

export default function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<PrivateRoute />}>
        <Route path="/app" element={<App />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

