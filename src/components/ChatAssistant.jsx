import { useState, useEffect, useRef } from 'react'
import { MessageCircleHeart, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/authContext.js'
import { getFromStorage, saveToStorage, removeFromStorage } from '../utils/storage.js'

const CHAT_STORAGE_KEY = 'mano_chat_messages_v2'
const GEMINI_COOLDOWN_KEY = 'mano_gemini_cooldown_until'
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

const initialAssistantMessage = {
  id: 'seed-1',
  role: 'ai',
  text: 'Hi, I am here to support you. Share what you are feeling, and we can take one small step together.',
  sentiment: 'neutral',
  timestamp: Date.now(),
}

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

const callGeminiDirectly = async (message) => {
  const GEMINI_ENDPOINTS = [
    {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      model: 'gemini-1.5-flash',
    },
    {
      url: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
      model: 'gemini-1.5-flash',
    },
  ]
  const SUPPORTIVE_SYSTEM_PROMPT = `You are Mano-Mitra, a supportive mental wellness assistant.
Rules:
- Keep a calm, empathetic, non-judgmental tone.
- Give practical coping suggestions (breathing, grounding, journaling, short breaks, hydration, talking to trusted people).
- Encourage seeking help from a trusted person or counselor when needed.
- Never provide medical diagnosis, medication advice, or clinical treatment claims.
- Keep responses short and beginner-friendly (3-6 lines).`

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
            parts: [{ text: `${SUPPORTIVE_SYSTEM_PROMPT}\n\nUser message: "${message}"` }],
          },
        ],
      }),
    })

    const payload = await response.json()
    const aiResponse = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || ''

    if (response.ok && aiResponse) {
      return { text: aiResponse, model: endpoint.model }
    }

    lastError = payload?.error?.message || `Gemini request failed (${response.status}).`
    const isQuotaError = typeof lastError === 'string' && (lastError.toLowerCase().includes('quota exceeded') || lastError.toLowerCase().includes('rate limit'))
    if (isQuotaError) {
      const retryMatch = lastError.match(/retry in ([0-9.]+)s/i)
      const retrySeconds = retryMatch ? Number(retryMatch[1]) : 60
      localStorage.setItem(GEMINI_COOLDOWN_KEY, String(Date.now() + Math.ceil(retrySeconds * 1000)))
      throw new Error('Gemini quota exceeded. Using fallback assistant for now.')
    }
  }
  throw new Error(lastError)
}

const distressPattern = /\b(suicide|kill myself|end my life|self harm|self-harm|hopeless|i want to die)\b/i
const buildFallbackResponse = (message) => {
  if (distressPattern.test(message)) {
    return 'I am really glad you shared this. You are not alone. Please consider reaching out to a trusted person or counselor right now. If you are in immediate danger, contact local emergency services. For this moment, try slow 4-4 breathing and stay with someone you trust.'
  }
  return 'Thank you for sharing that. It sounds like this has been heavy. A gentle next step could be: take 5 slow breaths, drink some water, and write one small thing you can do in the next 10 minutes. If it helps, we can break your situation into manageable steps together.'
}

export default function ChatAssistant() {
  const { authFetch } = useAuth()
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [chatMessages, setChatMessages] = useState(() => {
    const stored = normalizeStoredChat(getFromStorage(CHAT_STORAGE_KEY, []))
    return stored.length ? stored : [initialAssistantMessage]
  })
  const messagesEndRef = useRef(null)

  useEffect(() => {
    saveToStorage(CHAT_STORAGE_KEY, normalizeStoredChat(chatMessages))
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const sendChatMessage = async (event) => {
    event.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed || chatLoading) return

    const userMessage = { role: 'user', text: trimmed, timestamp: Date.now() }
    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setChatError('')
    setChatLoading(true)

    try {
      if (!GEMINI_API_KEY) {
        const response = await authFetch('/chat', {
          method: 'POST',
          body: JSON.stringify({ message: trimmed }),
        })
        const payload = await response.json()

        if (response.status === 401 && payload?.message?.toLowerCase().includes('user not found')) {
          // fallback to public chat if auth fails
          const publicResponse = await fetch(`${API_BASE}/chat/public`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: trimmed }),
          })
          const publicPayload = await publicResponse.json()
          if (!publicResponse.ok || !publicPayload?.success) throw new Error(publicPayload?.message || 'Error')
          setChatMessages((prev) => [...prev, { role: 'ai', text: publicPayload.data.aiResponse, timestamp: Date.now() }])
          return
        }

        if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Unable to get chat response.')
        setChatMessages((prev) => [...prev, { role: 'ai', text: payload.data.aiResponse, timestamp: Date.now() }])
        return
      }

      const gemini = await callGeminiDirectly(trimmed)
      setChatMessages((prev) => [...prev, { role: 'ai', text: gemini.text, timestamp: Date.now() }])
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: 'ai', text: buildFallbackResponse(trimmed), timestamp: Date.now() }])
      setChatError(error?.message || 'Temporary AI issue. Showing a supportive fallback response for now.')
    } finally {
      setChatLoading(false)
    }
  }

  const resetConversation = () => {
    setChatMessages([{ ...initialAssistantMessage, timestamp: Date.now() }])
    setChatInput('')
    setChatError('')
    removeFromStorage(CHAT_STORAGE_KEY)
  }

  return (
    <article className="flex flex-col h-[calc(100svh-200px)] max-h-[600px] min-h-[400px] rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#EDF4F0] p-2 text-[#5C8D72] border border-[#B5D4C3]/40">
            <MessageCircleHeart size={20} />
          </div>
          <h3 className="font-display text-lg font-bold text-[#1C2B2A]">AI Chat Support</h3>
        </div>
        <span className="rounded-full bg-[#EDF4F0] px-3 py-1 text-xs font-bold tracking-wide text-[#3f6b53]">Always available</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {chatMessages.map((message) => (
          <div key={message.timestamp} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                message.role === 'user'
                  ? 'bg-[#5C8D72] text-white rounded-tr-sm'
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
              <p className={`mt-2 text-[10px] uppercase font-medium tracking-wider ${message.role === 'user' ? 'text-[#B5D4C3]' : 'text-slate-400'}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-slate-400">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm font-medium">Mano-Mitra is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-100 bg-white p-4">
        {chatError && <p className="mb-3 rounded-lg bg-rose-50 p-2 text-xs font-medium text-rose-600">{chatError}</p>}
        <form onSubmit={sendChatMessage} className="flex gap-2">
          <textarea
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Type what you are feeling..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendChatMessage(e)
              }
            }}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#5C8D72] focus:bg-white focus:ring-1 focus:ring-[#5C8D72]"
          />
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={chatLoading}
              className="flex h-11 items-center justify-center rounded-xl bg-[#5C8D72] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f6b53] disabled:opacity-50"
            >
              Send
            </button>
            <button
              type="button"
              onClick={resetConversation}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Reset Chat
            </button>
          </div>
        </form>
      </div>
    </article>
  )
}
