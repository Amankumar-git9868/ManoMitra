import { useState, useEffect } from "react"
import {
  Smile,
  MessageCircleHeart,
  CalendarClock,
  Compass,
  UsersRound,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Activity,
  Flame,
} from "lucide-react"
import { useAuth } from "../auth/authContext.js"

/* --- Constants ----------------------------------------------- */

const MOOD_STORAGE_KEY = "mano_mood_entries_v1"
const MOOD_OPTIONS = [
  { key: "happy",    emoji: "😊", label: "Happy",   bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100", ring: "ring-emerald-400", text: "text-emerald-700" },
  { key: "neutral",  emoji: "😐", label: "Neutral",  bg: "bg-amber-50  border-amber-200  hover:bg-amber-100",  ring: "ring-amber-400",   text: "text-amber-700" },
  { key: "stressed", emoji: "😟", label: "Stressed", bg: "bg-rose-50   border-rose-200   hover:bg-rose-100",   ring: "ring-rose-400",    text: "text-rose-700" },
]

const FEATURE_CARDS = [
  {
    id: "mood",
    icon: Smile,
    label: "Mood Tracker",
    desc: "Log how you feel daily and watch your emotional trend emerge over time.",
    accent: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-100",
  },
  {
    id: "chat",
    icon: MessageCircleHeart,
    label: "AI Chat",
    desc: "Talk to Mano — a compassionate AI companion available 24/7.",
    accent: "bg-[#EDF4F0] text-[#3f6b53]",
    border: "border-[#B5D4C3]",
  },
  {
    id: "resources",
    icon: BookOpen,
    label: "Resource Hub",
    desc: "Guided videos and quick tips for stress, sleep, and anxiety.",
    accent: "bg-purple-50 text-purple-700",
    border: "border-purple-100",
  },
  {
    id: "peer-support",
    icon: UsersRound,
    label: "Peer Support",
    desc: "Join topic-based rooms and connect with others on similar journeys.",
    accent: "bg-teal-50 text-teal-700",
    border: "border-teal-100",
  },
]

const RESOURCE_PREVIEWS = [
  {
    category: "Stress",
    badgeClass: "badge-sage",
    title: "Box Breathing Technique",
    desc: "A simple 4-4-4-4 pattern to reset your nervous system in under 2 minutes.",
  },
  {
    category: "Sleep",
    badgeClass: "badge-lavender",
    title: "Wind-Down Ritual Guide",
    desc: "Dim lights, limit screens 30 min before bed, keep a written to-do for tomorrow.",
  },
  {
    category: "Anxiety",
    badgeClass: "badge-teal",
    title: "5-4-3-2-1 Grounding",
    desc: "Name 5 things you see, 4 you touch, 3 you hear � returns your mind to the present.",
  },
]

/* --- Helpers ------------------------------------------------- */

function getMoodStreak(entries) {
  if (!entries.length) return 0
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp)
  let streak = 1
  let prev = new Date(sorted[0].timestamp)
  prev.setHours(0, 0, 0, 0)
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i].timestamp)
    curr.setHours(0, 0, 0, 0)
    const diff = (prev - curr) / 86400000
    if (diff === 1) { streak++; prev = curr }
    else if (diff > 1) break
  }
  return streak
}

/* --- QuickMoodLog -------------------------------------------- */

