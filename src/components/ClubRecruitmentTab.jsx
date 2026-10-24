import React, { useState, useEffect } from 'react'
import { 
  Briefcase, CheckCircle2, Clock, XCircle, UserCheck, 
  Sparkles, ExternalLink, Send, ArrowRight, Award, 
  Calendar, Users, ChevronRight, MessageSquare, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function ClubRecruitmentTab({ club, isOfficer, currentUser }) {
  const [drive, setDrive] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [statement, setStatement] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filterDomain, setFilterDomain] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchRecruitment = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/recruitment/${club.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDrive(data.drive)
        setApplications(data.applications || [])
        if (data.drive && data.drive.domains?.length > 0) {
          setSelectedDomain(data.drive.domains[0])
        }
      }
    } catch (e) {
      console.error('Failed to load recruitment:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (club?.id) fetchRecruitment()
  }, [club?.id])

  const handleApply = async (e) => {
    e.preventDefault()
    if (!statement.trim()) {
      toast.error('Please enter your statement of purpose')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/recruitment/${club.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          drive_id: drive.id,
          domain: selectedDomain,
          portfolio_url: portfolioUrl.trim(),
          statement_of_purpose: statement.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit application')

      toast.success('Application submitted successfully! Officers have been notified.')
      setStatement('')
      setPortfolioUrl('')
      fetchRecruitment()
    } catch (err) {
      toast.error(err.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/recruitment/${club.id}/applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')

      toast.success(`Candidate marked as ${newStatus.replace('_', ' ').toUpperCase()}`)
      fetchRecruitment()
    } catch (err) {
      toast.error(err.message || 'Status update failed')
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-text-secondary text-sm">
        Loading recruitment drive and applications...
      </div>
    )
  }

  if (!drive) {
    return (
      <div className="bg-white dark:bg-surface border border-border rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
          <Briefcase size={24} />
        </div>
        <h3 className="font-bold text-base text-text">No Active Recruitment Drive</h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto mt-1 mb-4">
          {club.name} is not currently running an open recruitment drive. Check back next semester or join as a general club member.
        </p>
      </div>
    )
  }

  const myApplication = !isOfficer && applications.length > 0 ? applications[0] : null
  const filteredApps = applications.filter(app => {
    if (filterDomain !== 'all' && app.domain !== filterDomain) return false
    if (filterStatus !== 'all' && app.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Drive Announcement Banner */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-primary to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-md overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
              Official Audition Call
            </span>
            {drive.deadline && (
              <span className="text-xs text-white/80 flex items-center gap-1">
                <Calendar size={13} /> Apply by {new Date(drive.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            {drive.title}
          </h2>

          <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-5">
            {drive.description}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white/90 mr-1">Open Domains:</span>
            {drive.domains?.map(dom => (
              <span key={dom} className="text-xs font-semibold px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                {dom}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* STUDENT VIEW: Status or Application Form */}
      {!isOfficer && (
        <div>
          {myApplication ? (
            <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text">Your Submitted Application</h3>
                    <p className="text-xs text-text-secondary">Domain: <span className="font-semibold text-text">{myApplication.domain}</span></p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {myApplication.status === 'accepted' && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Accepted into Core Team
                    </span>
                  )}
                  {myApplication.status === 'shortlisted' && (
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-bold flex items-center gap-1.5">
                      <Sparkles size={14} /> Shortlisted for Interview
                    </span>
                  )}
                  {myApplication.status === 'pending' && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
                      <Clock size={14} /> Application Under Review
                    </span>
                  )}
                  {myApplication.status === 'rejected' && (
                    <span className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-600 border border-gray-500/20 text-xs font-bold flex items-center gap-1.5">
                      <XCircle size={14} /> Not Selected
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-text-secondary font-medium block">Statement of Purpose:</span>
                  <p className="text-text bg-surface-dim p-3 rounded-xl border border-border mt-1 leading-relaxed">
                    {myApplication.statement_of_purpose}
                  </p>
                </div>

                {myApplication.portfolio_url && (
                  <div>
                    <span className="text-text-secondary font-medium block">Portfolio / GitHub:</span>
                    <a 
                      href={myApplication.portfolio_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline font-mono inline-flex items-center gap-1 mt-0.5"
                    >
                      {myApplication.portfolio_url} <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {myApplication.officer_notes && (
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-text">
                    <span className="font-bold text-primary block mb-0.5">Officer Feedback Note:</span>
                    {myApplication.officer_notes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-text mb-1">Submit Application for {club.name}</h3>
              <p className="text-xs text-text-secondary mb-5">
                Apply to become a core organizer, lead technical projects, and shape campus culture.
              </p>

              <form onSubmit={handleApply} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Desired Domain *</label>
                    <select
                      value={selectedDomain}
                      onChange={e => setSelectedDomain(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-surface-dim text-text text-sm focus:outline-none focus:border-primary"
                    >
                      {drive.domains?.map(dom => (
                        <option key={dom} value={dom}>{dom}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">GitHub / Portfolio URL</label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={e => setPortfolioUrl(e.target.value)}
                      placeholder="https://github.com/username or behance"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-surface-dim text-text text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Statement of Purpose & Experience *</label>
                  <textarea
                    required
                    rows={4}
                    value={statement}
                    onChange={e => setStatement(e.target.value)}
                    placeholder="Tell us about your technical/design/management background, relevant projects, and what you aim to contribute to this team..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-surface-dim text-text text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-text-secondary">
                    Applying as: <span className="font-bold text-text">{currentUser.name}</span> {currentUser.college_id ? `(${currentUser.college_id})` : ''}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* OFFICER VIEW: Candidate Review Board */}
      {isOfficer && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div>
              <h3 className="font-bold text-base text-text">Candidate Applications ({applications.length})</h3>
              <p className="text-xs text-text-secondary">Review applicants, shortlist for interviews, and accept into Core Team</p>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border bg-white dark:bg-surface text-text text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filterDomain}
                onChange={e => setFilterDomain(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border bg-white dark:bg-surface text-text text-xs"
              >
                <option value="all">All Domains</option>
                {drive.domains?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {filteredApps.length > 0 ? (
            <div className="grid gap-3">
              {filteredApps.map(app => (
                <div 
                  key={app.id}
                  className="bg-white dark:bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text">{app.full_name}</span>
                        {app.college_id && (
                          <span className="font-mono text-[10px] bg-surface-dim px-2 py-0.5 rounded border border-border text-text font-semibold">
                            {app.college_id}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {app.domain}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {app.email} {app.branch ? `• ${app.branch}` : ''}
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        app.status === 'shortlisted' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                        app.status === 'rejected' ? 'bg-gray-500/10 text-gray-600 border border-gray-500/20' :
                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* SOP Text */}
                  <div className="p-3 bg-surface-dim rounded-xl border border-border text-xs text-text leading-relaxed">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block mb-0.5">Candidate SOP:</span>
                    {app.statement_of_purpose}
                  </div>

                  {/* Links & Action Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border">
                    <div>
                      {app.portfolio_url ? (
                        <a 
                          href={app.portfolio_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 font-mono"
                        >
                          Portfolio Link <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[11px] text-text-secondary italic">No external portfolio link</span>
                      )}
                    </div>

                    {/* Officer Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                        className="px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(app.id, 'accepted')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 size={13} />
                        <span>Accept to Core</span>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(app.id, 'rejected')}
                        className="px-2.5 py-1.5 rounded-xl border border-border hover:bg-surface-muted text-text-secondary text-xs transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-surface border border-border rounded-2xl text-text-secondary text-xs">
              No applications matching the selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
