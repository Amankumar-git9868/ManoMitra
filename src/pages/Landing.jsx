import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain,
  ChevronDown,
  Sparkles,
  Users,
  MessageSquare,
  Smile,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

function AnimatedCounter({ value, label, duration = 1200 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseInt(value, 10) || 0
    if (end === 0) {
      setCount(0)
      return
    }
    const totalMiliseconds = duration
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 8)
    const stepValue = Math.ceil(end / (totalMiliseconds / incrementTime))
    
    const timer = setInterval(() => {
      start += stepValue
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, incrementTime)

    return () => clearInterval(timer)
  }, [value, duration])

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#E2E8E4] shadow-sm hover:shadow-md transition-all duration-300">
      <div className="font-display text-4xl font-extrabold text-[#5C8D72] mb-1">
        {count.toLocaleString()}+
      </div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  )
}

export default function Landing() {
  const [stats, setStats] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

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
      a: 'Yes, absolutely. All features, including the AI chat, mood tracking, peer support groups, and appointment scheduling, are completely free to use. There are no hidden fees or paywalls.',
    },
    {
      q: 'How does the AI chat work?',
      a: 'The AI chat provides a supportive, non-judgmental space to express your feelings and explore coping strategies. It is built to offer gentle guidance and support, but it is not a replacement for professional clinical therapy.',
    },
    {
      q: 'Is my data private?',
      a: 'Your conversations and mood entries are stored securely. We respect your privacy and do not sell or share your personal data with third parties.',
    },
    {
      q: 'What are Peer Support Groups?',
      a: 'They are topic-based, text-only chat rooms where you can connect with other members experiencing similar situations (like anxiety, school stress, or sleep trouble) in a safe, moderated environment.',
    },
  ]

  const specialists = [
    {
      name: 'Dr. Ananya Sen',
      role: 'Clinical Psychologist',
      initials: 'AS',
      bg: 'from-emerald-400 to-teal-500',
      tags: ['Anxiety', 'CBT', 'Grief'],
      bio: 'Over 8 years of guiding individuals through emotional challenges with evidence-based practices.'
    },
    {
      name: 'Rohan Sharma',
      role: 'Wellness Coach',
      initials: 'RS',
      bg: 'from-amber-400 to-orange-500',
      tags: ['Routines', 'Habits', 'Stress'],
      bio: 'Specializes in helping build positive daily habits, stress resilience, and balanced routines.'
    },
    {
      name: 'Sneha Kapoor',
      role: 'Therapist & Counselor',
      initials: 'SK',
      bg: 'from-purple-400 to-indigo-500',
      tags: ['Relationship', 'Self-Esteem'],
      bio: 'Focused on creating warm, conversational spaces to explore thoughts and identify next steps.'
    }
  ]

  const staticResources = [
    {
      category: 'Stress Management',
      badgeClass: 'badge-sage',
      title: 'Box Breathing Reset',
      description: 'A simple 4-second breathing cycle to immediately lower physical stress and quiet down high anxiety.'
    },
    {
      category: 'Sleep Improvement',
      badgeClass: 'badge-lavender',
      title: 'Wind-Down Rituals',
      description: 'Practical steps to prepare your mind for rest, including dimming triggers and setting worries aside.'
    },
    {
      category: 'Anxiety Help',
      badgeClass: 'badge-teal',
      title: '5-4-3-2-1 Grounding',
      description: 'Use your physical senses to connect back to the present moment when thoughts feel overwhelming.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-slate-700 selection:bg-[#5C8D72]/20 selection:text-[#3f6b53]">
      
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="blob-float absolute top-12 -left-20 w-80 h-80 rounded-full bg-[#EDF4F0] opacity-70 blur-3xl" />
        <div className="blob-float-reverse absolute top-40 right-10 w-96 h-96 rounded-full bg-[#F0EDF8] opacity-60 blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-4 py-4 max-w-7xl mx-auto sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#5C8D72] p-2.5 text-white shadow-sm">
            <Brain size={22} />
          </div>
          <span className="font-display text-xl font-bold text-[#1C2B2A] tracking-tight">Mano-Mitra</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link to="/login" className="hidden sm:inline text-sm font-semibold text-[#5C8D72] hover:text-[#3f6b53] transition-colors">
            Login
          </Link>
          <Link to="/signup" className="btn-primary py-2.5 px-5 text-sm">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="section-label">
              <Sparkles size={12} />
              Your Safe Mental Health Companion
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1C2B2A] leading-tight tracking-tight">
              A gentle space <br />
              for your <span className="text-gradient">mental wellness</span>.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Track your daily mood, join supportive peer groups, schedule appointments with wellness experts, and converse with an empathetic AI assistant — all in one secure, completely free environment.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="btn-primary text-center">
                Start your journey
              </Link>
              <a href="#features" className="btn-outline text-center flex items-center justify-center gap-2">
                Learn more <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Right Column: Glassmorphism Feature Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative z-10 card p-6 bg-white/70 backdrop-blur-md border-[#E2E8E4]/60 shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EDF4F0] flex items-center justify-center text-[#5C8D72]">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[#1C2B2A] text-sm">AI Support Assistant</h3>
                  <p className="text-xs text-slate-500">Always available to listen</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-100/50 rounded-2xl rounded-tl-sm p-3.5 text-xs text-slate-600 leading-relaxed max-w-[90%]">
                  "Hi! Share what you are feeling right now. We can take one small step together."
                </div>
                <div className="bg-[#5C8D72] text-white rounded-2xl rounded-tr-sm p-3.5 text-xs leading-relaxed max-w-[90%] ml-auto">
                  "I am feeling a bit overwhelmed by exams today."
                </div>
                <div className="bg-slate-100/50 rounded-2xl rounded-tl-sm p-3.5 text-xs text-slate-600 leading-relaxed max-w-[90%]">
                  "That is completely understandable. Let us take a deep breath. Try 4-4 breathing with me for just one minute."
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#5C8D72]" /> Private &amp; Secure</span>
                <span>Beginner Friendly</span>
              </div>
            </div>
            {/* Absolute accent shape */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#F0EDF8] rounded-3xl -z-10 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Live Stats */}
      {stats && (
        <section className="relative z-10 bg-white border-y border-[#E2E8E4] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-center text-[#1C2B2A] mb-10">Our Growing Community</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <AnimatedCounter value={stats.totalUsers} label="Members" />
              <AnimatedCounter value={stats.totalMoodEntries} label="Moods Tracked" />
              <AnimatedCounter value={stats.totalChats} label="Chat Messages" />
              <AnimatedCounter value={Math.round(stats.totalChats / (stats.totalUsers || 1)) + 5} label="Avg. Interactions" />
            </div>
          </div>
        </section>
      )}

      {/* Core Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="section-label">Features</div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1C2B2A]">
            Tools designed to support your day-to-day
          </h2>
          <p className="text-slate-600">
            Mano-Mitra combines automated, peer, and expert wellness services into one harmonious workspace.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Card 1: AI Chat */}
          <div className="card card-hover p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF4F0] flex items-center justify-center text-[#5C8D72]">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-[#1C2B2A]">Empathetic AI Chat</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Talk to an AI companion equipped with severe distress detection. Get low-risk coping suggestions anytime you need to unload.
            </p>
          </div>

          {/* Card 2: Mood Tracking */}
          <div className="card card-hover p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Smile size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-[#1C2B2A]">Daily Mood Tracker</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Log how you feel in one click. View a 7-day emotional trend chart that gives you insights into weekly progress.
            </p>
          </div>

          {/* Card 3: Peer Support */}
          <div className="card card-hover p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F0EDF8] flex items-center justify-center text-[#7C6FA0]">
              <Users size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-[#1C2B2A]">Peer Support Groups</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Connect anonymously with others facing identical life situations in safe, text-only chat rooms. Free from clutter and pressure.
            </p>
          </div>

        </div>
      </section>

      {/* Resource Hub Preview */}
      <section className="relative z-10 bg-white border-y border-[#E2E8E4] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3">
              <div className="section-label">Resource Hub</div>
              <h2 className="font-display text-3xl font-extrabold text-[#1C2B2A]">
                Explore Trusted Self-Help
              </h2>
              <p className="text-slate-600 max-w-xl">
                Get quick, actionable wellness suggestions, bed-time habits, and box-breathing routines.
              </p>
            </div>
            <Link to="/signup" className="btn-outline flex items-center gap-2 self-start md:self-auto py-2.5">
              Explore full Hub <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {staticResources.map((res, idx) => (
              <div key={idx} className="card p-6 border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className={`badge ${res.badgeClass}`}>{res.category}</div>
                  <h4 className="font-display font-bold text-lg text-[#1C2B2A]">{res.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{res.description}</p>
                </div>
                <Link to="/signup" className="mt-6 text-xs font-semibold text-[#5C8D72] hover:underline flex items-center gap-1">
                  Learn how to practice <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialists Preview */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="section-label">Expertise</div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1C2B2A]">
            Meet our Wellness Specialists
          </h2>
          <p className="text-slate-600">
            Schedule free one-on-one sessions. Select the specialist that aligns perfectly with your wellness requirements.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {specialists.map((spec, idx) => (
            <div key={idx} className="card overflow-hidden hover:shadow-md transition-shadow">
              {/* Header initials colored box */}
              <div className="h-44 bg-slate-50 flex items-center justify-center border-b border-slate-100 relative">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${spec.bg} text-white font-display text-2xl font-bold flex items-center justify-center shadow-sm`}>
                  {spec.initials}
                </div>
                <div className="absolute bottom-3 right-4 bg-white/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-200/50 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  {spec.role}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-display text-xl font-bold text-[#1C2B2A]">{spec.name}</h3>
                <p className="text-slate-600 text-sm leading-relaxed min-h-[60px]">{spec.bio}</p>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Specialties</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {spec.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-xs font-medium text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="relative z-10 bg-white border-t border-[#E2E8E4] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold text-center text-[#1C2B2A] mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-[#E2E8E4] rounded-2xl overflow-hidden bg-white transition-colors duration-200">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#EDF4F0]/30 text-left transition-colors"
                >
                  <span className="font-semibold text-slate-800 text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown className={`text-slate-400 shrink-0 ml-4 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} size={18} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-[#E2E8E4]/50 pt-4 bg-[#EDF4F0]/10">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 text-center text-slate-500 text-sm border-t border-[#E2E8E4] bg-[#EDF4F0]/30">
        <p className="font-display font-medium text-slate-700 mb-2">Mano-Mitra — Care Workspace</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
          A non-clinical support application. In case of distress, please seek assistance from qualified medical counselors.
        </p>
        <p className="text-[11px] text-slate-400">© {new Date().getFullYear()} Mano-Mitra. All rights reserved. Always free, always here.</p>
      </footer>
    </div>
  )
}
