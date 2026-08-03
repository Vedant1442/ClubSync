import { Link } from 'react-router-dom'
import { Search, Users, Clock, MapPin } from 'lucide-react'
import { useState } from 'react'
import { clubs } from '../data/mock'

const categories = ['All', ...new Set(clubs.map(c => c.category))]

export default function Clubs() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = clubs.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === 'All' || c.category === activeCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Clubs</h1>
        <p className="text-text-secondary mt-1">Discover and join campus clubs</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder="Search clubs..."
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

      {/* Club Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(club => (
          <Link
            key={club.id}
            to={`/clubs/${club.id}`}
            className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group"
          >
            <div className="h-24 relative" style={{ background: `${club.color}12` }}>
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{ background: club.color }}
              />
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl absolute -bottom-5 left-5 shadow-lg"
                style={{ background: club.color }}
              >
                {club.name.charAt(0)}
              </div>
            </div>
            <div className="p-5 pt-8">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">{club.name}</h3>
              </div>
              <span className="text-xs font-medium text-text-secondary bg-surface-muted px-2 py-0.5 rounded-full">
                {club.category}
              </span>
              <p className="text-sm text-text-secondary mt-2 line-clamp-2 leading-relaxed">{club.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <Users size={13} />
                  {club.memberCount} members
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {club.meetingSchedule.split(' ')[0]}s
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          <p className="font-medium">No clubs found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      )}
    </div>
  )
}
