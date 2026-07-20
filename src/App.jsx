import { useState } from 'react'
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

import Dashboard from './components/Dashboard.jsx'
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
    <div className="flex h-full flex-col bg-[#EDF4F0]/60 p-5 border-r border-[#E2E8E4]">
      {/* Brand */}
      <div className="mb-8 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#5C8D72] p-2.5 text-white shadow-sm">
            <Brain size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C8D72]">Mano-Mitra</p>
            <h1 className="font-display text-base font-bold text-slate-900 leading-tight">
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
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all border ${
                isActive
                  ? 'bg-white text-[#5C8D72] shadow-sm border-[#E2E8E4]'
                  : 'text-slate-600 hover:bg-white/40 hover:text-slate-900 border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#5C8D72]' : 'text-slate-400'} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Daily reminder */}
      <div className="mt-6 rounded-2xl bg-[#EDF4F0] border border-[#B5D4C3] p-4 shadow-sm">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#3f6b53]">Daily reminder</p>
        <p className="text-xs font-semibold text-slate-800 leading-relaxed">
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

  return (
    <div className="min-h-screen bg-[#F5F7F5] font-sans">
      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-[#1C2B2A]/40 backdrop-blur-sm"
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
        <div className="flex w-full overflow-hidden md:rounded-3xl md:border md:border-[#E2E8E4] md:shadow-md">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 md:flex lg:w-72">
            <Sidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onClose={null}
            />
          </aside>

          {/* Main */}
          <main className="flex flex-1 flex-col overflow-hidden bg-white">
            {/* ── Header ── */}
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E2E8E4] bg-white px-4 py-4 sm:px-6">
              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 md:hidden"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              {/* Page title — desktop (hidden on dashboard — dashboard renders its own heading) */}
              {s !== 'dashboard' && (
                <div className="hidden md:block">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <h2 className="font-display text-xl font-extrabold text-[#1C2B2A] tracking-tight">
                    {NAV_ITEMS.find((n) => n.id === s)?.label ?? 'Dashboard'}
                  </h2>
                </div>
              )}

              {/* Mobile: section label */}
              <p className="font-display text-base font-bold text-slate-900 md:hidden">
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
                    className="hidden sm:block w-36 md:w-48 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#5C8D72] focus:bg-white focus:ring-1 focus:ring-[#5C8D72]"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((p) => !p)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#5C8D72] transition-colors"
                >
                  <CircleUserRound size={20} />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-11 z-30 w-60 rounded-2xl border border-[#E2E8E4] bg-white p-4 shadow-xl shadow-slate-200/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C8D72] mb-0.5">Account</p>
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
              {/* Dashboard — new dedicated component */}
              {s === 'dashboard' && <Dashboard setActiveSection={setActiveSection} />}

              {/* Individual section views — full width */}
              {s === 'chat'         && <ChatAssistant />}
              {s === 'appointments' && <AppointmentBooking />}
              {s === 'mood'         && <MoodTracker />}
              {s === 'resources'    && <ResourceGrid searchQuery={searchQuery} />}
              {s === 'peer-support' && <PeerSupport searchQuery={searchQuery} />}
            </div>

            {/* ── Mobile bottom nav ── */}
            <nav className="flex shrink-0 border-t border-[#E2E8E4] bg-white md:hidden">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = s === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-semibold transition-colors ${
                      isActive ? 'text-[#5C8D72]' : 'text-slate-400'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-[#5C8D72]' : 'text-slate-400'} />
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

