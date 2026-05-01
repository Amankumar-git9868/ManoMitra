import { useEffect, useMemo, useState } from 'react'
import {
  BookOpenText,
  ChartColumn,
  Brain,
  CalendarClock,
  CircleUserRound,
  Clock3,
  Compass,
  LayoutDashboard,
  Languages,
  MessageCircleHeart,
  Search,
  ShieldCheck,
  Smile,
  UsersRound,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from './auth/authContext.js'
import { getFromStorage, removeFromStorage, saveToStorage } from './utils/storage.js'
import { countBy, keywordInsights, mostFrequentKey, toPercentages } from './utils/analytics.js'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_ENDPOINTS = [
  {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash',
  },
  {
    url: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash',
  },
  {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    model: 'gemini-2.0-flash',
  },
]

const SUPPORTIVE_SYSTEM_PROMPT = `You are Mano-Mitra, a supportive mental wellness assistant.
Rules:
- Keep a calm, empathetic, non-judgmental tone.
- Give practical coping suggestions (breathing, grounding, journaling, short breaks, hydration, talking to trusted people).
- Encourage seeking help from a trusted person or counselor when needed.
- Never provide medical diagnosis, medication advice, or clinical treatment claims.
- Keep responses short and beginner-friendly (3-6 lines).`

const initialAssistantMessage = {
  id: 'seed-1',
  role: 'ai',
  text: 'Hi, I am here to support you. Share what you are feeling, and we can take one small step together.',
  sentiment: 'neutral',
}

const CHAT_STORAGE_KEY = 'mano_chat_messages_v2'
const MOOD_STORAGE_KEY = 'mano_mood_entries_v1'
const APPOINTMENTS_STORAGE_KEY = 'mano_appointments_v1'

const normalizeStoredChat = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      role: item.role === 'user' || item.role === 'ai' ? item.role : 'ai',
      text: typeof item.text === 'string' ? item.text : '',
      timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
    }))
    .filter((item) => item.text.trim().length > 0)
}

const normalizeMoodEntries = (value) => {
  if (!Array.isArray(value)) return []
  const allowed = new Set(['happy', 'neutral', 'stressed'])
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      mood: allowed.has(item.mood) ? item.mood : 'neutral',
      timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
    }))
}

const normalizeAppointments = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      date: typeof item.date === 'string' ? item.date : '',
      time: typeof item.time === 'string' ? item.time : '',
      reason: typeof item.reason === 'string' ? item.reason : '',
      timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
    }))
    .filter((a) => a.date && a.time)
}

const moodOptions = [
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'stressed', emoji: '😟', label: 'Stressed' },
]

const distressPattern =
  /\b(suicide|kill myself|end my life|self harm|self-harm|hopeless|i want to die)\b/i
const GEMINI_COOLDOWN_KEY = 'mano_gemini_cooldown_until'

const buildFallbackResponse = (message) => {
  if (distressPattern.test(message)) {
    return 'I am really glad you shared this. You are not alone. Please consider reaching out to a trusted person or counselor right now. If you are in immediate danger, contact local emergency services. For this moment, try slow 4-4 breathing and stay with someone you trust.'
  }

  return 'Thank you for sharing that. It sounds like this has been heavy. A gentle next step could be: take 5 slow breaths, drink some water, and write one small thing you can do in the next 10 minutes. If it helps, we can break your situation into manageable steps together.'
}

const callGemini = async (message) => {
  const cooldownUntil = Number(localStorage.getItem(GEMINI_COOLDOWN_KEY) || 0)
  if (cooldownUntil && Date.now() < cooldownUntil) {
    throw new Error('Gemini is temporarily paused due to quota limits.')
  }

  let lastError = 'Gemini request failed.'

  for (const endpoint of GEMINI_ENDPOINTS) {
    const response = await fetch(`${endpoint.url}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${SUPPORTIVE_SYSTEM_PROMPT}\n\nUser message: "${message}"`,
              },
            ],
          },
        ],
      }),
    })

    const payload = await response.json()
    const aiResponse =
      payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('\n')
        .trim() || ''

    if (response.ok && aiResponse) {
      return { text: aiResponse, model: endpoint.model }
    }

    lastError = payload?.error?.message || `Gemini request failed (${response.status}).`

    const isQuotaError =
      typeof lastError === 'string' &&
      (lastError.toLowerCase().includes('quota exceeded') ||
        lastError.toLowerCase().includes('rate limit'))

    if (isQuotaError) {
      const retryMatch = lastError.match(/retry in ([0-9.]+)s/i)
      const retrySeconds = retryMatch ? Number(retryMatch[1]) : 60
      const cooldownUntilMs = Date.now() + Math.ceil(retrySeconds * 1000)
      localStorage.setItem(GEMINI_COOLDOWN_KEY, String(cooldownUntilMs))
      throw new Error('Gemini quota exceeded. Using fallback assistant for now.')
    }
  }

  throw new Error(lastError)
}

