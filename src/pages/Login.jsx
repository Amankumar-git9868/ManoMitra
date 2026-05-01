import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../auth/authContext.js'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-4">
      <div className="mx-auto mt-12 max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-2 text-white">
            <Brain size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Mano-Mitra</p>
            <h1 className="text-xl font-semibold text-slate-900">Login</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Mail size={16} className="text-slate-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="w-full border-none bg-transparent text-sm text-slate-800 outline-none"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <LockKeyhole size={16} className="text-slate-400" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="w-full border-none bg-transparent text-sm text-slate-800 outline-none"
                placeholder="••••••••"
              />
            </div>
          </label>

          {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-indigo-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

