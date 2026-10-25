import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, Send, X, Sparkles, MessageSquare, MapPin, 
  HelpCircle, Zap, GraduationCap, ChevronRight, CornerDownLeft
} from 'lucide-react'
import FormattedMessage from './FormattedMessage'

export default function EventAIConciergeModal({ isOpen, onClose, event, club }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your AI Concierge for **${event?.title}**. Ask me anything about reporting timings, venue directions at PICT, On-Duty (OD) letters, or AICTE points!`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const quickQuestions = [
    'Where is the venue & reporting time?',
    'Can I get On-Duty (OD) attendance leave?',
    'How many AICTE activity points do I earn?',
    'Is this a team event or solo?'
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim()
    if (!q || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/ai/event-concierge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          question: q
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get answer')

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an issue retrieving that information. Please check the event description or ask a club coordinator.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white dark:bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[580px] max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 via-primary to-blue-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">Event AI Concierge</h3>
                <span className="text-[10px] bg-emerald-400 text-gray-950 font-extrabold px-1.5 py-0.2 rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-white/80">{event.title} • {club?.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-surface-dim/40 text-xs">
          {messages.map((m, idx) => (
            <div 
              key={idx}
              className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                m.role === 'user' 
                  ? 'bg-primary text-white' 
                  : 'bg-indigo-600 text-white shadow-sm'
              }`}>
                {m.role === 'user' ? 'You' : <Bot size={14} />}
              </div>
              <div className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-white dark:bg-surface border border-border text-text rounded-tl-none shadow-sm'
              }`}>
                <FormattedMessage content={m.content} isUser={m.role === 'user'} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-text-secondary text-xs p-2">
              <Sparkles size={14} className="animate-spin text-primary" />
              <span>AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="p-2.5 bg-surface border-t border-border flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-surface-muted hover:bg-primary/10 hover:text-primary border border-border text-[11px] text-text-secondary whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
            >
              <span>{q}</span>
              <ChevronRight size={11} />
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="p-3 bg-white dark:bg-surface border-t border-border flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about venue directions, squad rules, OD letters..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface-dim text-text text-xs focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </motion.div>
    </div>
  )
}
