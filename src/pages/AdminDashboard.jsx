import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts'
import { Activity, Users, MessageCircle, Smile, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../auth/authContext.js'

export default function AdminDashboard() {
  const { authFetch, logout, user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authFetch('/admin/stats')
        const payload = await res.json()
        if (!res.ok || !payload.success) throw new Error(payload.message || 'Failed to load stats')
        setStats(payload.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [authFetch])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 max-w-md text-center">
          <p className="text-rose-600 mb-4">{error}</p>
          <button onClick={() => navigate('/app')} className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">Return to App</button>
        </div>
      </div>
    )
  }

  const { totals, moodDistribution, usageTrends } = stats

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/app" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            </div>
            <p className="text-sm text-slate-500 ml-11">Overview of platform health and usage.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-medium text-slate-600 truncate max-w-[180px]">{user?.email}</span>
            <button onClick={logout} className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 whitespace-nowrap">
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Users size={16} />
              <span className="text-sm font-medium">Users</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totals.totalUsers}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <MessageCircle size={16} />
              <span className="text-sm font-medium">Chats</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totals.totalChats}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Smile size={16} />
              <span className="text-sm font-medium">Moods</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totals.totalMoodEntries}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <Activity size={16} />
              <span className="text-sm font-medium">Negative Msg</span>
            </div>
            <p className="text-3xl font-bold text-rose-600">{totals.negativeSentimentMessages}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">Severe Distress</span>
            </div>
            <p className="text-3xl font-bold text-rose-600">{totals.severeDistressEvents}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">7-Day Usage Trends</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="chats" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Chats" />
                  <Line type="monotone" dataKey="moods" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Moods" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Mood Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis type="category" dataKey="moodType" axisLine={false} tickLine={false} tick={{ fill: '#334155', textTransform: 'capitalize' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
