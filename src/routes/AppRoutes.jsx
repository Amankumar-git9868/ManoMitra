import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from '../components/PrivateRoute.jsx'
import Login from '../pages/Login.jsx'
import Signup from '../pages/Signup.jsx'
import App from '../App.jsx'
import { useAuth } from '../auth/authContext.js'

export default function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<PrivateRoute />}>
        <Route path="/app" element={<App />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

