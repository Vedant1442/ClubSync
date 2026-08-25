import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, Share2 } from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { SkeletonPage } from '../components/Skeleton'

export default function EventDetail() {
  const { id } = useParams()
  const eventId = Number(id)
  
  const { events, clubs, eventMembers, currentUser, toggleRSVP, isUserRSVPed, loading } = useClubSync()

  if (loading) {
    return <SkeletonPage />
  }

  const event = events.find(e => e.id === eventId)

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">Event not found.</p>
        <Link to="/events" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">← Back to events</Link>
      </div>
    )
  }

  const club = clubs.find(c => c.id === event.club_id)
  const isRSVPed = eventMembers.some(em => em.event_id === event.id && em.user_id === currentUser.id)
  const attendeesCount = eventMembers.filter(em => em.event_id === event.id).length
  const spotsLeft = event.max_attendees - attendeesCount
  const fillPercent = (attendeesCount / event.max_attendees) * 100

  const handleRsvpToggle = async () => {
    try {
      await toggleRSVP(event.id)
    } catch (e) {
      toast.error("Failed to RSVP")
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Link to="/events" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-6">
        <ArrowLeft size={16} /> Back to events
      </Link>

      <div className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden mb-6">
        <div className="h-32 md:h-44 relative" style={{ background: `${club?.color || '#6c5ce7'}18` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/90 backdrop-blur text-text-secondary">{event.category}</span>
          </div>
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={`/clubs/${club?.id}`}
              className="text-xs font-medium px-2 py-0.5 rounded-full hover:opacity-80"
              style={{ background: `${club?.color}15`, color: club?.color }}
            >
              {club?.name}
            </Link>
          </div>
          <h1 className="text-2xl font-bold mb-4">{event.title}</h1>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-surface-dim rounded-xl">
              <Calendar size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-text-secondary">Date</div>
                <div className="text-sm font-medium">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-dim rounded-xl">
              <Clock size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-text-secondary">Time</div>
                <div className="text-sm font-medium">{event.time}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-dim rounded-xl">
              <MapPin size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-text-secondary">Location</div>
                <div className="text-sm font-medium">{event.location}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-dim rounded-xl">
              <Users size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-text-secondary">Capacity</div>
                <div className="text-sm font-medium">{attendeesCount}/{event.max_attendees}</div>
              </div>
            </div>
          </div>

          <p className="text-text-secondary leading-relaxed mb-6">{event.description}</p>

          {/* Capacity bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-secondary">{attendeesCount} attending</span>
              <span className={spotsLeft <= 5 ? 'text-orange-500 font-medium' : 'text-green-600'}>
                {spotsLeft} spots left
              </span>
            </div>
            <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${fillPercent}%`, background: club?.color || '#6c5ce7' }} />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRsvpToggle}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
                isRSVPed
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {isRSVPed ? <><CheckCircle size={18} /> RSVP'd</> : 'RSVP Now'}
            </button>
            <button className="px-4 py-3 rounded-xl font-medium text-sm border border-border hover:bg-surface-muted transition-colors flex items-center gap-2">
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
