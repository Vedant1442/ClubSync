import { Link } from 'react-router-dom'
import { Search, Calendar, Clock, MapPin, Filter } from 'lucide-react'
import { useState } from 'react'
import { events, clubs } from '../data/mock'

const categories = ['All', ...new Set(events.map(e => e.category))]

export default function Events() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === 'All' || e.category === activeCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-text-secondary mt-1">Browse upcoming campus events</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-text-secondary hover:bg-surface-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filtered.map(event => {
          const club = clubs.find(c => c.id === event.clubId)
          const spotsLeft = event.maxAttendees - event.attendees
          const fillPercent = (event.attendees / event.maxAttendees) * 100

          return (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow group"
            >
              {/* Date Badge */}
              <div
                className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
                style={{ background: club?.color || '#6c5ce7' }}
              >
                <span className="text-[10px] font-medium uppercase">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-xl font-bold leading-none">
                  {new Date(event.date).getDate()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${club?.color}15`, color: club?.color }}
                  >
                    {club?.name}
                  </span>
                  <span className="text-xs text-text-secondary">{event.category}</span>
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{event.title}</h3>
                <p className="text-sm text-text-secondary mt-1 line-clamp-1">{event.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                  <span className="flex items-center gap-1"><Clock size={13} /> {event.time}</span>
                  <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>
                </div>
              </div>

              {/* Spots */}
              <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
                <div className={`text-sm font-semibold ${spotsLeft <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                  {spotsLeft <= 5 ? `${spotsLeft} spots left` : `${event.attendees} attending`}
                </div>
                <div className="w-24 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${fillPercent}%`, background: club?.color || '#6c5ce7' }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          <p className="font-medium">No events found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      )}
    </div>
  )
}
