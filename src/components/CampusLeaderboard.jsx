import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Trophy, 
  Award, 
  Medal, 
  Flame, 
  Users, 
  Calendar, 
  CheckCircle2, 
  GraduationCap, 
  TrendingUp, 
  Info, 
  ChevronRight,
  Sparkles,
  Filter,
  BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function CampusLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [topClub, setTopClub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showFormula, setShowFormula] = useState(false)

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const url = categoryFilter === 'All' 
        ? `${API_URL}/api/clubs/leaderboard` 
        : `${API_URL}/api/clubs/leaderboard?category=${encodeURIComponent(categoryFilter)}`
      const res = await fetch(url)
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
      setTopClub(data.topClub || null)
    } catch (err) {
      console.error('Failed to load campus leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [categoryFilter])

  const categories = ['All', 'Technical', 'Technology', 'Arts & Culture', 'Digital Media', 'Entrepreneurship']

  const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(c => c.impactScore), 1) : 100
  const totalAICTEAcrossCampus = leaderboard.reduce((acc, c) => acc + (c.aictePointsAwarded || 0), 0)
  const totalRegistrations = leaderboard.reduce((acc, c) => acc + (c.registrations || 0), 0)
  const totalEventsConducted = leaderboard.reduce((acc, c) => acc + (c.eventsCount || 0), 0)

  // Podium order: 2nd place (left), 1st place (center), 3rd place (right)
  const first = leaderboard[0]
  const second = leaderboard[1]
  const third = leaderboard[2]

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-primary-dark to-purple-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
              <Sparkles size={14} className="animate-spin text-amber-300" />
              PICT Pune Official Inter-Club Championship
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              Campus Impact Leaderboard 🏆
            </h2>
            <p className="text-white/80 text-sm max-w-xl">
              Real-time student engagement, flagship hackathon turnouts, verified attendance, and AICTE 100 Activity Points conferred across PICT Pune.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowFormula(!showFormula)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium transition-all"
            >
              <Info size={14} />
              {showFormula ? 'Hide Scoring Logic' : 'How Points Work'}
            </button>
          </div>
        </div>

        {/* Aggregate Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
            <div className="text-xs text-white/70 flex items-center gap-1.5">
              <BarChart3 size={13} className="text-indigo-400" />
              Campus Clubs
            </div>
            <div className="text-xl font-bold mt-1">{leaderboard.length}</div>
          </div>
          <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
            <div className="text-xs text-white/70 flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-400" />
              Events Hosted
            </div>
            <div className="text-xl font-bold mt-1">{totalEventsConducted}</div>
          </div>
          <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
            <div className="text-xs text-white/70 flex items-center gap-1.5">
              <Users size={13} className="text-sky-400" />
              Total RSVPs
            </div>
            <div className="text-xl font-bold mt-1">{totalRegistrations}</div>
          </div>
          <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
            <div className="text-xs text-white/70 flex items-center gap-1.5">
              <GraduationCap size={13} className="text-amber-400" />
              AICTE Pts Awarded
            </div>
            <div className="text-xl font-bold mt-1">{totalAICTEAcrossCampus} pts</div>
          </div>
        </div>

        {/* Expandable Scoring Formula Drawer */}
        {showFormula && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/20 text-xs space-y-3 backdrop-blur-md"
          >
            <div className="font-semibold text-amber-300 flex items-center gap-1.5 text-sm">
              <Sparkles size={16} /> Campus Impact Score (CIS) Computation Formula
            </div>
            <div className="grid sm:grid-cols-5 gap-3 text-white/90">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-white">50 pts</div>
                <div className="text-[11px] text-white/70">Per Event Hosted</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-white">10 pts</div>
                <div className="text-[11px] text-white/70">Per Student RSVP</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-emerald-400">25 pts</div>
                <div className="text-[11px] text-white/70">Per Verified Check-In</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-amber-400">5 pts</div>
                <div className="text-[11px] text-white/70">Per AICTE Pt Conferred</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-indigo-300">5 pts</div>
                <div className="text-[11px] text-white/70">Per Enrolled Member</div>
              </div>
            </div>
            <p className="text-[11px] text-white/60">
              Formula is updated in real time whenever an event is concluded, tickets are checked in at the door via QR scanners, or membership rosters grow.
            </p>
          </motion.div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-semibold text-text-secondary flex items-center gap-1 mr-1">
          <Filter size={13} /> Filter:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'bg-surface border border-border text-text-secondary hover:text-text hover:border-text-secondary/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Top 3 Podium (Only displayed if at least 2 clubs exist) */}
          {leaderboard.length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-8">
              {/* 2nd Place: Silver (Left) */}
              {second && (
                <div className="order-2 md:order-1 bg-surface border border-border rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between h-[310px]">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-base shadow-md border-2 border-white dark:border-surface">
                    🥈
                  </div>
                  <div className="text-center pt-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-500/10 px-2.5 py-0.5 rounded-full">
                      Rank #2 · Platinum Tier
                    </span>
                    <h3 className="font-bold text-base mt-2 line-clamp-1">{second.name}</h3>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                      {second.category}
                    </p>
                    <div className="my-3 inline-block px-3 py-1 rounded-xl bg-surface-dim border border-border">
                      <div className="text-xl font-black text-text">{second.impactScore}</div>
                      <div className="text-[10px] text-text-secondary uppercase font-semibold">Impact Points</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-border text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span>Events / Members</span>
                      <span className="font-semibold text-text">{second.eventsCount} / {second.membersCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Turnout</span>
                      <span className="font-semibold text-text">{second.registrations} attendees</span>
                    </div>
                    <Link
                      to={`/clubs/${second.id}`}
                      className="mt-3 block text-center py-2 px-3 rounded-xl bg-surface-dim hover:bg-primary/10 hover:text-primary border border-border font-medium text-xs transition-colors"
                    >
                      Visit Club Profile →
                    </Link>
                  </div>
                </div>
              )}

              {/* 1st Place: Gold Apex (Center - Elevated) */}
              {first && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-surface to-surface border-2 border-amber-500/40 rounded-3xl p-6 shadow-xl relative flex flex-col justify-between h-[360px] ring-2 ring-amber-500/20">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-white flex items-center justify-center font-bold text-2xl shadow-lg border-4 border-white dark:border-surface animate-bounce">
                    🏆
                  </div>
                  <div className="text-center pt-6">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
                      🥇 #1 Campus Apex Champion
                    </span>
                    <h3 className="font-black text-lg mt-2.5 line-clamp-1 text-text">{first.name}</h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium line-clamp-1">
                      Flagship: {first.flagshipEvent}
                    </p>
                    <div className="my-3 inline-block px-4 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                      <div className="text-3xl font-black text-amber-500">{first.impactScore}</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">Campus Impact Score</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-border text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span>Events Hosted</span>
                      <span className="font-bold text-text">{first.eventsCount} events</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified Check-Ins</span>
                      <span className="font-bold text-emerald-600">{first.verifiedAttendees} students</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AICTE Points Conferred</span>
                      <span className="font-bold text-amber-600">{first.aictePointsAwarded} pts</span>
                    </div>
                    <Link
                      to={`/clubs/${first.id}`}
                      className="mt-3 block text-center py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/30 transition-all"
                    >
                      👑 Explore #1 Club
                    </Link>
                  </div>
                </div>
              )}

              {/* 3rd Place: Bronze (Right) */}
              {third && (
                <div className="order-3 bg-surface border border-border rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between h-[290px]">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-700/80 text-amber-100 flex items-center justify-center font-bold text-base shadow-md border-2 border-white dark:border-surface">
                    🥉
                  </div>
                  <div className="text-center pt-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500 bg-amber-700/10 px-2.5 py-0.5 rounded-full">
                      Rank #3 · Platinum Tier
                    </span>
                    <h3 className="font-bold text-base mt-2 line-clamp-1">{third.name}</h3>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                      {third.category}
                    </p>
                    <div className="my-3 inline-block px-3 py-1 rounded-xl bg-surface-dim border border-border">
                      <div className="text-xl font-black text-text">{third.impactScore}</div>
                      <div className="text-[10px] text-text-secondary uppercase font-semibold">Impact Points</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-border text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span>Events / Members</span>
                      <span className="font-semibold text-text">{third.eventsCount} / {third.membersCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flagship</span>
                      <span className="font-semibold text-text line-clamp-1">{third.flagshipEvent}</span>
                    </div>
                    <Link
                      to={`/clubs/${third.id}`}
                      className="mt-3 block text-center py-2 px-3 rounded-xl bg-surface-dim hover:bg-primary/10 hover:text-primary border border-border font-medium text-xs transition-colors"
                    >
                      Visit Club Profile →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Campus Ranking Table */}
          <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  Official Inter-Club Standings
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Updated dynamically according to official PICT Student Council guidelines.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-dim border border-border text-text-secondary">
                {leaderboard.length} Clubs Competing
              </span>
            </div>

            <div className="divide-y divide-border overflow-x-auto">
              {leaderboard.map((club) => {
                const percentage = Math.min(Math.round((club.impactScore / maxScore) * 100), 100)
                return (
                  <div
                    key={club.id}
                    className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-surface-dim/50 transition-colors"
                  >
                    {/* Rank & Club Info */}
                    <div className="flex items-center gap-4 min-w-[240px]">
                      <div className="w-8 text-center shrink-0">
                        {club.rank === 1 ? (
                          <span className="text-xl">🥇</span>
                        ) : club.rank === 2 ? (
                          <span className="text-xl">🥈</span>
                        ) : club.rank === 3 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="font-black text-sm text-text-secondary">#{club.rank}</span>
                        )}
                      </div>

                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                        style={{ background: club.color || '#6c5ce7' }}
                      >
                        {club.name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/clubs/${club.id}`}
                            className="font-bold text-sm text-text hover:text-primary transition-colors truncate"
                          >
                            {club.name}
                          </Link>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-dim border border-border text-text-secondary shrink-0">
                            {club.category}
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5 truncate">
                          Flagship: <span className="font-medium text-text">{club.flagshipEvent}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Metrics (Hidden on mobile) */}
                    <div className="hidden lg:grid grid-cols-4 gap-6 text-center text-xs shrink-0">
                      <div>
                        <div className="font-bold text-text">{club.eventsCount}</div>
                        <div className="text-[10px] text-text-secondary">Events</div>
                      </div>
                      <div>
                        <div className="font-bold text-text">{club.registrations}</div>
                        <div className="text-[10px] text-text-secondary">RSVPs</div>
                      </div>
                      <div>
                        <div className="font-bold text-emerald-600">{club.verifiedAttendees}</div>
                        <div className="text-[10px] text-text-secondary">Check-Ins</div>
                      </div>
                      <div>
                        <div className="font-bold text-amber-500">{club.aictePointsAwarded} pts</div>
                        <div className="text-[10px] text-text-secondary">AICTE Pts</div>
                      </div>
                    </div>

                    {/* Score Bar & Total */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-24 md:w-36 hidden sm:block">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-text-secondary font-medium">{club.tier}</span>
                          <span className="font-bold text-text">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-surface-dim rounded-full overflow-hidden border border-border/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              club.rank === 1
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : club.rank <= 3
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                : 'bg-primary/70'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-right shrink-0 min-w-[70px]">
                        <div className="text-base md:text-lg font-black text-text">
                          {club.impactScore}
                        </div>
                        <div className="text-[9px] uppercase font-bold text-text-secondary tracking-wider">
                          CIS Pts
                        </div>
                      </div>

                      <Link
                        to={`/clubs/${club.id}`}
                        className="p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-surface-dim transition-colors"
                        title="View Club"
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
