import React, { useState, useEffect } from 'react'
import { 
  GraduationCap, Star, Calendar, Clock, MapPin, Video, 
  CheckCircle2, XCircle, Plus, Search, Filter, MessageSquare, 
  ExternalLink, UserCheck, Sparkles, BookOpen, ChevronRight, 
  X, Check, AlertCircle, Award, HeartHandshake, ShieldCheck,
  Terminal, Globe, Cpu, Layers
} from 'lucide-react'
import { toast } from 'sonner'

const DOMAIN_OPTIONS = [
  'Competitive Programming / DSA',
  'Full-Stack Web3',
  'AI/ML',
  'ROS2',
  'System Design & Architecture',
  'Hackathon Ideation & Pitching',
  'Open Source & GitHub Contributions',
  'Cloud & DevOps (Docker/AWS)',
  'Mobile App Dev (Flutter/React Native)'
]

const getDomainBadge = (dom = '') => {
  const lower = dom.toLowerCase()
  if (lower.includes('competitive') || lower.includes('dsa') || lower.includes('cp')) {
    return {
      label: 'Competitive Programming / DSA',
      badge: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      icon: Terminal
    }
  }
  if (lower.includes('web3') || lower.includes('full-stack') || lower.includes('web')) {
    return {
      label: 'Full-Stack Web3',
      badge: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      icon: Globe
    }
  }
  if (lower.includes('ai') || lower.includes('ml') || lower.includes('learning')) {
    return {
      label: 'AI/ML',
      badge: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
      icon: Sparkles
    }
  }
  if (lower.includes('ros2') || lower.includes('robotics') || lower.includes('embedded')) {
    return {
      label: 'ROS2',
      badge: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
      icon: Cpu
    }
  }
  if (lower.includes('cloud') || lower.includes('devops')) {
    return {
      label: 'Cloud & DevOps',
      badge: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      icon: Layers
    }
  }
  return {
    label: dom,
    badge: 'bg-surface-dim text-text-secondary border-border',
    icon: BookOpen
  }
}

