import { useState, useMemo } from 'react'
import {
  Brain,
  CalendarClock,
  CircleUserRound,
  Compass,
  LayoutDashboard,
  Menu,
  MessageCircleHeart,
  Smile,
  UsersRound,
  X,
} from 'lucide-react'
import { useAuth } from './auth/authContext.js'

import ChatAssistant from './components/ChatAssistant.jsx'
import MoodTracker from './components/MoodTracker.jsx'
import ResourceGrid from './components/ResourceGrid.jsx'
import AppointmentBooking from './components/AppointmentBooking.jsx'
import PeerSupport from './components/PeerSupport.jsx'

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'chat',         label: 'AI Chat',       icon: MessageCircleHeart },
  { id: 'appointments', label: 'Appointments',  icon: CalendarClock },
  { id: 'resources',   label: 'Resource Hub',  icon: Compass },
  { id: 'peer-support', label: 'Peer Support',  icon: UsersRound },
  { id: 'mood',         label: 'Mood Tracker',  icon: Smile },
]

function Sidebar({ activeSection, setActiveSection, onClose }) {
  return (
    <div className="flex h-full flex-col bg-slate-50 p-5">
      {/* Brand */}
      <div className="mb-8 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-2 text-white">
            <Brain size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Mano-Mitra</p>
            <h1 className="font-['Outfit',sans-serif] text-base font-bold text-slate-900 leading-tight">
              Care Workspace
            </h1>
          </div>
        </div>
        {/* Close button — only visible on mobile overlay */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 md:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveSection(item.id); onClose?.() }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                isActive
                  ? 'bg-white text-emerald-700 shadow-sm border-slate-100'
                  : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900 border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Daily reminder */}
      <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-800">Daily reminder</p>
        <p className="text-sm font-medium text-emerald-900 leading-relaxed">
          Progress is not linear. You are doing better than you think.
        </p>
      </div>
    </div>
  )
}

function App() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const s = activeSection // shorthand

  // Which sections show search?
  const showSearch = s === 'resources' || s === 'peer-support'

  // Layout helpers — true when a section is "focused" (not dashboard overview)
  const isSingleView = s !== 'dashboard'

  // Component visibility
  const showChat        = s === 'dashboard' || s === 'chat'
  const showAppointment = s === 'dashboard' || s === 'appointments'
  const showMood        = s === 'dashboard' || s === 'mood'
  const showResources   = s === 'dashboard' || s === 'resources'
  const showPeer        = s === 'dashboard' || s === 'peer-support'

  return (
    <div className="min-h-screen bg-[#F7F9F6] font-['Inter',sans-serif]">
      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* drawer */}
          <div className="relative z-50 w-72 shadow-2xl">
            <Sidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── App shell ── */}
      <div className="mx-auto flex h-screen max-w-[1400px] md:h-screen md:p-4 lg:p-6">
        <div className="flex w-full overflow-hidden md:rounded-3xl md:border md:border-slate-200 md:shadow-sm">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 border-r border-slate-100 md:flex lg:w-72">
            <Sidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onClose={null}
            />
          </aside>

          {/* Main */}
          <main className="flex flex-1 flex-col overflow-hidden bg-white">
            {/* ── Header ── */}
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              {/* Page title — desktop */}
              <div className="hidden md:block">
                <p className="text-xs font-medium text-slate-400">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <h2 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome back{user?.name ? `, ${user.name}` : ''}
                </h2>
              </div>

              {/* Mobile: section label */}
              <p className="text-base font-bold text-slate-900 md:hidden">
                {NAV_ITEMS.find((n) => n.id === s)?.label ?? 'Dashboard'}
              </p>

              {/* Right controls */}
              <div className="relative flex items-center gap-2">
                {showSearch && (
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="hidden sm:block w-36 md:w-48 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((p) => !p)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                >
                  <CircleUserRound size={20} />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-11 z-30 w-60 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/60">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Account</p>
                    <p className="font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-sm text-slate-500 truncate mb-4">{user?.email}</p>
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-center text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* ── Scrollable content area ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/*
               * LAYOUT LOGIC:
               * - Dashboard: 2-col grid (chat full-width on top, then 2-col below)
               * - Single section: full-width, no empty column
               */}

              {/* Chat — always full-width when visible */}
              {showChat && (
                <div className="mb-6">
                  <ChatAssistant />
                </div>
              )}

              {/* Dashboard 2-col grid */}
              {s === 'dashboard' && (
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  <div className="space-y-6">
                    <AppointmentBooking />
                  </div>
                  <div className="space-y-6">
                    <MoodTracker />
                    <ResourceGrid searchQuery={searchQuery} />
                    <PeerSupport searchQuery={searchQuery} />
                  </div>
                </div>
              )}

              {/* Individual section views — full width */}
              {s === 'appointments' && <AppointmentBooking />}
              {s === 'mood'         && <MoodTracker />}
              {s === 'resources'    && <ResourceGrid searchQuery={searchQuery} />}
              {s === 'peer-support' && <PeerSupport searchQuery={searchQuery} />}
            </div>

            {/* ── Mobile bottom nav ── */}
            <nav className="flex shrink-0 border-t border-slate-100 bg-white md:hidden">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = s === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-medium transition-colors ${
                      isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                    <span className="truncate max-w-[52px] text-center">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
