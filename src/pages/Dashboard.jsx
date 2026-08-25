import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, ArrowRight, Clock, MapPin, TrendingUp, CheckSquare } from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { announcements } from '../data/mock' // Keep static announcements or let them remain mock
import { motion } from 'framer-motion'

const MotionLink = motion(Link)
import { SkeletonPage } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
export default function Dashboard() {
  const { clubs, events, clubMemberships, eventMembers, tasks, currentUser, loading } = useClubSync()

  if (loading) {
    return <SkeletonPage />
  }

  const myClubs = clubs.filter(c => clubMemberships.some(m => m.club_id === c.id))
  const upcomingEvents = events.filter(e => eventMembers.some(em => em.event_id === e.id))
  const myTasks = tasks.filter(t => t.assignee_id === currentUser.id && t.status !== 'done')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back, {currentUser.name.split(' ')[0]} 👋</h1>
        <p className="text-text-secondary mt-1">Here's what's happening in your campus.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'My Clubs', value: myClubs.length, color: 'bg-primary/10 text-primary' },
          { icon: Calendar, label: 'Upcoming RSVPs', value: upcomingEvents.length, color: 'bg-green-500/10 text-green-600' },
          { icon: CheckSquare, label: 'Pending Tasks', value: myTasks.length, color: 'bg-orange-500/10 text-orange-600' },
          { icon: Clock, label: 'Total Events', value: events.length, color: 'bg-blue-500/10 text-blue-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-surface rounded-xl p-4 border border-border">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-text-secondary">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side: My Clubs & Announcements */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">My Clubs</h2>
              <Link to="/clubs" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {myClubs.map(club => {
                const role = clubMemberships.find(m => m.club_id === club.id)?.role
                return (
                  <MotionLink
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={club.id}
                    to={`/clubs/${club.id}`}
                    className="flex items-center gap-3 bg-white dark:bg-surface rounded-xl p-4 border border-border transition-colors hover:border-primary/50"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: club.color }}
                    >
                      {club.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{club.name}</div>
                      <div className="text-xs text-text-secondary">{club.category} · <span className="font-semibold text-primary">{role}</span></div>
                    </div>
                  </MotionLink>
                )
              })}
              {myClubs.length === 0 && (
                <p className="text-xs text-text-secondary bg-white dark:bg-surface border border-border rounded-xl p-4 text-center">
                  You haven't joined any clubs yet. Go to <Link to="/clubs" className="text-primary hover:underline">Clubs</Link> to explore!
                </p>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div>
            <h2 className="font-semibold text-lg mb-4">Announcements</h2>
            <div className="space-y-3">
              {announcements.map(a => {
                const club = clubs.find(c => c.id === a.clubId)
                return (
                  <div key={a.id} className="bg-white dark:bg-surface rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-primary">{club?.name}</span>
                      <span className="text-xs text-text-secondary">· {a.date}</span>
                    </div>
                    <div className="font-medium text-sm">{a.title}</div>
                    <p className="text-xs text-text-secondary mt-1">{a.message}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Side: My Tasks & Upcoming Events */}
        <div className="lg:col-span-2 space-y-8">
          {/* My Tasks */}
          <div>
            <h2 className="font-semibold text-lg mb-4">My Assigned Tasks</h2>
            <div className="space-y-3">
              {myTasks.map(t => {
                const club = clubs.find(c => c.id === t.club_id)
                return (
                  <div key={t.id} className="bg-white dark:bg-surface border border-border p-4 rounded-xl flex justify-between items-center hover:shadow-sm transition-shadow">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">{club?.name}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          t.status === 'todo' ? 'bg-surface-muted text-text-secondary' : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm">{t.title}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">{t.description}</p>
                    </div>
                    <div className="text-right text-[11px] text-text-secondary">
                      <div>Due Date:</div>
                      <div className="font-medium text-text">{t.due_date}</div>
                    </div>
                  </div>
                )
              })}
              {myTasks.length === 0 && (
                <EmptyState 
                  icon={CheckSquare} 
                  title="All caught up!" 
                  description="No pending tasks assigned to you. 🎉" 
                />
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Upcoming Events</h2>
              <Link to="/events" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {events
                .filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0))
                .sort((a,b) => new Date(a.date) - new Date(b.date))
                .slice(0, 4)
                .map(event => {
                const club = clubs.find(c => c.id === event.club_id)
                const isRSVPed = eventMembers.some(em => em.event_id === event.id && em.user_id === currentUser.id)
                return (
                  <MotionLink
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden transition-all hover:border-primary/50 group flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className="h-1.5"
                        style={{ background: club?.color || '#6c5ce7' }}
                      />
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${club?.color}15`, color: club?.color }}
                          >
                            {club?.name}
                          </span>
                          <span className="text-[10px] text-text-secondary">{event.category}</span>
                        </div>
                        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors text-sm">{event.title}</h3>
                        <p className="text-xs text-text-secondary line-clamp-2 mb-3">{event.description}</p>
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-3 border-t border-border/40 flex justify-between items-center text-[10px] text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {isRSVPed ? (
                        <span className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold">Going</span>
                      ) : (
                        <span className="text-primary font-semibold">RSVP →</span>
                      )}
                    </div>
                  </MotionLink>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
