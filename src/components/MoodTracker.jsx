import { useState, useEffect } from 'react'
import { Smile } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../auth/authContext.js'
import { getFromStorage, saveToStorage } from '../utils/storage.js'

const MOOD_STORAGE_KEY = 'mano_mood_entries_v1'

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

const moodOptions = [
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'stressed', emoji: '😟', label: 'Stressed' },
]

export default function MoodTracker() {
  const { authFetch } = useAuth()
  const [selectedMood, setSelectedMood] = useState('neutral')
  const [moodSubmitting, setMoodSubmitting] = useState(false)
  const [moodError, setMoodError] = useState('')
  const [moodSeries, setMoodSeries] = useState([])
  const [localMoodSeries, setLocalMoodSeries] = useState([])
  const [moodTrend, setMoodTrend] = useState('neutral')
  const [moodInsight, setMoodInsight] = useState('Start logging your mood to see your weekly trend.')
  const [moodEntries, setMoodEntries] = useState(() => normalizeMoodEntries(getFromStorage(MOOD_STORAGE_KEY, [])))

  useEffect(() => {
    saveToStorage(MOOD_STORAGE_KEY, moodEntries)
  }, [moodEntries])

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

  useEffect(() => {
    fetchMoodHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const combinedMoodSeries = (moodSeries?.length ? moodSeries : localMoodSeries) || []
  const moodChartData = combinedMoodSeries.map((point) => ({
    ...point,
    moodScore: Number(point.moodScore) || 0,
  }))
  const hasMoodData = moodChartData.some((point) => point.moodScore > 0)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-teal-100 p-2 text-teal-600">
          <Smile size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Mood Tracker</h3>
          <p className="text-sm text-slate-500">How are you feeling today?</p>
        </div>
      </div>

      <div className="mb-6 flex gap-3 flex-wrap">
        {moodOptions.map((mood) => (
          <button
            key={mood.key}
            type="button"
            onClick={() => setSelectedMood(mood.key)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              selectedMood === mood.key
                ? 'border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500'
                : 'border-slate-200 text-slate-600 hover:border-teal-300'
            }`}
          >
            <span className="text-lg">{mood.emoji}</span>
            {mood.label}
          </button>
        ))}
      </div>
      
      <button
        type="button"
        onClick={submitMood}
        disabled={moodSubmitting}
        className="w-full md:w-auto rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
      >
        {moodSubmitting ? 'Saving...' : 'Save Today\'s Mood'}
      </button>
      
      {moodError && <p className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-600">{moodError}</p>}
      
      <div className="mt-8">
        <h4 className="text-sm font-semibold text-slate-800 mb-4">Your 7-Day Trend</h4>
        <div className="h-48 w-full bg-slate-50 border border-slate-100 rounded-xl p-4">
          {hasMoodData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line
                  type="monotone"
                  dataKey="moodScore"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#0d9488', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
              No mood data yet. Save your mood to see your chart.
            </div>
          )}
        </div>
      </div>
      
      <p
        className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
          moodTrend === 'positive'
            ? 'bg-emerald-50 text-emerald-700'
            : moodTrend === 'negative'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-50 text-slate-600'
        }`}
      >
        {moodInsight}
      </p>
    </article>
  )
}
