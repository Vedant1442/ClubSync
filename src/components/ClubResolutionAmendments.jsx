import React, { useState, useEffect } from 'react'
import { 
  Vote, CheckCircle2, XCircle, MinusCircle, AlertCircle, 
  Clock, Plus, FileText, ChevronRight, MessageSquare, 
  ShieldCheck, Sparkles, Scale, ArrowRight, X, ThumbsUp, ThumbsDown
} from 'lucide-react'
import { toast } from 'sonner'

export default function ClubResolutionAmendments({ clubId, currentUser, isOfficer = false }) {
  const [resolutions, setResolutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [votingId, setVotingId] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [voteComment, setVoteComment] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    clause_affected: '',
    existing_text: '',
    proposed_amendment: '',
    rationale: '',
    quorum_required: 6,
    voting_deadline: ''
  })

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const fetchResolutions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/resolutions/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setResolutions(data)
      }
    } catch (err) {
      console.error('Failed to load resolutions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clubId) fetchResolutions()
  }, [clubId])

  // Cast Vote Handler
  const handleCastVote = async (resolutionId, voteChoice) => {
    try {
      setVotingId(resolutionId)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/resolutions/${resolutionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vote: voteChoice,
          comment: voteComment
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record vote')

      toast.success(data.message)
      setVoteComment('')
      fetchResolutions()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setVotingId(null)
    }
  }

  // Conclude Resolution Handler (Officers only)
  const handleConclude = async (resolutionId) => {
    if (!window.confirm('Conclude voting and tally supermajority for this amendment?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/resolutions/${resolutionId}/conclude`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to conclude resolution')

      toast.success(data.message)
      fetchResolutions()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Create Resolution Handler
  const handleCreateResolution = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.clause_affected.trim() || !formData.proposed_amendment.trim() || !formData.rationale.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/resolutions/clubs/${clubId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to propose resolution')
      }

      toast.success('New Constitutional Amendment Resolution tabled for voting!')
      setIsAddModalOpen(false)
      setFormData({
        title: '',
        clause_affected: '',
        existing_text: '',
        proposed_amendment: '',
        rationale: '',
        quorum_required: 6,
        voting_deadline: ''
      })
      fetchResolutions()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const activeResolutions = resolutions.filter(r => r.status === 'VOTING_OPEN')
  const totalVotesCast = resolutions.reduce((sum, r) => sum + r.total_votes, 0)

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <Scale className="text-primary" size={22} />
              Constitution & By-Laws Amendment Referendum
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
              Collegiate Governance
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Democratically table constitutional amendments, debate by-law reforms, and cast supermajority votes (66% required) to ratify changes into law.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
        >
          <Plus size={15} />
          <span>Propose Amendment Resolution</span>
        </button>
      </div>

      {/* KPI Governance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Open Resolutions</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Vote size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-text mt-2">
            {activeResolutions.length} In Voting
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Active referendum ballots on floor
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Total Ballots Cast</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {totalVotesCast} Votes
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Across club membership roster
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Supermajority Bar</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Scale size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            66.6% YES
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Required threshold to amend by-laws
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Ratified Laws</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-2">
            {resolutions.filter(r => r.status === 'PASSED').length} Passed
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Incorporated into club constitution
          </span>
        </div>
      </div>

      {/* RESOLUTIONS CARDS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-text-secondary text-sm font-semibold animate-pulse">
            Loading constitutional referendum ballots...
          </div>
        ) : resolutions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-surface rounded-2xl border border-dashed border-border space-y-3">
            <Scale size={36} className="mx-auto text-text-secondary/50" />
            <h4 className="text-base font-bold text-text">No Constitutional Resolutions Tabled</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              No amendment proposals have been tabled yet. Click "Propose Amendment Resolution" to suggest by-law updates.
            </p>
          </div>
        ) : (
          resolutions.map(r => {
            const isVotingOpen = r.status === 'VOTING_OPEN' && !r.is_expired
            const hasVoted = Boolean(r.user_vote)

            return (
              <div
                key={r.id}
                className="p-6 bg-white dark:bg-surface rounded-3xl border border-border shadow-sm space-y-5"
              >
                {/* Header: Title, Status, Clause */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        r.status === 'PASSED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : r.status === 'REJECTED'
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {r.status === 'VOTING_OPEN' ? 'Ballot Open' : r.status}
                      </span>
                      <span className="text-xs text-primary font-mono font-semibold">
                        {r.clause_affected}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-text mt-1.5">{r.title}</h3>
                    <div className="text-xs text-text-secondary mt-0.5">
                      Proposed by <strong className="text-text">{r.proposer_name}</strong> • Voting deadline: {new Date(r.voting_deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Quorum and Supermajority Status */}
                  <div className="text-left sm:text-right shrink-0 space-y-1">
                    <div className="text-xs font-mono font-bold text-text">
                      Quorum: {r.total_votes} / {r.quorum_required} Votes
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                      r.quorum_met ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {r.quorum_met ? '✓ Quorum Achieved' : 'Awaiting Quorum'}
                    </span>
                  </div>
                </div>

                {/* SIDE-BY-SIDE DIFF COMPARISON BOX */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Current Clause */}
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                      Current Constitutional Text
                    </span>
                    <p className="text-text-secondary leading-relaxed font-mono text-[11px]">
                      {r.existing_text || 'No previous clause specified (New Addition).'}
                    </p>
                  </div>

                  {/* Proposed Amendment */}
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                      Proposed Constitutional Amendment
                    </span>
                    <p className="text-text font-medium leading-relaxed font-mono text-[11px]">
                      {r.proposed_amendment}
                    </p>
                  </div>
                </div>

                {/* Strategic Rationale */}
                <div className="p-3 bg-surface-dim rounded-2xl border border-border text-xs text-text-secondary leading-relaxed">
                  <strong className="text-text">Rationale:</strong> {r.rationale}
                </div>

                {/* LIVE VOTING GAUGE BAR */}
                <div className="space-y-2 p-4 bg-surface-dim rounded-2xl border border-border">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <ThumbsUp size={14} /> FOR ({r.yes_count} votes • {r.yes_percent}%)
                    </span>
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      AGAINST ({r.no_count} votes) <ThumbsDown size={14} />
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-3 bg-surface-muted rounded-full overflow-hidden flex border border-border/60">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${r.yes_percent}%` }}
                    />
                    <div 
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${100 - r.yes_percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-secondary font-mono pt-0.5">
                    <span>Supermajority Bar: 66.6% YES required</span>
                    <span>Abstentions: {r.abstain_count}</span>
                  </div>
                </div>

                {/* VOTING BOOTH / ACTION CONTROLS */}
                {isVotingOpen ? (
                  <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      {hasVoted ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span className="font-semibold text-text">
                            You voted <strong className="text-primary">{r.user_vote}</strong>. (You can change vote before deadline).
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-text-secondary">
                          Cast your official ballot on this resolution:
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleCastVote(r.id, 'YES')}
                        disabled={votingId === r.id}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                          r.user_vote === 'YES'
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                        }`}
                      >
                        <ThumbsUp size={13} />
                        <span>Vote FOR (YES)</span>
                      </button>

                      <button
                        onClick={() => handleCastVote(r.id, 'NO')}
                        disabled={votingId === r.id}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                          r.user_vote === 'NO'
                            ? 'bg-red-600 text-white ring-2 ring-red-400'
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/30'
                        }`}
                      >
                        <ThumbsDown size={13} />
                        <span>Vote AGAINST (NO)</span>
                      </button>

                      <button
                        onClick={() => handleCastVote(r.id, 'ABSTAIN')}
                        disabled={votingId === r.id}
                        className={`px-3 py-2 rounded-xl font-semibold text-xs transition-all ${
                          r.user_vote === 'ABSTAIN'
                            ? 'bg-gray-600 text-white'
                            : 'bg-surface-dim hover:bg-surface-muted text-text-secondary border border-border'
                        }`}
                      >
                        Abstain
                      </button>

                      {/* Officer Ratify Action */}
                      {isOfficer && (
                        <button
                          onClick={() => handleConclude(r.id)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-sm ml-auto sm:ml-2"
                        >
                          Conclude & Ratify
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-secondary">
                    <span>Voting closed on {new Date(r.voting_deadline).toLocaleDateString('en-IN')}.</span>
                    <span className="font-bold text-text">
                      Outcome: {r.status}
                    </span>
                  </div>
                )}

                {/* Member Rationale Comments Feed */}
                {r.recent_comments && r.recent_comments.length > 0 && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                      Member Voter Rationale
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {r.recent_comments.map((c, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-surface-dim border border-border text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text">{c.voter_name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                              c.vote === 'YES' ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-600 bg-red-500/10'
                            }`}>
                              {c.vote}
                            </span>
                          </div>
                          <p className="text-text-secondary text-[11px] leading-relaxed">
                            "{c.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* PROPOSE AMENDMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Scale className="text-primary" size={20} />
                  Propose Constitutional Amendment Resolution
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Table a formal by-law change for democratic voting.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateResolution} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Resolution Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Resolution 2026-B: Establish Web3 Wing & Revise Officer Quorum"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full py-2 px-3.5 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Target Clause / Article Affected *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Article IV, Section 2: Officer Terms & Eligibility"
                  value={formData.clause_affected}
                  onChange={(e) => setFormData({ ...formData, clause_affected: e.target.value })}
                  className="w-full py-2 px-3.5 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Existing Constitutional Clause Text
                </label>
                <textarea
                  rows={2}
                  placeholder="Current wording as found in the club constitution..."
                  value={formData.existing_text}
                  onChange={(e) => setFormData({ ...formData, existing_text: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Proposed New Amendment Wording *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the proposed amended wording to replace the existing clause..."
                  value={formData.proposed_amendment}
                  onChange={(e) => setFormData({ ...formData, proposed_amendment: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary resize-none font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Strategic Rationale & Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Why is this constitutional change beneficial for the club?"
                  value={formData.rationale}
                  onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Quorum Required (Votes)
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="50"
                    value={formData.quorum_required}
                    onChange={(e) => setFormData({ ...formData, quorum_required: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Voting Closes On
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.voting_deadline}
                    onChange={(e) => setFormData({ ...formData, voting_deadline: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-dim hover:bg-surface-muted text-text text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Table Resolution for Voting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
