import { Link } from 'react-router-dom'
import { Calendar, Users, ArrowRight, Clock, MapPin, TrendingUp } from 'lucide-react'
import { clubs, events, announcements, currentUser } from '../data/mock'

export default function Dashboard() {
  const myClubs = clubs.filter(c => currentUser.clubs.includes(c.id))
  const upcomingEvents = events.filter(e => currentUser.joinedEvents.includes(e.id))
  const recentEvents = events.slice(0, 3)

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
          { icon: Calendar, label: 'Upcoming', value: upcomingEvents.length, color: 'bg-green-500/10 text-green-600' },
          { icon: TrendingUp, label: 'This Month', value: events.length, color: 'bg-orange-500/10 text-orange-600' },
          { icon: Clock, label: 'Attended', value: '12', color: 'bg-blue-500/10 text-blue-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-border">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-text-secondary">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Clubs */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">My Clubs</h2>
            <Link to="/clubs" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {myClubs.map(club => (
              <Link
                key={club.id}
                to={`/clubs/${club.id}`}
                className="flex items-center gap-3 bg-white rounded-xl p-4 border border-border hover:shadow-md transition-shadow"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: club.color }}
                >
                  {club.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{club.name}</div>
                  <div className="text-xs text-text-secondary">{club.memberCount} members · {club.category}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Announcements */}
          <h2 className="font-semibold text-lg mt-8 mb-4">Announcements</h2>
          <div className="space-y-3">
            {announcements.map(a => {
              const club = clubs.find(c => c.id === a.clubId)
              return (
                <div key={a.id} className="bg-white rounded-xl p-4 border border-border">
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

        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Upcoming Events</h2>
            <Link to="/events" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {recentEvents.map(event => {
              const club = clubs.find(c => c.id === event.clubId)
              const spotsLeft = event.maxAttendees - event.attendees
              return (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div
                    className="h-2"
                    style={{ background: club?.color || '#6c5ce7' }}
                  />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: `${club?.color}15`, color: club?.color }}
                      >
                        {club?.name}
                      </span>
                      <span className="text-xs text-text-secondary">{event.category}</span>
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {event.time.split(' - ')[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        {event.location}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-text-secondary">
                        {spotsLeft <= 5 ? (
                          <span className="text-orange-500 font-medium">Only {spotsLeft} spots left!</span>
                        ) : (
                          <span>{event.attendees} attending</span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-primary">RSVP →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