function App() {
  const { user, logout, authFetch } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [chatMessages, setChatMessages] = useState(() => {
    const stored = normalizeStoredChat(getFromStorage(CHAT_STORAGE_KEY, []))
    return stored.length
      ? stored
      : [{ role: 'ai', text: initialAssistantMessage.text, timestamp: Date.now() }]
  })
  useEffect(() => {
    saveToStorage(CHAT_STORAGE_KEY, normalizeStoredChat(chatMessages))
  }, [chatMessages])

  const [selectedMood, setSelectedMood] = useState('neutral')
  const [moodSubmitting, setMoodSubmitting] = useState(false)
  const [moodError, setMoodError] = useState('')
  const [moodSeries, setMoodSeries] = useState([])
  const [localMoodSeries, setLocalMoodSeries] = useState([])
  const [moodEntries, setMoodEntries] = useState(() =>
    normalizeMoodEntries(getFromStorage(MOOD_STORAGE_KEY, [])),
  )
  const [moodTrend, setMoodTrend] = useState('neutral')
  const [moodInsight, setMoodInsight] = useState(
    'Start logging your mood to see your weekly trend.',
  )
  const [resourceLanguage, setResourceLanguage] = useState('en')
  const [adminError, setAdminError] = useState('')
  const [appointmentForm, setAppointmentForm] = useState({
    specialist: 'Clinical Psychologist',
    sessionType: 'Video Session',
    date: '',
    time: '',
    reason: '',
  })
  const [appointmentStatus, setAppointmentStatus] = useState('idle') // idle | booked
  const [appointmentError, setAppointmentError] = useState('')
  const [appointmentSuccess, setAppointmentSuccess] = useState('')
  const [supportGroups, setSupportGroups] = useState([
    {
      id: 'night-owls',
      name: 'Night Owls Circle',
      meta: '18 members active . Focus: sleep anxiety',
      joined: false,
    },
    {
      id: 'students',
      name: 'Students Support Group',
      meta: '26 members active . Focus: exam stress',
      joined: false,
    },
  ])
  const [supportActionMessage, setSupportActionMessage] = useState('')

  const navItems = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'chat', label: 'AI Chat', icon: MessageCircleHeart },
      { id: 'appointments', label: 'Appointments', icon: CalendarClock },
      { id: 'resources', label: 'Resource Hub', icon: Compass },
      { id: 'peer-support', label: 'Peer Support', icon: UsersRound },
      { id: 'mood', label: 'Mood Tracker', icon: Smile },
      { id: 'admin', label: 'Admin', icon: ChartColumn },
    ],
    [],
  )

  const resourceHubContent = {
    en: {
      title: 'Resource Hub',
      subtitle: 'Explore trusted self-help content for daily emotional support.',
      categories: [
        {
          title: 'Stress Management',
          accent: 'from-rose-100 to-orange-50',
          videos: [
            {
              title: 'Box Breathing for Stress Relief',
              embedUrl: 'https://www.youtube.com/embed/tEmt1Znux58',
            },
            {
              title: '2-Minute Guided Reset',
              embedUrl: 'https://www.youtube.com/embed/SEfs5TJZ6Nk',
            },
          ],
          tips: [
            'Pause for 60 seconds and notice one thing you can control right now.',
            'Step away from the screen, stretch your shoulders, and sip some water.',
            'Break one big task into the smallest next action.',
          ],
        },
        {
          title: 'Sleep Improvement',
          accent: 'from-indigo-100 to-sky-50',
          videos: [
            {
              title: 'Wind Down Before Bed',
              embedUrl: 'https://www.youtube.com/embed/aEqlQvczMJQ',
            },
            {
              title: 'Relaxing Breathing for Sleep',
              embedUrl: 'https://www.youtube.com/embed/1vx8iUvfyCY',
            },
          ],
          tips: [
            'Try dimming lights and reducing phone use 30 minutes before sleep.',
            'Keep a simple bedtime routine so your body gets a predictable signal.',
            'If thoughts feel noisy, write tomorrow’s tasks on paper and set them aside.',
          ],
        },
        {
          title: 'Anxiety Help',
          accent: 'from-emerald-100 to-teal-50',
          videos: [
            {
              title: 'Grounding Exercise for Anxiety',
              embedUrl: 'https://www.youtube.com/embed/30VMIEmA114',
            },
            {
              title: 'Gentle Support for Overthinking',
              embedUrl: 'https://www.youtube.com/embed/O-6f5wQXSu8',
            },
          ],
          tips: [
            'Name five things you can see, four you can touch, and three you can hear.',
            'Remind yourself: this feeling is real, but it will not stay at this peak forever.',
            'Reach out to a trusted friend or family member if you need company.',
          ],
        },
      ],
    },
    hi: {
      title: 'रिसोर्स हब',
      subtitle: 'रोज़मर्रा के भावनात्मक सहारे के लिए उपयोगी और भरोसेमंद सामग्री देखें।',
      categories: [
        {
          title: 'तनाव प्रबंधन',
          accent: 'from-rose-100 to-orange-50',
          videos: [
            {
              title: 'तनाव कम करने के लिए बॉक्स ब्रीदिंग',
              embedUrl: 'https://www.youtube.com/embed/tEmt1Znux58',
            },
            {
              title: '2 मिनट का गाइडेड रीसेट',
              embedUrl: 'https://www.youtube.com/embed/SEfs5TJZ6Nk',
            },
          ],
          tips: [
            '60 सेकंड रुकें और देखें कि अभी कौन-सी एक चीज़ आपके नियंत्रण में है।',
            'स्क्रीन से थोड़ा हटें, कंधों को स्ट्रेच करें, और पानी पिएं।',
            'एक बड़े काम को सबसे छोटे अगले कदम में बांटें।',
          ],
        },
        {
          title: 'बेहतर नींद',
          accent: 'from-indigo-100 to-sky-50',
          videos: [
            {
              title: 'सोने से पहले मन शांत करना',
              embedUrl: 'https://www.youtube.com/embed/aEqlQvczMJQ',
            },
            {
              title: 'नींद के लिए रिलैक्सिंग ब्रीदिंग',
              embedUrl: 'https://www.youtube.com/embed/1vx8iUvfyCY',
            },
          ],
          tips: [
            'सोने से 30 मिनट पहले रोशनी कम करें और फोन का उपयोग घटाएं।',
            'एक सरल सोने की दिनचर्या रखें ताकि शरीर को नियमित संकेत मिले।',
            'अगर विचार बहुत तेज़ हों, तो कल के काम कागज़ पर लिखकर अलग रख दें।',
          ],
        },
        {
          title: 'एंग्जायटी सहायता',
          accent: 'from-emerald-100 to-teal-50',
          videos: [
            {
              title: 'एंग्जायटी के लिए ग्राउंडिंग एक्सरसाइज़',
              embedUrl: 'https://www.youtube.com/embed/30VMIEmA114',
            },
            {
              title: 'ओवरथिंकिंग के लिए सौम्य सहारा',
              embedUrl: 'https://www.youtube.com/embed/O-6f5wQXSu8',
            },
          ],
          tips: [
            '5 चीज़ें देखें, 4 छुएं, और 3 आवाज़ें सुनें।',
            'खुद को याद दिलाएं: यह भावना अभी तीव्र है, लेकिन हमेशा ऐसी नहीं रहेगी।',
            'ज़रूरत हो तो किसी भरोसेमंद दोस्त या परिवार के सदस्य से बात करें।',
          ],
        },
      ],
    },
  }

  const resourceView = resourceHubContent[resourceLanguage]
  const [appointments, setAppointments] = useState(() =>
    normalizeAppointments(getFromStorage(APPOINTMENTS_STORAGE_KEY, [])),
  )

  const isDashboardView = activeSection === 'dashboard'
  const isChatView = activeSection === 'chat'
  const isAppointmentView = activeSection === 'appointments'
  const isResourceView = activeSection === 'resources'
  const isPeerSupportView = activeSection === 'peer-support'
  const isMoodView = activeSection === 'mood'
  const isAdminView = activeSection === 'admin'

  const localAdmin = useMemo(() => {
    // Mood analytics (from persisted moodEntries state; originally loaded from localStorage)
    const moodCountMap = countBy(moodEntries, (e) => e.mood)
    const mostFrequentMood = mostFrequentKey(moodCountMap)
    const moodPercentages = toPercentages(moodCountMap)

    const wantedMoods = ['happy', 'stressed', 'anxious', 'sad']
    const moodCards = wantedMoods.map((mood) => ({
      mood,
      count: moodCountMap.get(mood) || 0,
      total: moodEntries.length,
      percent: moodEntries.length ? Math.round(((moodCountMap.get(mood) || 0) / moodEntries.length) * 100) : 0,
    }))

    const recentMoods = [...moodEntries]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8)
      .map((m) => ({
        mood: m.mood,
        time: new Date(m.timestamp).toLocaleString(),
      }))

    // Appointment analytics
    const totalAppointments = appointments.length
    const recentAppointments = [...appointments]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6)

    // Chat insights (only user messages)
    const userChatMessages = (chatMessages || []).filter((m) => m.role === 'user')
    const counts = keywordInsights(userChatMessages, ['stress', 'anxiety', 'sad', 'sleep'])

    return {
      moodCards,
      moodPercentages,
      mostFrequentMood,
      totalMoodEntries: moodEntries.length,
      recentMoods,
      totalAppointments,
      recentAppointments,
      chatKeywordCounts: counts,
      totalChatMessages: userChatMessages.length,
    }
  }, [appointments, chatMessages, moodEntries])
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const searchActive = isResourceView || isPeerSupportView
  const effectiveSearch = searchActive ? normalizedSearch : ''
  const filteredResourceCategories = resourceView.categories
    .map((category) => {
      if (!effectiveSearch) return category
      const categoryMatch = category.title.toLowerCase().includes(effectiveSearch)
      const matchedVideos = category.videos.filter((video) =>
        video.title.toLowerCase().includes(effectiveSearch),
      )
      const matchedTips = category.tips.filter((tip) =>
        tip.toLowerCase().includes(effectiveSearch),
      )
      if (categoryMatch || matchedVideos.length || matchedTips.length) {
        return {
          ...category,
          videos: categoryMatch ? category.videos : matchedVideos,
          tips: categoryMatch ? category.tips : matchedTips,
        }
      }
      return null
    })
    .filter(Boolean)

  useEffect(() => {
    saveToStorage(MOOD_STORAGE_KEY, moodEntries)
  }, [moodEntries])

  useEffect(() => {
    saveToStorage(APPOINTMENTS_STORAGE_KEY, appointments)
  }, [appointments])

  const combinedMoodSeries = (moodSeries?.length ? moodSeries : localMoodSeries) || []
  const moodChartData = combinedMoodSeries.map((point) => ({
    ...point,
    moodScore: Number(point.moodScore) || 0,
  }))
  const hasMoodData = moodChartData.some((point) => point.moodScore > 0)

  const fetchMoodHistory = async () => {
    try {
      const response = await authFetch('/mood/history', { method: 'GET' })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Unable to fetch mood history.')
      }
      setMoodSeries(payload.data.series || [])
      setMoodTrend(payload.data.trend || 'neutral')
      setMoodInsight(payload.data.message || 'Keep tracking your mood each day.')
    } catch (error) {
      setMoodError(error.message || 'Could not load mood chart.')
    }
  }

  const upsertTodayLocalMood = (moodType) => {
    const scoreMap = { happy: 3, neutral: 2, stressed: 1 }
    const score = scoreMap[moodType] || 2
    const today = new Date()
    const key = today.toISOString().slice(0, 10)
    const label = today.toLocaleDateString('en-US', { weekday: 'short' })

    setLocalMoodSeries((prev) => {
      const base = prev.length
        ? [...prev]
        : [...Array(7)].map((_, idx) => {
            const day = new Date(today)
            day.setDate(today.getDate() - (6 - idx))
            const dateKey = day.toISOString().slice(0, 10)
            return {
              date: dateKey,
              label: day.toLocaleDateString('en-US', { weekday: 'short' }),
              moodScore: 0,
              moodType: 'none',
            }
          })

      const index = base.findIndex((item) => item.date === key)
      if (index >= 0) {
        base[index] = { ...base[index], moodScore: score, moodType }
      } else {
        base.push({ date: key, label, moodScore: score, moodType })
      }
      return base
    })
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchMoodHistory()
    }, 0)

    return () => window.clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isAdminView) return
    // Local analytics dashboard does not call backend by default.
    const timeoutId = window.setTimeout(() => setAdminError(''), 0)
    return () => window.clearTimeout(timeoutId)
  }, [isAdminView])

  const sendChatMessage = async (event) => {
    event.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed || chatLoading) return

    const userMessage = {
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setChatError('')
    setChatLoading(true)

    try {
      if (!GEMINI_API_KEY) {
        const primaryResponse = await authFetch('/chat', {
          method: 'POST',
          body: JSON.stringify({ message: trimmed }),
        })
        let primaryPayload = await primaryResponse.json()

        const shouldFallbackToPublic =
          primaryResponse.status === 401 &&
          typeof primaryPayload?.message === 'string' &&
          primaryPayload.message.toLowerCase().includes('user not found')

        if (shouldFallbackToPublic) {
          const publicResponse = await fetch(`${API_BASE}/chat/public`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: trimmed }),
          })
          primaryPayload = await publicResponse.json()
          if (!publicResponse.ok || !primaryPayload?.success) {
            throw new Error(primaryPayload?.message || 'Unable to get chat response.')
          }
          setChatMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              text: primaryPayload.data.aiResponse,
              timestamp: Date.now(),
            },
          ])
          return
        }

        if (!primaryResponse.ok || !primaryPayload?.success) {
          throw new Error(primaryPayload?.message || 'Unable to get chat response.')
        }

        setChatMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: primaryPayload.data.aiResponse,
            timestamp: Date.now(),
          },
        ])
        return
      }

      const gemini = await callGemini(trimmed)

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: gemini.text,
          timestamp: Date.now(),
        },
      ])
    } catch (error) {
      const fallback = buildFallbackResponse(trimmed)
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: fallback,
          timestamp: Date.now(),
        },
      ])

      setChatError(error?.message || 'Temporary AI issue. Showing a supportive fallback response for now.')
    } finally {
      setChatLoading(false)
    }
  }

  const submitMood = async () => {
    if (moodSubmitting) return
    setMoodSubmitting(true)
    setMoodError('')
    upsertTodayLocalMood(selectedMood)
    setMoodEntries((prev) => [...prev, { mood: selectedMood, timestamp: Date.now() }])
    try {
      const response = await authFetch('/mood', {
        method: 'POST',
        body: JSON.stringify({ moodType: selectedMood }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Could not save mood.')
      }
      await fetchMoodHistory()
    } catch (error) {
      setMoodError(error.message || 'Could not save mood.')
      setMoodInsight('Saved locally for now. Backend sync will resume when connection is stable.')
    } finally {
      setMoodSubmitting(false)
    }
  }

  const resetConversation = () => {
    setChatMessages([{ role: 'ai', text: initialAssistantMessage.text, timestamp: Date.now() }])
    setChatInput('')
    setChatError('')
    removeFromStorage(CHAT_STORAGE_KEY)
  }

  const requestAppointment = (event) => {
    event.preventDefault()
    setAppointmentError('')
    setAppointmentSuccess('')

    const { specialist, date, time, reason } = appointmentForm

    if (!date || !time) {
      setAppointmentError('Please select a date and time.')
      return
    }

    const when = new Date(`${date}T${time}`)
    if (Number.isNaN(when.getTime())) {
      setAppointmentError('Invalid date/time.')
      return
    }

    setAppointments((prev) => [
      {
        date,
        time,
        reason: reason || specialist,
        timestamp: Date.now(),
      },
      ...prev,
    ])

    setAppointmentStatus('booked')
    setAppointmentSuccess('Booked. Your appointment request has been added to Upcoming Appointments.')
  }

  const joinSupportGroup = (groupId) => {
    setSupportGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, joined: !group.joined } : group,
      ),
    )
    const group = supportGroups.find((item) => item.id === groupId)
    if (group) {
      setSupportActionMessage(
        group.joined ? `You left ${group.name}.` : `You joined ${group.name}.`,
      )
    }
  }

  const joinAnySupportGroup = () => {
    const next = supportGroups.find((group) => !group.joined) || supportGroups[0]
    if (next) joinSupportGroup(next.id)
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white/85 shadow-2xl shadow-slate-300/40 backdrop-blur-sm md:min-h-[calc(100vh-3rem)]">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-gradient-to-b from-indigo-900 to-indigo-950 p-6 text-indigo-100 md:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2">
              <Brain size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-200">Mano-Mitra</p>
              <h1 className="text-lg font-semibold">Care Workspace</h1>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    isActive ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-100 hover:bg-indigo-800'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              )
            })}
          </nav>
          <div className="mt-auto rounded-2xl bg-white/10 p-4 text-sm">
            <p className="mb-1 font-medium">Daily reminder</p>
            <p className="text-indigo-200">Progress is not linear. You are doing better than you think.</p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Tuesday, Apr 28</p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Welcome back{user?.name ? `, ${user.name}` : ''}
              </h2>
            </div>
            <div className="relative flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-500">
                <Search size={16} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-44 border-none bg-transparent text-sm text-slate-700 outline-none"
                  placeholder="Search resources, groups..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-indigo-700"
              >
                <CircleUserRound size={20} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-24 top-24 z-20 w-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Signed in as</p>
                  <p className="mt-1 font-semibold text-slate-900">{user?.name || 'User'}</p>
                  <p className="text-sm text-slate-600">{user?.email}</p>
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('admin')
                        setProfileMenuOpen(false)
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Open Admin Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full rounded-xl border border-rose-200 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </header>

          {(isDashboardView || isChatView) && (
            <article className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">AI Chat Support</h3>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Always available</span>
              </div>
              <div className="space-y-2">
                {chatMessages.map((message) => (
                  <div
                    key={message.timestamp}
                    className={`rounded-xl px-3 py-2 text-sm ${message.role === 'user' ? 'bg-indigo-50 text-indigo-900' : 'bg-slate-50 text-slate-700'}`}
                  >
                    <p>{message.text}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
              <form onSubmit={sendChatMessage} className="mt-4 space-y-3">
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Type what you are feeling..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                />
                {chatError && <p className="text-sm text-rose-600">{chatError}</p>}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={chatLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    <MessageCircleHeart size={16} />
                    {chatLoading ? 'Sending...' : 'Send Message'}
                  </button>
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Start New Conversation
                  </button>
                </div>
              </form>
            </article>
          )}

          {(isDashboardView ||
            isAppointmentView ||
            isResourceView ||
            isPeerSupportView ||
            isMoodView ||
            isAdminView) && (
            <section className="grid gap-5 xl:grid-cols-3">
              <div className="space-y-5 xl:col-span-2">
                {isAdminView && (
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Admin Analytics (Local)</h3>
                        <p className="text-sm text-slate-600">
                          Uses only your browser localStorage data (no personal user data).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // quick refresh: re-read persisted state (already in memory), also clears any UI errors
                          setAdminError('')
                          setSupportActionMessage('')
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Refresh
                      </button>
                    </div>

                    {adminError && (
                      <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                        {adminError}
                      </div>
                    )}

                    <div className="mb-5 grid gap-3 md:grid-cols-4">
                      {[
                        { label: 'Total Mood Entries', value: localAdmin.totalMoodEntries },
                        { label: 'Most Frequent Mood', value: localAdmin.mostFrequentMood.key || '—' },
                        { label: 'Total Appointments', value: localAdmin.totalAppointments },
                        { label: 'User Chat Messages', value: localAdmin.totalChatMessages },
                      ].map((card) => (
                        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm text-slate-500">{card.label}</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">Mood Analytics</p>
                          <p className="text-xs text-slate-500">localStorage</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {localAdmin.moodCards.map((m) => (
                            <div key={m.mood} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-sm font-medium capitalize text-slate-800">{m.mood}</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-900">{m.count}</p>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                <div className="h-full bg-indigo-600" style={{ width: `${m.percent}%` }} />
                              </div>
                              <p className="mt-1 text-xs text-slate-500">{m.percent}%</p>
                            </div>
                          ))}
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                          Note: if you only track Happy/Neutral/Stressed right now, Anxious/Sad may show as 0.
                        </p>
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">Chat Insights</p>
                          <p className="text-xs text-slate-500">keyword counts</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Object.entries(localAdmin.chatKeywordCounts).map(([k, v]) => (
                            <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-sm font-medium text-slate-800">{k}</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-900">{v}</p>
                              <p className="mt-1 text-xs text-slate-500">messages containing keyword</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-2">
                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">Recent Moods</p>
                          <p className="text-xs text-slate-500">latest</p>
                        </div>
                        {localAdmin.recentMoods.length === 0 ? (
                          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                            No moods saved yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {localAdmin.recentMoods.map((m) => (
                              <div key={m.time} className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-sm font-medium capitalize text-slate-800">{m.mood}</p>
                                <p className="text-xs text-slate-500">{m.time}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">Recent Appointments</p>
                          <p className="text-xs text-slate-500">latest</p>
                        </div>
                        {localAdmin.recentAppointments.length === 0 ? (
                          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                            No appointments booked yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {localAdmin.recentAppointments.map((a) => (
                              <div key={a.timestamp} className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-sm font-medium text-slate-800">{a.reason || 'Appointment'}</p>
                                <p className="text-xs text-slate-500">{a.date} · {a.time}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    </div>
                  </article>
                )}
                {(isDashboardView || isAppointmentView) && (
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Appointment Booking</h3>
                      <CalendarClock size={20} className="text-indigo-600" />
                    </div>
                    <form onSubmit={requestAppointment}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-1 text-sm">
                          <span className="text-slate-600">Preferred specialist</span>
                          <select
                            value={appointmentForm.specialist}
                            onChange={(e) =>
                              setAppointmentForm((prev) => ({
                                ...prev,
                                specialist: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none"
                          >
                            <option>Clinical Psychologist</option>
                            <option>Wellness Coach</option>
                            <option>Therapist</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-sm">
                          <span className="text-slate-600">Session type</span>
                          <select
                            value={appointmentForm.sessionType}
                            onChange={(e) =>
                              setAppointmentForm((prev) => ({
                                ...prev,
                                sessionType: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none"
                          >
                            <option>Video Session</option>
                            <option>In-Person</option>
                            <option>Phone Call</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-sm">
                          <span className="text-slate-600">Date</span>
                          <input
                            type="date"
                            value={appointmentForm.date}
                            onChange={(e) =>
                              setAppointmentForm((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none"
                          />
                        </label>
                        <label className="space-y-1 text-sm">
                          <span className="text-slate-600">Time</span>
                          <input
                            type="time"
                            value={appointmentForm.time}
                            onChange={(e) =>
                              setAppointmentForm((prev) => ({
                                ...prev,
                                time: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none"
                          />
                        </label>
                        <label className="space-y-1 text-sm md:col-span-2">
                          <span className="text-slate-600">Reason</span>
                          <input
                            type="text"
                            value={appointmentForm.reason}
                            onChange={(e) =>
                              setAppointmentForm((prev) => ({
                                ...prev,
                                reason: e.target.value,
                              }))
                            }
                            placeholder="e.g., Stress, anxiety, sleep issues..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none"
                          />
                        </label>
                      </div>

                      {appointmentError && (
                        <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                          {appointmentError}
                        </p>
                      )}
                      {appointmentSuccess && (
                        <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                          {appointmentSuccess}
                        </p>
                      )}

                      <button
                        type="submit"
                        className={`mt-4 rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
                          appointmentStatus === 'booked'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-slate-900 hover:bg-slate-700'
                        }`}
                      >
                        {appointmentStatus === 'booked' ? 'Booked' : 'Request Appointment'}
                      </button>
                    </form>
                  </article>
                )}

                {(isDashboardView || isAppointmentView) && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Upcoming Appointments</h3>
                    <div className="space-y-3">
                      {appointments.length === 0 ? (
                        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                          No appointments booked yet.
                        </div>
                      ) : (
                        appointments.map((slot) => (
                          <div
                            key={slot.timestamp}
                            className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="font-medium text-slate-800">{slot.reason || 'Appointment'}</p>
                              <p className="text-sm text-slate-500">{slot.date}</p>
                            </div>
                            <div className="text-sm text-slate-600">
                              <p>{slot.time}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-5">
                {(isDashboardView || isMoodView) && (
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-slate-900">Mood Tracker</h3>
                    <p className="mb-3 text-sm text-slate-600">How are you feeling today?</p>
                    <div className="mb-4 flex gap-2">
                      {moodOptions.map((mood) => (
                        <button
                          key={mood.key}
                          type="button"
                          onClick={() => setSelectedMood(mood.key)}
                          className={`rounded-xl border px-3 py-2 text-sm ${selectedMood === mood.key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                        >
                          <span className="mr-2">{mood.emoji}</span>
                          {mood.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={submitMood}
                      disabled={moodSubmitting}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    >
                      {moodSubmitting ? 'Saving...' : 'Save Mood'}
                    </button>
                    {moodError && <p className="mt-2 text-sm text-rose-600">{moodError}</p>}
                    <div className="mt-4 h-44 w-full">
                      {hasMoodData ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={moodChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="moodScore"
                              stroke="#4f46e5"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
                          No mood data yet. Save your mood to see the last 7 days chart.
                        </div>
                      )}
                    </div>
                    <p
                      className={`mt-3 rounded-xl px-3 py-2 text-sm ${
                        moodTrend === 'positive'
                          ? 'bg-emerald-50 text-emerald-700'
                          : moodTrend === 'negative'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {moodInsight}
                    </p>
                  </article>
                )}

                {(isDashboardView || isResourceView) && (
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{resourceView.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{resourceView.subtitle}</p>
                      </div>
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        {[
                          { key: 'en', label: 'English' },
                          { key: 'hi', label: 'Hindi' },
                        ].map((language) => (
                          <button
                            key={language.key}
                            type="button"
                            onClick={() => setResourceLanguage(language.key)}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                              resourceLanguage === language.key
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-600'
                            }`}
                          >
                            <Languages size={14} />
                            {language.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-5">
                      {filteredResourceCategories.map((category) => (
                        <section
                          key={category.title}
                          className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${category.accent} p-4`}
                        >
                          <div className="mb-4 flex items-center gap-2">
                            <span className="rounded-lg bg-white/80 p-2 text-indigo-700">
                              <Compass size={16} />
                            </span>
                            <h4 className="text-base font-semibold text-slate-900">
                              {category.title}
                            </h4>
                          </div>

                          <div className="grid gap-4 xl:grid-cols-2">
                            {category.videos.map((video) => (
                              <div
                                key={video.title}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                              >
                                <div className="aspect-video">
                                  <iframe
                                    className="h-full w-full"
                                    src={video.embedUrl}
                                    title={video.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                                <div className="border-t border-slate-100 p-3">
                                  <p className="text-sm font-medium text-slate-800">{video.title}</p>
                                  <a
                                    href={video.embedUrl.replace('/embed/', '/watch?v=')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block text-xs font-medium text-indigo-700 hover:underline"
                                  >
                                    Open on YouTube
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 rounded-2xl bg-white/90 p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <BookOpenText size={16} className="text-indigo-700" />
                              <p className="text-sm font-semibold text-slate-900">
                                {resourceLanguage === 'en' ? 'Quick Tips' : 'त्वरित सुझाव'}
                              </p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              {category.tips.map((tip) => (
                                <div
                                  key={tip}
                                  className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700"
                                >
                                  {tip}
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>
                      ))}
                      {filteredResourceCategories.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                          No resource matches found for "{searchQuery}".
                        </div>
                      )}
                    </div>
                  </article>
                )}

                {(isDashboardView || isPeerSupportView) && (
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Peer Support Circle</h3>
                    <div className="space-y-3 text-sm text-slate-700">
                      {supportActionMessage && (
                        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          {supportActionMessage}
                        </p>
                      )}
                      {supportGroups
                        .filter((group) =>
                          effectiveSearch
                            ? `${group.name} ${group.meta}`.toLowerCase().includes(effectiveSearch)
                            : true,
                        )
                        .map((group) => (
                          <div
                            key={group.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <p className="font-medium">{group.name}</p>
                            <p className="text-xs text-slate-500">{group.meta}</p>
                            <button
                              type="button"
                              onClick={() => joinSupportGroup(group.id)}
                              className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                group.joined
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {group.joined ? 'Joined' : 'Join Group'}
                            </button>
                          </div>
                        ))}
                      <button
                        type="button"
                        onClick={joinAnySupportGroup}
                        className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 font-medium text-indigo-700 transition hover:bg-indigo-100"
                      >
                        Join a Support Group
                      </button>
                    </div>
                  </article>
                )}

                {isDashboardView && (
                  <article className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-slate-100 shadow-sm">
                    <h3 className="mb-2 text-lg font-semibold">Trust & Privacy</h3>
                    <p className="mb-4 text-sm text-slate-300">Your chats and wellness data are designed with privacy-first defaults.</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /><span>Confidential sessions</span></div>
                      <div className="flex items-center gap-2"><Clock3 size={16} className="text-sky-400" /><span>24/7 AI support availability</span></div>
                    </div>
                  </article>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
