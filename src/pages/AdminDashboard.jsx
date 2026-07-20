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
    <div className="min-h-screen bg-[#F5F7F5] p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E4] shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/app" className="p-2 -ml-2 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="font-display text-xl font-bold text-[#1C2B2A]">Admin Workspace</h1>
            </div>
            <p className="text-xs text-slate-500 ml-10">System telemetry and active statistics overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg truncate max-w-[180px]">{user?.email}</span>
            <button onClick={logout} className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors">
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E2E8E4] shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users size={14} className="text-[#5C8D72]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Members</span>
            </div>
            <p className="font-display text-2xl font-extrabold text-[#1C2B2A]">{totals.totalUsers}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E2E8E4] shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <MessageCircle size={14} className="text-[#7C6FA0]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">AI Messages</span>
            </div>
            <p className="font-display text-2xl font-extrabold text-[#1C2B2A]">{totals.totalChats}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E2E8E4] shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Smile size={14} className="text-teal-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Mood Logs</span>
            </div>
            <p className="font-display text-2xl font-extrabold text-[#1C2B2A]">{totals.totalMoodEntries}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E2E8E4] shadow-sm bg-rose-50/20">
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <Activity size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Negative Sentiment</span>
            </div>
            <p className="font-display text-2xl font-extrabold text-rose-600">{totals.negativeSentimentMessages}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E2E8E4] shadow-sm bg-rose-50/30">
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Distress Triggers</span>
            </div>
            <p className="font-display text-2xl font-extrabold text-rose-600">{totals.severeDistressEvents}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white p-5 rounded-xl border border-[#E2E8E4] shadow-sm">
            <h3 className="font-display text-sm font-bold text-[#1C2B2A] mb-6 uppercase tracking-wider">7-Day Usage Trends</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8E4" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px 0 rgb(0 0 0/0.05)' }}
                  />
                  <Line type="monotone" dataKey="chats" stroke="#7C6FA0" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Chats" />
                  <Line type="monotone" dataKey="moods" stroke="#5C8D72" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Moods" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E2E8E4] shadow-sm">
            <h3 className="font-display text-sm font-bold text-[#1C2B2A] mb-6 uppercase tracking-wider">Mood Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8E4" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis type="category" dataKey="moodType" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, textTransform: 'capitalize' }} />
                  <Tooltip
                    cursor={{ fill: '#EDF4F0' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px 0 rgb(0 0 0/0.05)' }}
                  />
                  <Bar dataKey="count" fill="#2E7D87" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
