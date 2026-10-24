import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Megaphone, AlertTriangle, Send, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EventBroadcastModal({ isOpen, onClose, event, club, attendeesCount = 0, onBroadcastSent }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal') // 'normal' | 'urgent'
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter both title and message')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/events/${event.id}/broadcasts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          priority
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send broadcast')

      toast.success(`Notice broadcasted! ${data.notifiedCount || attendeesCount} attendees notified.`)
      setTitle('')
      setMessage('')
      setPriority('normal')
      if (onBroadcastSent) onBroadcastSent(data.broadcast)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Broadcast failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white dark:bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Megaphone size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Broadcast Notice to Attendees</h3>
              <p className="text-xs text-white/80">{event.title} • {attendeesCount} Registered</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Priority Toggle */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Notice Priority</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  priority === 'normal'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-border bg-surface-dim text-text-secondary hover:text-text'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>General Bulletin</span>
                  {priority === 'normal' && <CheckCircle2 size={14} className="text-primary" />}
                </div>
                <div className="text-[11px] font-normal opacity-80 mt-0.5">Instructions & reminders</div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  priority === 'urgent'
                    ? 'border-red-500 bg-red-500/10 text-red-600 font-bold shadow-sm'
                    : 'border-border bg-surface-dim text-text-secondary hover:text-text'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1">🚨 Urgent Alert</span>
                  {priority === 'urgent' && <CheckCircle2 size={14} className="text-red-500" />}
                </div>
                <div className="text-[11px] font-normal opacity-80 mt-0.5">Venue shift or delay</div>
              </button>
            </div>
          </div>

          {/* Subject Title */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Notice Headline / Subject *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Reporting at Seminar Hall 2, bring laptops"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-surface-dim text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>

          {/* Notice Message */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Detailed Message *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Provide complete instructions, room numbers, requirements, or timing updates..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-surface-dim text-text focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
            />
          </div>

          <div className="p-3 bg-surface-dim rounded-xl border border-border text-xs text-text-secondary flex items-start gap-2">
            <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <span>
              This will immediately send in-app notification badges to all <strong>{attendeesCount} enrolled students</strong> and pin this announcement atop the event pass page.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold hover:bg-surface-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send size={14} />
              <span>{loading ? 'Broadcasting...' : `Blast to ${attendeesCount} Attendees`}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
