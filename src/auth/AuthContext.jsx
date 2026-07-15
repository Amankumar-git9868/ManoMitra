import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { getFromStorage, removeFromStorage, saveToStorage } from '../utils/storage.js'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
const STORAGE_KEY = 'mano_auth'

const readStoredAuth = () => {
  const stored = getFromStorage(STORAGE_KEY, null)
  if (!stored?.token) return { token: '', user: null }
  return { token: stored.token, user: stored.user || null }
}

const isUserNotFound = (response, payload) =>
  response.status === 401 &&
  typeof payload?.message === 'string' &&
  payload.message.toLowerCase().includes('user not found')

export function AuthProvider({ children }) {
  const initial = readStoredAuth()
  const [token, setToken] = useState(initial.token)
  const [user, setUser] = useState(initial.user)

  const isAuthenticated = Boolean(token)
  const isAdmin = user?.role === 'admin'

  const persist = (nextToken, nextUser) => {
    saveToStorage(STORAGE_KEY, { token: nextToken, user: nextUser })
    setToken(nextToken)
    setUser(nextUser)
  }

  const clear = () => {
    removeFromStorage(STORAGE_KEY)
    setToken('')
    setUser(null)
  }

  const signup = useCallback(async ({ name, email, password }) => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Signup failed.')
    }
    persist(payload.data.token, payload.data.user)
    return payload.data
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Login failed.')
    }
    persist(payload.data.token, payload.data.user)
    return payload.data
  }, [])

  const logout = useCallback(() => clear(), [])

  const authFetch = useCallback(
    async (path, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const controller = new AbortController()
      const timeoutMs = 15000
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeoutId))

      if (response.status === 401) {
        const payload = await response.clone().json().catch(() => ({}))
        if (isUserNotFound(response, payload)) {
          clear()
        }
      }

      return response
    },
    [token],
  )

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      isAdmin,
      signup,
      login,
      logout,
      authFetch,
    }),
    [token, user, isAuthenticated, isAdmin, signup, login, logout, authFetch],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