function QuickMoodLog({ onDone }) {
  const { authFetch } = useAuth()
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (moodKey) => {
    setSelected(moodKey)
    setSubmitting(true)
    try {
      await authFetch("/mood", {
        method: "POST",
        body: JSON.stringify({ mood: moodKey }),
      })
    } catch (_) {}

    const raw = localStorage.getItem(MOOD_STORAGE_KEY)
    const entries = raw ? JSON.parse(raw) : []
    const today = new Date().toISOString().slice(0, 10)
    const filtered = entries.filter(
      (e) => new Date(e.timestamp).toISOString().slice(0, 10) !== today,
    )
    filtered.push({ mood: moodKey, timestamp: Date.now() })
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(filtered))

    setSubmitting(false)
    setDone(true)
    setTimeout(() => onDone?.(), 1200)
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
        <CheckCircle2 size={16} />
        Mood logged � great job!
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {MOOD_OPTIONS.map((m) => (
        <button
          key={m.key}
          type="button"
          disabled={submitting}
          onClick={() => submit(m.key)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${m.bg} ${m.text} ${selected === m.key ? `ring-2 ${m.ring} ring-offset-1` : ""} disabled:opacity-60`}
        >
          <span>{m.emoji}</span>
          {m.label}
        </button>
      ))}
    </div>
  )
}

/* --- Main Dashboard Component -------------------------------- */

export default function Dashboard({ setActiveSection }) {
  const { user, authFetch } = useAuth()
  const [moodLogged, setMoodLogged] = useState(false)
  const [streak, setStreak] = useState(0)
  const [chatCount, setChatCount] = useState(0)
  const [apptCount, setApptCount] = useState(0)
  const [peerGroups, setPeerGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(MOOD_STORAGE_KEY)
    const entries = raw ? JSON.parse(raw) : []
    setStreak(getMoodStreak(entries))

    const msgsRaw = localStorage.getItem("mano_chat_messages_v1")
    const msgs = msgsRaw ? JSON.parse(msgsRaw) : []
    const now = new Date()
    const thisMonth = msgs.filter((m) => {
      if (m.role !== "user") return false
      const d = new Date(m.timestamp || 0)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    setChatCount(thisMonth.length)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await authFetch("/appointments")
        const payload = await res.json()
        if (res.ok && payload?.success) {
          const confirmed = (payload.data || []).filter(
            (a) => a.status === "confirmed" || a.status === "completed"
          )
          setApptCount(confirmed.length)
        }
      } catch (_) {}
    })()
  }, [authFetch])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await authFetch("/groups")
        const payload = await res.json()
        if (res.ok && payload?.success) {
          setPeerGroups((payload.data || []).slice(0, 3))
        }
      } catch (_) {}
      setLoadingGroups(false)
    })()
  }, [authFetch])

  const firstName = user?.name ? user.name.split(" ")[0] : "there"

  const STATS = [
    {
      icon: Flame,
      label: "Mood streak",
      value: streak,
      unit: streak === 1 ? "day" : "days",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      icon: MessageCircleHeart,
      label: "Chat sessions",
      value: chatCount,
      unit: "this month",
      color: "text-[#5C8D72]",
      bg: "bg-[#EDF4F0]",
    },
    {
      icon: CalendarClock,
      label: "Appointments",
      value: apptCount,
      unit: "confirmed",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: Activity,
      label: "Wellness",
      value: streak > 0 ? "Active" : "Start!",
      unit: "status",
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
  ]

  return (
    <div className="space-y-8">

      {/* 1. Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#5C8D72] mb-1">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C2B2A] leading-tight">
            Welcome back, {firstName} ??
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Here&apos;s a snapshot of your wellness journey today.
          </p>
        </div>
      </div>

      {/* 2. Quick Action Panel */}
      <section className="card p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Quick actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Log Mood */}
          <div className="rounded-2xl border border-[#B5D4C3] bg-[#EDF4F0]/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#5C8D72] flex items-center justify-center text-white">
                <Smile size={15} />
              </div>
              <p className="text-sm font-bold text-[#1C2B2A]">Log your mood</p>
            </div>
            {moodLogged ? (
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                <CheckCircle2 size={15} /> Logged today!
              </div>
            ) : (
              <QuickMoodLog onDone={() => {
                setMoodLogged(true)
                setStreak((s) => s + 1)
              }} />
            )}
          </div>

          {/* Start Chat */}
          <button
            type="button"
            onClick={() => setActiveSection("chat")}
            className="rounded-2xl border border-[#B5D4C3] bg-[#EDF4F0]/40 p-4 text-left hover:bg-[#EDF4F0] transition-colors group"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#5C8D72] flex items-center justify-center text-white">
                <MessageCircleHeart size={15} />
              </div>
              <p className="text-sm font-bold text-[#1C2B2A]">Start chat</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Talk to Mano � your AI wellness companion, available any time.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#5C8D72] group-hover:gap-2 transition-all">
              Open Chat <ChevronRight size={13} />
            </div>
          </button>

          {/* Book Appointment */}
          <button
            type="button"
            onClick={() => setActiveSection("appointments")}
            className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 text-left hover:bg-purple-50 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                <CalendarClock size={15} />
              </div>
              <p className="text-sm font-bold text-[#1C2B2A]">Book appointment</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Schedule a session with a wellness specialist or therapist.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-600 group-hover:gap-2 transition-all">
              View Specialists <ChevronRight size={13} />
            </div>
          </button>

        </div>
      </section>

      {/* 3. Personal Stat Strip */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Your stats</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="card p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                  <Icon size={16} className={stat.color} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xl font-extrabold font-display leading-none ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{stat.label}</p>
                  <p className="text-[10px] text-slate-400">{stat.unit}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Feature Highlight Cards */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Your tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setActiveSection(card.id)}
                className={`card card-hover text-left p-5 border ${card.border} group`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.accent}`}>
                  <Icon size={18} />
                </div>
                <p className="font-display font-bold text-[#1C2B2A] text-sm mb-1">{card.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#5C8D72] opacity-0 group-hover:opacity-100 transition-opacity">
                  Go <ChevronRight size={12} />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 5 & 6. Resource Hub Preview + Peer Support */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Resource Hub � 3/5 */}
        <section className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resource hub</p>
            <button
              type="button"
              onClick={() => setActiveSection("resources")}
              className="text-xs font-semibold text-[#5C8D72] hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {RESOURCE_PREVIEWS.map((res) => (
              <button
                key={res.title}
                type="button"
                onClick={() => setActiveSection("resources")}
                className="card w-full text-left p-4 flex items-start gap-4 hover:shadow-md transition-shadow group"
              >
                <div className="shrink-0 mt-0.5">
                  <span className={`badge ${res.badgeClass}`}>{res.category}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1C2B2A] text-sm">{res.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{res.desc}</p>
                </div>
                <ChevronRight size={15} className="shrink-0 text-slate-300 group-hover:text-[#5C8D72] mt-1 transition-colors" />
              </button>
            ))}
          </div>
        </section>

        {/* Peer Support � 2/5 */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Peer support</p>
            <button
              type="button"
              onClick={() => setActiveSection("peer-support")}
              className="text-xs font-semibold text-[#5C8D72] hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>

          {loadingGroups ? (
            <div className="card p-6 text-center text-sm text-slate-400">Loading groups�</div>
          ) : peerGroups.length === 0 ? (
            <div className="card p-6 text-center">
              <UsersRound size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No groups yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {peerGroups.map((group) => (
                <button
                  key={group._id}
                  type="button"
                  onClick={() => setActiveSection("peer-support")}
                  className="card w-full text-left p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                      <UsersRound size={14} className="text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1C2B2A] text-sm truncate">{group.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {group.joined ? (
                          <span className="text-emerald-600 font-semibold">Joined</span>
                        ) : (
                          "Tap to join"
                        )}
                      </p>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-slate-300 group-hover:text-[#5C8D72] mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Encouraging note */}
          <div className="rounded-2xl bg-[#EDF4F0] border border-[#B5D4C3] p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-[#5C8D72]" />
              <p className="text-xs font-bold text-[#3f6b53] uppercase tracking-wider">Reminder</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Progress is not linear. You are doing better than you think.
            </p>
          </div>
        </section>

      </div>

    </div>
  )
}
