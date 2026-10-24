import React, { useState, useEffect } from 'react'
import { 
  X, 
  ThumbsUp, 
  Pin, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  HelpCircle,
  Clock,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function EventLiveQAModal({ isOpen, onClose, event, club, currentUser, isOfficer }) {
  if (!isOpen) return null

  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [newQuestion, setNewQuestion] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('top') // 'top', 'recent', 'unanswered', 'answered'
  const [isStageMode, setIsStageMode] = useState(false)
  const [answeringQId, setAnsweringQId] = useState(null)
  const [answerText, setAnswerText] = useState('')

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_URL}/api/events/${event.id}/qa`, { headers })
      const data = await res.json()
      if (Array.isArray(data)) {
        setQuestions(data)
      }
    } catch (err) {
      console.error('Failed to fetch Q&A questions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
    const interval = setInterval(fetchQuestions, 5000) // Poll every 5s for live questions
    return () => clearInterval(interval)
  }, [event?.id])

  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/events/${event.id}/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newQuestion.trim(),
          is_anonymous: isAnonymous
        })
      })

      if (res.ok) {
        const created = await res.json()
        setQuestions(prev => [created, ...prev])
        setNewQuestion('')
        toast.success('Your question has been sent to the speaker stage!')
      } else {
        toast.error('Failed to submit question')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error submitting question')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleUpvote = async (questionId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to upvote questions')
        return
      }

      // Optimistic update
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          const wasUpvoted = q.has_upvoted
          return {
            ...q,
            has_upvoted: !wasUpvoted,
            upvotes_count: wasUpvoted ? Math.max(q.upvotes_count - 1, 0) : q.upvotes_count + 1
          }
        }
        return q
      }))

      const res = await fetch(`${API_URL}/api/events/${event.id}/qa/${questionId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const updated = await res.json()
        setQuestions(prev => prev.map(q => q.id === questionId ? updated : q))
      }
    } catch (err) {
      console.error('Error upvoting:', err)
      fetchQuestions()
    }
  }

  const handleTogglePin = async (questionId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/events/${event.id}/qa/${questionId}/pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const updated = await res.json()
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, is_pinned: updated.is_pinned } : q))
        toast.success(updated.is_pinned ? 'Question pinned to stage top!' : 'Question unpinned')
      }
    } catch (err) {
      toast.error('Failed to toggle pin')
    }
  }

  const handleMarkAnswered = async (questionId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/events/${event.id}/qa/${questionId}/answer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answer_text: answerText || 'Answered live on stage by speaker.' })
      })
      if (res.ok) {
        const updated = await res.json()
        setQuestions(prev => prev.map(q => q.id === questionId ? updated : q))
        setAnsweringQId(null)
        setAnswerText('')
        toast.success('Marked question as answered!')
      }
    } catch (err) {
      toast.error('Failed to update question status')
    }
  }

  const handleDelete = async (questionId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/events/${event.id}/qa/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== questionId))
        toast.success('Question removed')
      }
    } catch (err) {
      toast.error('Failed to delete question')
    }
  }

  // Filtered & Sorted Questions
  const filteredQuestions = [...questions].filter(q => {
    if (filter === 'unanswered') return !q.is_answered
    if (filter === 'answered') return q.is_answered
    return true
  }).sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    if (filter === 'recent') {
      return new Date(b.created_at) - new Date(a.created_at)
    }
    // Default: 'top' by upvotes
    return (b.upvotes_count || 0) - (a.upvotes_count || 0)
  })

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto ${
      isStageMode ? 'p-0' : 'p-4'
    }`}>
      <div 
        className={`bg-white dark:bg-surface border border-border flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
          isStageMode 
            ? 'w-full h-full rounded-none max-w-none max-h-none' 
            : 'w-full max-w-3xl max-h-[90vh] rounded-3xl my-auto'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 via-surface to-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
              <MessageSquare size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Floor Q&A
                </span>
                <span className="text-xs text-text-secondary">{event.location || 'Main Auditorium'}</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-text mt-0.5">
                Audience Q&A & Upvoting
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStageMode(!isStageMode)}
              className="p-2 rounded-xl bg-surface-dim hover:bg-surface-muted border border-border text-text-secondary hover:text-text transition-colors"
              title={isStageMode ? 'Exit Stage Mode' : 'Enter Auditorium Projector Stage Mode'}
            >
              {isStageMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-dim hover:bg-surface-muted border border-border flex items-center justify-center text-text-secondary hover:text-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Ask Question Box (Hidden in Stage Mode if desired or condensed) */}
          <form onSubmit={handleSubmitQuestion} className="p-4 rounded-2xl bg-surface-dim border border-border space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                Ask a Question to the Speaker / Organizers
              </span>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-xl transition-all ${
                  isAnonymous 
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30' 
                    : 'bg-surface border border-border text-text-secondary hover:text-text'
                }`}
              >
                {isAnonymous ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{isAnonymous ? 'Posting Anonymously' : `Posting as ${currentUser?.name?.split(' ')[0] || 'Me'}`}</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="e.g. How does this architecture handle distributed failover during peak concurrent loads?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              maxLength={500}
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-secondary">
                {newQuestion.length}/500 chars • Upvoted questions rise to the speaker's podium
              </span>
              <button
                type="submit"
                disabled={submitting || !newQuestion.trim()}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Send size={13} />
                <span>{submitting ? 'Submitting...' : 'Send Question'}</span>
              </button>
            </div>
          </form>

          {/* Filter Pills */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'top', label: '🔥 Top Upvoted' },
                { id: 'recent', label: '🕒 Most Recent' },
                { id: 'unanswered', label: '❓ Unanswered' },
                { id: 'answered', label: '✓ Answered' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filter === f.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-dim border border-border text-text-secondary hover:text-text'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-text-secondary font-medium shrink-0">
              {filteredQuestions.length} question(s)
            </span>
          </div>

          {/* Questions Feed */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
              <p className="text-xs text-text-secondary">Connecting to live auditorium channel...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-2xl bg-surface-dim/40 border border-border border-dashed">
              <HelpCircle size={32} className="mx-auto text-text-secondary/40 mb-2" />
              <h4 className="font-bold text-sm text-text">No questions yet in this view</h4>
              <p className="text-xs text-text-secondary mt-1">Be the first to ask a question to the speakers on stage!</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredQuestions.map((q) => {
                const isAuthor = q.user_id === currentUser?.id
                return (
                  <div
                    key={q.id}
                    className={`p-4 md:p-5 rounded-2xl border transition-all ${
                      q.is_pinned
                        ? 'bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20'
                        : q.is_answered
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-surface border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Upvote Button (Slido style) */}
                      <button
                        onClick={() => handleToggleUpvote(q.id)}
                        className={`flex flex-col items-center justify-center w-12 py-2 rounded-xl border transition-all shrink-0 ${
                          q.has_upvoted
                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                            : 'bg-surface-dim border-border text-text hover:border-primary/50'
                        }`}
                        title={q.has_upvoted ? 'Remove upvote' : 'Upvote this question'}
                      >
                        <ThumbsUp size={16} className={q.has_upvoted ? 'fill-current' : ''} />
                        <span className="text-xs font-bold mt-1">{q.upvotes_count || 0}</span>
                      </button>

                      {/* Question Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {q.is_pinned && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Pin size={10} className="fill-current" /> Pinned
                            </span>
                          )}
                          {q.is_answered && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Answered
                            </span>
                          )}
                          <span className="text-xs font-bold text-text">
                            {q.author_name}
                          </span>
                          {q.author_branch && (
                            <span className="text-[10px] text-text-secondary bg-surface-dim px-2 py-0.5 rounded-full border border-border">
                              {q.author_branch}
                            </span>
                          )}
                          <span className="text-[10px] text-text-secondary ml-auto flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className={`text-sm leading-relaxed text-text ${isStageMode ? 'text-base font-medium' : ''}`}>
                          {q.content}
                        </p>

                        {/* Answered text if any */}
                        {q.answer_text && (
                          <div className="mt-2.5 p-3 rounded-xl bg-surface-dim border border-border text-xs text-text-secondary flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-text block text-[11px] uppercase tracking-wider text-emerald-600">
                                Speaker Answer:
                              </span>
                              <p className="text-text mt-0.5">{q.answer_text}</p>
                            </div>
                          </div>
                        )}

                        {/* Officer Answering Form */}
                        {answeringQId === q.id && (
                          <div className="mt-3 p-3 rounded-xl bg-surface-dim border border-border space-y-2">
                            <textarea
                              rows={2}
                              value={answerText}
                              onChange={e => setAnswerText(e.target.value)}
                              placeholder="Write speaker's response or key takeaway..."
                              className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-surface text-xs text-text focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setAnsweringQId(null)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold text-text-secondary hover:text-text"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleMarkAnswered(q.id)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                              >
                                Save Answer
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Officer Actions Bar */}
                        {(isOfficer || isAuthor) && (
                          <div className="pt-2 flex items-center gap-3 text-xs border-t border-border/40 mt-2">
                            {isOfficer && (
                              <>
                                <button
                                  onClick={() => handleTogglePin(q.id)}
                                  className="text-text-secondary hover:text-amber-500 flex items-center gap-1 transition-colors text-[11px]"
                                >
                                  <Pin size={12} />
                                  <span>{q.is_pinned ? 'Unpin' : 'Pin to Top'}</span>
                                </button>
                                {!q.is_answered && answeringQId !== q.id && (
                                  <button
                                    onClick={() => setAnsweringQId(q.id)}
                                    className="text-text-secondary hover:text-emerald-500 flex items-center gap-1 transition-colors text-[11px]"
                                  >
                                    <CheckCircle2 size={12} />
                                    <span>Mark Answered</span>
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="text-text-secondary hover:text-red-500 flex items-center gap-1 transition-colors text-[11px] ml-auto"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-dim/40 flex items-center justify-between text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-primary" />
            Live Event Session Moderated by {club?.name || 'Club Officers'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface border border-border font-semibold hover:bg-surface-muted text-text transition-colors"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  )
}