export default function ClubMentorshipTab({ clubId, currentUser, isOfficer = false }) {
  const [mentors, setMentors] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState('browse') // 'browse' | 'sessions'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('ALL')

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [isBecomeMentorOpen, setIsBecomeMentorOpen] = useState(false)
  const [reviewingSession, setReviewingSession] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewFeedback, setReviewFeedback] = useState('')

  // Booking Form State
  const [bookForm, setBookForm] = useState({
    topic: '',
    description: '',
    preferred_date: '',
    preferred_time: '5:00 PM - 6:00 PM',
    meeting_venue: 'PICT Central Reading Hall'
  })

  // Mentor Profile Form State
  const [mentorForm, setMentorForm] = useState({
    domains: ['Competitive Programming & DSA'],
    year_of_study: 'TE',
    bio: '',
    max_weekly_slots: 3,
    is_accepting_mentees: true
  })

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const [mRes, sRes] = await Promise.all([
        fetch(`${API_URL}/api/mentorship/clubs/${clubId}/mentors`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/mentorship/clubs/${clubId}/sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (mRes.ok) {
        const mData = await mRes.json()
        setMentors(mData)
        // If current user is already a mentor, populate form
        const myProfile = mData.find(m => m.user_id === currentUser?.id)
        if (myProfile) {
          setMentorForm({
            domains: Array.isArray(myProfile.domains) ? myProfile.domains : [],
            year_of_study: myProfile.year_of_study || 'TE',
            bio: myProfile.bio || '',
            max_weekly_slots: myProfile.max_weekly_slots || 3,
            is_accepting_mentees: myProfile.is_accepting_mentees !== false
          })
        }
      }

      if (sRes.ok) {
        const sData = await sRes.json()
        setSessions(sData)
      }
    } catch (err) {
      console.error('Failed to load mentorship data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clubId) fetchData()
  }, [clubId])

  // Book Session Handler
  const handleBookSession = async (e) => {
    e.preventDefault()
    if (!selectedMentor) return
    if (!bookForm.topic.trim() || !bookForm.preferred_date || !bookForm.preferred_time) {
      toast.error('Please fill in topic, date, and time slot')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/mentorship/clubs/${clubId}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mentor_id: selectedMentor.id,
          ...bookForm
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to book session')
      }

      toast.success(`Mentorship request sent to ${selectedMentor.mentor_name}!`)
      setIsBookModalOpen(false)
      setBookForm({
        topic: '',
        description: '',
        preferred_date: '',
        preferred_time: '5:00 PM - 6:00 PM',
        meeting_venue: 'PICT Central Reading Hall'
      })
      fetchData()
      setActiveSubTab('sessions')
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Update Session Status Handler
  const handleUpdateStatus = async (sessionId, status, extra = {}) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/mentorship/sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, ...extra })
      })

      if (!res.ok) throw new Error('Failed to update session status')
      toast.success(`Session marked as ${status}`)
      fetchData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Submit Review Handler
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewingSession) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/mentorship/sessions/${reviewingSession.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          review_feedback: reviewFeedback
        })
      })

      if (!res.ok) throw new Error('Failed to submit review')
      toast.success('Thank you! Review and rating recorded.')
      setReviewingSession(null)
      setReviewFeedback('')
      fetchData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Save Mentor Profile Handler
  const handleSaveMentorProfile = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/mentorship/clubs/${clubId}/mentors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(mentorForm)
      })

      if (!res.ok) throw new Error('Failed to save mentor profile')
      toast.success('Your Senior Mentor profile is active!')
      setIsBecomeMentorOpen(false)
      fetchData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Filtered Mentors
  const filteredMentors = mentors.filter(m => {
    const matchSearch = !searchQuery.trim() || 
      m.mentor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.bio?.toLowerCase().includes(searchQuery.toLowerCase())
    const domains = Array.isArray(m.domains) ? m.domains : []
    const matchDomain = selectedDomain === 'ALL' || domains.includes(selectedDomain)
    return matchSearch && matchDomain
  })

  // Calculate Metrics
  const totalSessionsCompleted = sessions.filter(s => s.status === 'COMPLETED').length
  const avgClubRating = mentors.length > 0 
    ? (mentors.reduce((acc, m) => acc + parseFloat(m.rating_avg || 5), 0) / mentors.length).toFixed(1) 
    : '5.0'

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <HeartHandshake className="text-primary" size={24} />
              Peer Mentorship & Senior-Junior Project Pairing
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Campus Pairing Hub
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Book 1-on-1 office hours with verified TE/BE seniors for DSA roadmap reviews, Smart India Hackathon guidance, and project architectures.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsBecomeMentorOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-border hover:bg-surface-muted text-xs font-semibold text-text flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <GraduationCap size={15} className="text-primary" />
            <span>Senior Mentor Profile</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Senior Mentors</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-text mt-2">
            {mentors.length} Verified
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            TE & BE club seniors offering guidance
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Sessions Executed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {totalSessionsCompleted} Sessions
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Completed 1-on-1 peer pairings
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Average Mentor Rating</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Star size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-500 mt-2 flex items-center gap-1">
            <span>{avgClubRating}</span>
            <span className="text-sm font-normal text-text-secondary">/ 5.0</span>
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            From verified student feedback reviews
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Activity Hours</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {(totalSessionsCompleted * 1.5).toFixed(0)} Hrs
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            AICTE karma contribution credited
          </span>
        </div>
      </div>

      {/* Sub-Navigation & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-surface p-3.5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-1.5 bg-surface-dim p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveSubTab('browse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'browse' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'
            }`}
          >
            Browse Senior Mentors ({mentors.length})
          </button>
          <button
            onClick={() => setActiveSubTab('sessions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'sessions' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'
            }`}
          >
            My Sessions ({sessions.length})
          </button>
        </div>

        {activeSubTab === 'browse' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
              <input
                type="text"
                placeholder="Search mentors, domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-dim border border-border text-xs text-text placeholder-text-secondary focus:outline-none focus:border-primary"
              />
            </div>

            {/* Domain Filter */}
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-surface-dim border border-border text-xs font-medium text-text focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Tech Domains</option>
              {DOMAIN_OPTIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: BROWSE SENIOR MENTORS */}
      {activeSubTab === 'browse' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-text-secondary text-sm font-semibold animate-pulse">
              Loading verified club mentors...
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-surface rounded-2xl border border-dashed border-border space-y-3">
              <GraduationCap size={36} className="mx-auto text-text-secondary/50" />
              <h4 className="text-base font-bold text-text">No Mentors Found</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                No mentors match the selected filters. If you are a senior student, click "Senior Mentor Profile" to register!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map(m => {
                const domains = Array.isArray(m.domains) ? m.domains : []
                const isAvailable = m.is_accepting_mentees !== false
                const isSelf = m.user_id === currentUser?.id

                return (
                  <div
                    key={m.id}
                    className="p-5 bg-white dark:bg-surface rounded-2xl border border-border hover:border-primary/40 transition-all shadow-sm space-y-4 flex flex-col justify-between group"
                  >
                    <div className="space-y-3.5">
                      {/* Top Header: Avatar, TE/BE class badge & 5-Gold-Star Rating */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-primary text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                            {m.mentor_name ? m.mentor_name.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-text group-hover:text-primary transition-colors">
                              {m.mentor_name}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {/* TE/BE class badge */}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${
                                (m.year_of_study || '').includes('BE')
                                  ? 'bg-purple-500/15 dark:bg-purple-500/25 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                  : 'bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                              }`}>
                                {m.year_of_study || 'TE'} Class
                              </span>
                              <span className="text-[11px] text-text-secondary font-medium">
                                • {m.branch || 'PICT Pune'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Star Rating Badge with Gold Stars */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs shadow-xs">
                            <div className="flex items-center text-amber-400">
                              {[1, 2, 3, 4, 5].map((starIdx) => {
                                const avg = parseFloat(m.rating_avg || 5.0)
                                return (
                                  <Star
                                    key={starIdx}
                                    size={11}
                                    className={starIdx <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-amber-400/30"}
                                  />
                                )
                              })}
                            </div>
                            <span className="font-black text-amber-600 dark:text-amber-300">{parseFloat(m.rating_avg || 5.0).toFixed(1)}</span>
                          </div>
                          <span className="text-[10px] text-text-secondary font-medium font-mono">
                            {m.sessions_completed || 0} reviews
                          </span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                        {m.bio || 'Available for 1-on-1 technical mentorship, project design reviews, and hackathon guidance.'}
                      </p>

                      {/* Domain Badges */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                          Mentoring Domains
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {domains.map((dom, i) => {
                            const meta = getDomainBadge(dom)
                            const Icon = meta.icon
                            return (
                              <span 
                                key={i}
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${meta.badge} shadow-2xs`}
                              >
                                <Icon size={10} className="shrink-0" />
                                <span>{meta.label}</span>
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status & 1-Click Booking CTA */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={isAvailable ? 'text-emerald-600 font-semibold' : 'text-text-secondary'}>
                          {isAvailable ? `${m.max_weekly_slots || 3} Slots / Wk` : 'Slots Busy'}
                        </span>
                      </div>

                      <button
                        disabled={!isAvailable || isSelf}
                        onClick={() => {
                          setSelectedMentor(m)
                          setIsBookModalOpen(true)
                        }}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 ${
                          isSelf
                            ? 'bg-surface-dim text-text-secondary cursor-not-allowed border border-border'
                            : isAvailable
                            ? 'bg-primary hover:bg-primary-dark text-white hover:scale-[1.02] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                            : 'bg-surface-dim text-text-secondary cursor-not-allowed border border-border'
                        }`}
                        title="Book 1-on-1 office hour session with senior mentor"
                      >
                        <Clock size={13} />
                        <span>{isSelf ? 'Your Profile' : 'Book 1-on-1 Office Hour'}</span>
                        {!isSelf && isAvailable && <ChevronRight size={13} />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: MY MENTORSHIP SESSIONS */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-surface rounded-2xl border border-dashed border-border space-y-3">
              <Calendar size={36} className="mx-auto text-text-secondary/50" />
              <h4 className="text-base font-bold text-text">No Mentorship Sessions Yet</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                You haven't booked or conducted any peer mentorship sessions. Browse senior mentors and book your first pairing!
              </p>
              <button
                onClick={() => setActiveSubTab('browse')}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors inline-block"
              >
                Find a Senior Mentor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => {
                const isMentor = s.mentor_user_id === currentUser?.id
                const isMentee = s.mentee_id === currentUser?.id
                const statusStyles = {
                  REQUESTED: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                  CONFIRMED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                  COMPLETED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                  CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20'
                }

                return (
                  <div
                    key={s.id}
                    className="p-5 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusStyles[s.status] || ''}`}>
                          {s.status}
                        </span>
                        <span className="text-xs text-text-secondary font-mono">
                          {isMentor ? `Mentee: ${s.mentee_name} (${s.mentee_branch || 'PICT'})` : `Mentor: ${s.mentor_name} (${s.mentor_year})`}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-text">{s.topic}</h4>
                      {s.description && (
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                          {s.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary pt-1">
                        <span className="flex items-center gap-1 font-semibold text-text">
                          <Calendar size={13} className="text-primary" />
                          {new Date(s.preferred_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={13} className="text-primary" />
                          {s.preferred_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-primary" />
                          {s.meeting_venue}
                        </span>
                        {s.meeting_link && (
                          <a
                            href={s.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-bold"
                          >
                            <Video size={13} />
                            <span>Join Video Room</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions & Rating */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Senior Mentor Actions */}
                      {isMentor && s.status === 'REQUESTED' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'CONFIRMED', {
                              meeting_link: 'https://meet.google.com/new'
                            })}
                            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} />
                            <span>Confirm & Add Meet Link</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'CANCELLED')}
                            className="px-3 py-1.5 rounded-xl bg-surface-dim hover:bg-surface-muted text-red-600 text-xs font-semibold transition-colors border border-border"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {/* Mentor Mark Completed */}
                      {isMentor && s.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(s.id, 'COMPLETED')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} />
                          <span>Mark Completed</span>
                        </button>
                      )}

                      {/* Mentee Rating Review Action */}
                      {isMentee && s.status === 'COMPLETED' && !s.rating && (
                        <button
                          onClick={() => {
                            setReviewingSession(s)
                            setReviewRating(5)
                            setReviewFeedback('')
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                        >
                          <Star size={13} />
                          <span>Leave Review (★)</span>
                        </button>
                      )}

                      {/* Completed with rating badge */}
                      {s.rating && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold">
                          <Star size={13} className="fill-amber-500 text-amber-500" />
                          <span>{s.rating}.0 Rated</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* BOOK MENTORSHIP SESSION MODAL */}
      {isBookModalOpen && selectedMentor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <HeartHandshake className="text-primary" size={20} />
                  Book 1-on-1 Office Hour
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Request 1-on-1 technical guidance with <strong>{selectedMentor.mentor_name}</strong> ({selectedMentor.year_of_study} Class).
                </p>
              </div>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBookSession} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Topic / Goal of Discussion *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Algorithms DP Review, SIH Project Flowcharts"
                  value={bookForm.topic}
                  onChange={(e) => setBookForm({ ...bookForm, topic: e.target.value })}
                  className="w-full py-2 px-3.5 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Questions / Specific Help Needed
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what challenges you are facing or what you would like to review..."
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookForm.preferred_date}
                    onChange={(e) => setBookForm({ ...bookForm, preferred_date: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Preferred Time Slot *
                  </label>
                  <select
                    value={bookForm.preferred_time}
                    onChange={(e) => setBookForm({ ...bookForm, preferred_time: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="4:00 PM - 5:00 PM">4:00 PM - 5:00 PM (After Classes)</option>
                    <option value="5:00 PM - 6:00 PM">5:00 PM - 6:00 PM (Reading Hall)</option>
                    <option value="6:00 PM - 7:00 PM">6:00 PM - 7:00 PM (Evening Slot)</option>
                    <option value="8:00 PM - 9:00 PM">8:00 PM - 9:00 PM (Online / GMeet)</option>
                  </select>
                </div>
              </div>

              {/* CLEAR CAMPUS VENUE / GOOGLE MEET SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text flex items-center justify-between">
                  <span>Meeting Venue & Discussion Mode *</span>
                  <span className="text-[11px] font-normal text-text-secondary">Campus or Virtual</span>
                </label>

                {/* 2-Option Mode Segment: Campus In-Person vs Google Meet */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookForm({ ...bookForm, meeting_venue: 'PICT Central Reading Hall' })}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      !bookForm.meeting_venue.includes('Google Meet') && !bookForm.meeting_venue.includes('Online')
                        ? 'bg-primary/10 dark:bg-primary/20 border-primary text-text ring-1 ring-primary/40'
                        : 'bg-surface-dim border-border text-text-secondary hover:bg-surface-muted'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-surface border border-border text-primary shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text">Campus In-Person</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">PICT Reading Hall or Labs</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookForm({ ...bookForm, meeting_venue: 'Online via Google Meet' })}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      bookForm.meeting_venue.includes('Google Meet') || bookForm.meeting_venue.includes('Online')
                        ? 'bg-primary/10 dark:bg-primary/20 border-primary text-text ring-1 ring-primary/40'
                        : 'bg-surface-dim border-border text-text-secondary hover:bg-surface-muted'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-surface border border-border text-emerald-500 shrink-0">
                      <Video size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text">Google Meet</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">Direct video room link</div>
                    </div>
                  </button>
                </div>

                {/* Specific Venue Selection dropdown if In-Person */}
                {!bookForm.meeting_venue.includes('Google Meet') && !bookForm.meeting_venue.includes('Online') ? (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-text-secondary block">
                      Designated Campus Spot
                    </label>
                    <select
                      value={bookForm.meeting_venue}
                      onChange={(e) => setBookForm({ ...bookForm, meeting_venue: e.target.value })}
                      className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary font-medium"
                    >
                      <option value="PICT Central Reading Hall">PICT Central Reading Hall (Ground Floor Reference Area)</option>
                      <option value="Computer Center Lab CC-2 / CC-3">Computer Center Lab CC-2 / CC-3 (Coding Stations)</option>
                      <option value="F-Building Foyer Study Desks">F-Building Foyer Study Desks</option>
                      <option value="Department Seminar Hall">Department Seminar Hall Lobby</option>
                    </select>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <Video size={14} className="shrink-0" />
                    <span>A 1-click Google Meet room will be generated and emailed once {selectedMentor.mentor_name} confirms!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-dim hover:bg-surface-muted text-text text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Send Mentorship Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BECOME / EDIT SENIOR MENTOR MODAL */}
      {isBecomeMentorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <GraduationCap className="text-primary" size={20} />
                  Senior Mentor Profile
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Publish your tech domains and office hours to mentor junior club members.
                </p>
              </div>
              <button
                onClick={() => setIsBecomeMentorOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMentorProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Year of Study *
                </label>
                <select
                  value={mentorForm.year_of_study}
                  onChange={(e) => setMentorForm({ ...mentorForm, year_of_study: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary font-medium"
                >
                  <option value="TE">TE - Third Year (Senior)</option>
                  <option value="BE">BE - Final Year (Lead / Placed)</option>
                  <option value="Alumni">PICT Alumni / Industry Advisor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                  Select Mentoring Domains (Check all that apply)
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-surface-dim rounded-xl border border-border">
                  {DOMAIN_OPTIONS.map(d => {
                    const isChecked = mentorForm.domains.includes(d)
                    return (
                      <label key={d} className="flex items-center gap-2 text-xs text-text cursor-pointer hover:bg-surface-muted p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMentorForm({ ...mentorForm, domains: [...mentorForm.domains, d] })
                            } else {
                              setMentorForm({ ...mentorForm, domains: mentorForm.domains.filter(x => x !== d) })
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>{d}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Mentor Statement / Experience Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Winner of Smart India Hackathon '25, Placed at Persistent. Experienced in Graph DP and React. Happy to help juniors with project reviews."
                  value={mentorForm.bio}
                  onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Max Weekly Slots
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={mentorForm.max_weekly_slots}
                    onChange={(e) => setMentorForm({ ...mentorForm, max_weekly_slots: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs text-text font-semibold cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={mentorForm.is_accepting_mentees}
                      onChange={(e) => setMentorForm({ ...mentorForm, is_accepting_mentees: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Accepting New Mentees</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBecomeMentorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-dim hover:bg-surface-muted text-text text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAVE REVIEW MODAL */}
      {reviewingSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text flex items-center gap-2">
                  <Star className="text-amber-500 fill-amber-500" size={18} />
                  Review Mentorship Session
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  How was your session with <strong>{reviewingSession.mentor_name}</strong>?
                </p>
              </div>
              <button
                onClick={() => setReviewingSession(null)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="text-center py-2 space-y-2">
                <span className="text-xs font-semibold text-text-secondary block">
                  Select Star Rating
                </span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Feedback & Review Statement
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What did you learn? How helpful was the advice?"
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingSession(null)}
                  className="px-4 py-2 rounded-xl bg-surface-dim hover:bg-surface-muted text-text text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
