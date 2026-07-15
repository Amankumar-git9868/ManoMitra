import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, ChevronDown, CheckCircle2 } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function Landing() {
  const [stats, setStats] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API_BASE}/admin/stats/public`)
      .then(res => res.json())
      .then(payload => {
        if (payload.success) setStats(payload.data.totals)
      })
      .catch(() => {})
  }, [])

  const faqs = [
    {
      q: 'Is Mano-Mitra really free?',
      a: 'Yes, absolutely. All features, including the AI chat, mood tracking, and peer support groups, are completely free to use.',
    },
    {
      q: 'How does the AI chat work?',
      a: 'The AI chat provides a supportive, non-judgmental space to express your feelings and explore coping strategies. It is not a replacement for professional therapy.',
    },
    {
      q: 'Is my data private?',
      a: 'Your conversations and mood entries are stored securely. We do not share your personal data with third parties.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-slate-800 font-['Outfit',sans-serif]">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-2 text-white">
            <Brain size={24} />
          </div>
          <span className="text-xl font-bold text-emerald-900 tracking-tight">Mano-Mitra</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-emerald-800 hover:text-emerald-600 transition">
            Login
          </Link>
          <Link to="/signup" className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="px-6 py-12 md:py-20 text-center max-w-4xl mx-auto mt-4 md:mt-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-5 md:mb-6">
          A gentle space for your <span className="text-emerald-600">mental wellness</span>.
        </h1>
        <p className="text-base md:text-xl text-slate-600 mb-8 md:mb-10 max-w-2xl mx-auto">
          Track your mood, connect with peer support groups, and talk to an empathetic AI assistant—all in one safe, free environment.
        </p>
        <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 md:px-8 md:py-4 text-base md:text-lg font-medium text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 transition-transform">
          Start your journey
        </Link>
      </header>

      {/* Live Stats */}
      {stats && (
        <section className="px-6 py-16 bg-white border-y border-emerald-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">Our Growing Community</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-2xl bg-emerald-50/50">
                <div className="text-4xl font-bold text-emerald-700 mb-2">{stats.totalUsers}</div>
                <div className="text-sm font-medium text-slate-600">Members</div>
              </div>
              <div className="p-6 rounded-2xl bg-emerald-50/50">
                <div className="text-4xl font-bold text-emerald-700 mb-2">{stats.totalMoodEntries}</div>
                <div className="text-sm font-medium text-slate-600">Moods Tracked</div>
              </div>
              <div className="p-6 rounded-2xl bg-emerald-50/50">
                <div className="text-4xl font-bold text-emerald-700 mb-2">{stats.totalChats}</div>
                <div className="text-sm font-medium text-slate-600">Chat Messages</div>
              </div>
              <div className="p-6 rounded-2xl bg-emerald-50/50">
                <div className="text-4xl font-bold text-emerald-700 mb-2">{Math.round((stats.totalChats / (stats.totalUsers || 1)))}</div>
                <div className="text-sm font-medium text-slate-600">Avg. Engagement</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Preview */}
      <section className="px-6 py-12 md:py-20 max-w-7xl mx-auto">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-50">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">AI Support Chat</h3>
            <p className="text-slate-600 leading-relaxed">A compassionate, non-judgmental AI companion ready to listen and offer gentle coping strategies anytime.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-50">
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Daily Mood Tracking</h3>
            <p className="text-slate-600 leading-relaxed">Reflect on your emotions daily and observe your emotional trends over time to foster self-awareness.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-50">
            <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 mb-6">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Peer Support</h3>
            <p className="text-slate-600 leading-relaxed">Connect with others facing similar challenges in topic-based, text-only support groups.</p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-6 py-20 bg-white border-t border-emerald-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-emerald-100 rounded-2xl overflow-hidden transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-emerald-50/50 text-left"
                >
                  <span className="font-semibold text-slate-800">{faq.q}</span>
                  <ChevronDown className={`text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-slate-600 bg-white leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-slate-500 text-sm border-t border-emerald-50">
        <p>© {new Date().getFullYear()} Mano-Mitra. All rights reserved. A safe space, always free.</p>
      </footer>
    </div>
  )
}
