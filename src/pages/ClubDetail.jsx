import { useParams, Link } from 'react-router-dom'
import { Users, Clock, MapPin, Calendar, ArrowLeft, UserPlus, Mail } from 'lucide-react'
import { useState } from 'react'
import { clubs, events, currentUser } from '../data/mock'

export default function ClubDetail() {
  const { id } = useParams()
  const club = clubs.find(c => c.id === Number(id))
  const [joined, setJoined] = useState(currentUser.clubs.includes(Number(id)))

  if (!club) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">Club not found.</p>
        <Link to="/clubs" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">← Back to clubs</Link>
      </div>
    )
  }

  const clubEvents = events.filter(e => e.clubId === club.id)
  const members = Array.from({ length: Math.min(club.memberCount, 8) }, (_, i) => ({
    name: `Member ${i + 1}`,
    role: i === 0 ? 'President' : i === 1 ? 'Vice President' : 'Member',
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Link to="/clubs" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-6">
        <ArrowLeft size={16} /> Back to clubs
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
        <div className="h-32 md:h-40 relative" style={{ background: `${club.color}18` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
        <div className="px-6 pb-6 -mt-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white"
              style={{ background: club.color }}
            >
              {club.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{club.name}</h1>
              <span className="text-xs font-medium text-text-secondary bg-surface-muted px-2 py-0.5 rounded-full">
                {club.category}
              </span>
            </div>
            <button
              onClick={() => setJoined(!joined)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
                joined
                  ? 'bg-surface-muted text-text-secondary border border-border'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {joined ? <><UserPlus size={16} /> Joined</> : <><UserPlus size={16} /> Join Club</>}
            </button>
          </div>
          <p className="text-text-secondary mt-4 leading-relaxed">{club.description}</p>

          <div className="grid sm:grid-cols-3 gap-4 mt-5">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Users size={16} className="text-primary" />
              {club.memberCount} members
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock size={16} className="text-primary" />
              {club.meetingSchedule}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <MapPin size={16} className="text-primary" />
              {club.location}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Events */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-lg mb-4">Upcoming Events</h2>
          {clubEvents.length > 0 ? (
            <div className="space-y-3">
              {clubEvents.map(event => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="flex gap-4 bg-white rounded-xl p-4 border border-border hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
                    style={{ background: club.color }}
                  >
                    <span className="text-xs font-medium">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                      <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-1">{event.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary bg-white rounded-xl p-6 border border-border text-center">
              No upcoming events
            </p>
          )}
        </div>

        {/* Members */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Members</h2>
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="space-y-3">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `${club.color}${80 + i * 15}` }}
                  >
                    {m.name.split(' ')[1]?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-text-secondary">{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
            {club.memberCount > 8 && (
              <p className="text-xs text-text-secondary text-center mt-3 pt-3 border-t border-border">
                +{club.memberCount - 8} more members
              </p>
            )}
          </div>

          {/* Contact */}
          <div className="mt-4 bg-white rounded-xl border border-border p-4">
            <h3 className="font-medium text-sm mb-3">Contact</h3>
            <a
              href="mailto:club@university.edu"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Mail size={16} />
              club@university.edu
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
