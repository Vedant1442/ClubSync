import React, { useState, useEffect } from 'react'
import { 
  Users, UserPlus, Copy, Check, Share2, Sparkles, 
  ShieldCheck, ArrowRight, Crown, MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function EventTeamSection({ event, club, currentUser, onTeamUpdated }) {
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('create') // 'create' | 'join'
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/events/${event.id}/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTeam(data.team)
        setMembers(data.members || [])
      }
    } catch (e) {
      console.error('Failed to load team:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (event?.id) fetchTeam()
  }, [event?.id])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!teamName.trim()) return

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/events/${event.id}/teams/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ team_name: teamName.trim() })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create squad')

      toast.success(`Squad "${data.team.name}" created! Share the code with your teammates.`)
      setTeam(data.team)
      setMembers(data.members || [])
      if (onTeamUpdated) onTeamUpdated()
    } catch (err) {
      toast.error(err.message || 'Squad creation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoinTeam = async (e) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/events/${event.id}/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ invite_code: inviteCode.trim() })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join squad')

      toast.success(`Joined squad "${data.team.name}" successfully!`)
      setTeam(data.team)
      setMembers(data.members || [])
      if (onTeamUpdated) onTeamUpdated()
    } catch (err) {
      toast.error(err.message || 'Failed to join squad')
    } finally {
      setSubmitting(false)
    }
  }

  const copyCode = () => {
    if (!team) return
    navigator.clipboard.writeText(team.invite_code)
    setCopied(true)
    toast.success('Invite code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    if (!team) return
    const text = `🚀 *Join our Hackathon Squad: "${team.name}"!*\n🏆 Event: *${event.title}* (${club?.name || 'PICT'})\n🔑 Squad Code: *${team.invite_code}*\n\n👉 Enter this code on ClubSync to register with us:\n${window.location.href}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (loading) {
    return <div className="p-4 text-xs text-text-secondary text-center">Checking hackathon squad status...</div>
  }

  return (
    <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Users size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text">Hackathon Squad & Team Roster</h3>
            <p className="text-[11px] text-text-secondary">Official 2–4 member team formation for {event.title}</p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Squad Event
        </span>
      </div>

      {/* SQUAD MEMBER VIEW */}
      {team ? (
        <div className="p-5 bg-surface-dim rounded-2xl border border-border space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-border">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary block">Registered Squad</span>
              <h4 className="text-lg font-black text-text flex items-center gap-2">
                <span>{team.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  {members.length} / 4 Members
                </span>
              </h4>
            </div>

            {/* Invite Code Bar */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-white dark:bg-surface border border-border rounded-xl flex items-center gap-2">
                <span className="text-[10px] text-text-secondary font-medium">Invite Code:</span>
                <span className="font-mono font-black text-sm text-primary select-all">{team.invite_code}</span>
                <button 
                  onClick={copyCode}
                  className="p-1 hover:bg-surface-muted rounded text-text-secondary hover:text-text transition-colors"
                  title="Copy code"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>

              <button
                onClick={shareWhatsApp}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                title="Invite Teammates via WhatsApp"
              >
                <MessageCircle size={15} />
              </button>
            </div>
          </div>

          {/* Member Roster List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Squad Members</span>
            <div className="grid sm:grid-cols-2 gap-2">
              {members.map(m => {
                const isLeader = m.user_id === team.leader_id
                return (
                  <div 
                    key={m.id || m.user_id}
                    className="p-3 bg-white dark:bg-surface rounded-xl border border-border flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {(m.user_name || 'M').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-text truncate">{m.user_name}</span>
                        {isLeader && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                            <Crown size={9} /> Leader
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-secondary font-mono truncate">
                        {m.college_id ? `PRN: ${m.college_id}` : m.user_email} {m.branch ? `• ${m.branch}` : ''}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Empty slot indicators up to 4 */}
              {Array.from({ length: Math.max(0, 4 - members.length) }).map((_, idx) => (
                <div 
                  key={idx}
                  className="p-3 border border-dashed border-border/80 rounded-xl flex items-center justify-center text-xs text-text-secondary/70 italic"
                >
                  + Open Squad Slot {members.length + idx + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CREATE OR JOIN FORM */
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-border pb-2">
            <button
              onClick={() => setMode('create')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                mode === 'create'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Create New Squad
            </button>
            <button
              onClick={() => setMode('join')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                mode === 'join'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Join with Invite Code
            </button>
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Enter Squad Name (e.g. ByteForce PICT)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface-dim text-text text-xs focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 shrink-0"
              >
                {submitting ? 'Creating...' : 'Create Squad & Get Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinTeam} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                maxLength={8}
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Enter 6-Char Squad Code (e.g. A9B2X1)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface-dim text-text font-mono uppercase text-xs focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 shrink-0"
              >
                {submitting ? 'Joining...' : 'Join Squad'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
