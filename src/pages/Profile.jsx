import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Users, Calendar, Edit, ArrowRight } from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import EmptyState from '../components/EmptyState'
import { AnimatePresence } from 'framer-motion'
import EditProfileModal from '../components/EditProfileModal'

export default function Profile() {
  const { currentUser, clubs, events, clubMemberships, eventMembers } = useClubSync()
  const [isEditing, setIsEditing] = useState(false)

  if (!currentUser) return null;

  const myClubs = clubs.filter(c => clubMemberships.some(m => m.club_id === c.id))
  const myEvents = events.filter(e => eventMembers.some(em => em.event_id === e.id && em.user_id === currentUser.id))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
        <div className="h-28 bg-gradient-to-r from-primary/20 to-primary/5" />
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover shadow-lg border-4 border-white bg-white" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold">{currentUser.name}</h1>
              <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                <Mail size={14} /> {currentUser.email}
              </div>
              {currentUser.bio && (
                <p className="mt-3 text-sm text-text-secondary max-w-2xl leading-relaxed">
                  {currentUser.bio}
                </p>
              )}
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-surface-muted transition-colors flex items-center gap-2"
            >
              <Edit size={14} /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Clubs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">My Clubs</h2>
            <Link to="/clubs" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              Browse <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {myClubs.length > 0 ? (
              myClubs.map(club => (
                <Link
                  key={club.id}
                  to={`/clubs/${club.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-4 border border-border hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: club.color }}>
                    {club.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{club.name}</div>
                    <div className="text-xs text-text-secondary">{club.category} · {club.memberCount} members</div>
                  </div>
                  <ArrowRight size={16} className="text-text-secondary shrink-0" />
                </Link>
              ))
            ) : (
              <EmptyState 
                icon={Users} 
                title="No clubs joined yet" 
                description="Explore clubs to join and participate." 
              />
            )}
          </div>
        </div>

        {/* My Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">My Events</h2>
            <Link to="/events" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              Browse <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {myEvents.length > 0 ? (
              myEvents.map(event => {
                const club = clubs.find(c => c.id === event.clubId)
                return (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center gap-3 bg-white rounded-xl p-4 border border-border hover:shadow-md transition-shadow"
                  >
                    <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white shrink-0" style={{ background: club?.color || '#6c5ce7' }}>
                      <span className="text-[9px] font-medium leading-none">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-sm font-bold leading-none">{new Date(event.date).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs text-text-secondary">{event.time} · {event.location}</div>
                    </div>
                    <ArrowRight size={16} className="text-text-secondary shrink-0" />
                  </Link>
                )
              })
            ) : (
              <EmptyState 
                icon={Calendar} 
                title="No events RSVP'd" 
                description="RSVP to events to see them here." 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
