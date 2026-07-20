import { useState, useEffect, useRef } from 'react'
import { UsersRound, Loader2, Send, ChevronLeft, ShieldAlert } from 'lucide-react'
import { useAuth } from '../auth/authContext.js'

export default function PeerSupport({ searchQuery }) {
  const { authFetch, user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeGroup, setActiveGroup] = useState(null)
  
  // Chat state
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pollingActive, setPollingActive] = useState(false)
  
  const messagesEndRef = useRef(null)
  const pollingInterval = useRef(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const res = await authFetch('/groups')
      const payload = await res.json()
      if (res.ok && payload.success) {
        setGroups(payload.data)
      }
    } catch (err) {
      setError('Failed to load support groups.')
    } finally {
      setLoading(false)
    }
  }

  const toggleJoin = async (groupId, event) => {
    event.stopPropagation()
    try {
      const res = await authFetch(`/groups/${groupId}/join`, { method: 'POST' })
      const payload = await res.json()
      if (res.ok && payload.success) {
        setGroups(groups.map(g => g._id === groupId ? { ...g, joined: payload.data.joined } : g))
        if (activeGroup && activeGroup._id === groupId && !payload.data.joined) {
          setActiveGroup(null)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const openGroup = (group) => {
    if (!group.joined) return
    setActiveGroup(group)
    setMessages([])
    setPollingActive(true)
    fetchMessages(group._id)
  }

  const closeGroup = () => {
    setActiveGroup(null)
    setPollingActive(false)
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }
  }

  const fetchMessages = async (groupId) => {
    try {
      const res = await authFetch(`/groups/${groupId}/messages`)
      const payload = await res.json()
      if (res.ok && payload.success) {
        setMessages(payload.data)
        messagesEndRef.current?.scrollIntoView()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Polling setup
  useEffect(() => {
    if (activeGroup && pollingActive) {
      pollingInterval.current = setInterval(() => {
        fetchMessages(activeGroup._id)
      }, 5000)
    }
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [activeGroup, pollingActive])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || sending) return
    
    setSending(true)
    try {
      const res = await authFetch(`/groups/${activeGroup._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: messageInput })
      })
      const payload = await res.json()
      if (res.ok && payload.success) {
        setMessageInput('')
        setMessages([...messages, payload.data])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const normalizedSearch = (searchQuery || '').toLowerCase().trim()
  const filteredGroups = groups.filter(g => 
    normalizedSearch ? (g.name.toLowerCase().includes(normalizedSearch) || g.description?.toLowerCase().includes(normalizedSearch)) : true
  )

  if (activeGroup) {
    return (
      <article className="flex flex-col h-[calc(100svh-200px)] max-h-[600px] min-h-[400px] card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-white p-4">
          <button type="button" onClick={closeGroup} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronLeft size={20} />
          </button>
          <div className="rounded-xl bg-[#F0EDF8] p-2 text-[#7C6FA0] border border-[#C4BCDE]/30 shadow-sm">
            <UsersRound size={20} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">{activeGroup.name}</h3>
            <p className="text-xs text-slate-500">{activeGroup.description}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          <div className="text-center pb-4 border-b border-slate-200 mb-6">
            <p className="text-sm font-medium text-slate-800">Welcome to {activeGroup.name}</p>
            <p className="text-xs text-slate-500 mt-1">This is a safe space. Please be respectful and supportive.</p>
          </div>
          
          {messages.length === 0 ? (
            <div className="flex justify-center py-10">
              <p className="text-sm text-slate-400">No messages yet. Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.user?._id === user?.id
              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`max-w-[90%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    isMine ? 'bg-[#7C6FA0] text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    {!isMine && (
                      <p className="text-xs font-bold text-[#7C6FA0] mb-1">{msg.user?.name || 'Unknown'}</p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex justify-between items-center mt-2 gap-4">
                      <p className={`text-[10px] uppercase font-medium tracking-wider ${isMine ? 'text-[#C4BCDE]' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {msg.distressFlagged && user?.role === 'admin' && (
                        <ShieldAlert size={14} className="text-rose-500" title="Flagged for distress" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-100 bg-white p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Share something with the group..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#7C6FA0] focus:bg-white focus:ring-1 focus:ring-[#7C6FA0]"
            />
            <button
              type="submit"
              disabled={sending || !messageInput.trim()}
              className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[#7C6FA0] text-white shadow-sm transition hover:bg-[#685A8D] disabled:opacity-50"
            >
              {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </article>
    )
  }

  return (
    <article className="card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[#F0EDF8] p-2.5 text-[#7C6FA0] border border-[#C4BCDE]/30 shadow-sm">
          <UsersRound size={20} />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900">Peer Support Circle</h3>
          <p className="text-xs text-slate-500">Connect with others in a safe space</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-8 text-center text-slate-500">
          No groups found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredGroups.map(group => (
            <div 
              key={group._id} 
              className={`p-5 rounded-2xl border transition-all ${
                group.joined 
                  ? 'border-[#C4BCDE] bg-[#F0EDF8]/20 cursor-pointer hover:border-[#7C6FA0] shadow-sm' 
                  : 'border-slate-200 bg-white'
              }`}
              onClick={() => openGroup(group)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-display font-bold text-[#1C2B2A] text-sm line-clamp-1">{group.name}</h4>
                {group.category && (
                  <span className="badge badge-lavender">
                    {group.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">
                {group.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#F0EDF8] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#7C6FA0]">
                    {group.members?.length || 0}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => toggleJoin(group._id, e)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    group.joined 
                      ? 'bg-white border border-[#C4BCDE] text-[#7C6FA0] hover:bg-[#F0EDF8]' 
                      : 'bg-[#7C6FA0] text-white hover:bg-[#685A8D]'
                  }`}
                >
                  {group.joined ? 'Leave Group' : 'Join Group'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
