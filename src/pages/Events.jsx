import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, Clock, MapPin } from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'

import CreateEventModal from '../components/CreateEventModal'

import { SkeletonPage } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { motion } from 'framer-motion'
const MotionLink = motion(Link)

export default function Events() {
  const { events, clubs, eventMembers, currentUser, loading, clubMemberships } = useClubSync()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Date (Soonest)')
  const [timeFilter, setTimeFilter] = useState('Upcoming')
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (loading) {
    return <SkeletonPage />
  }

  // Check if user is officer in any club
  const isOfficer = clubMemberships.some(m => m.user_id === currentUser?.id && ['President', 'Vice President', 'Secretary', 'Treasurer'].includes(m.role))

  const categories = ['All', ...new Set(events.map(e => e.category).filter(Boolean))]

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === 'All' || e.category === activeCategory
    
    // Time filter logic
    const eventDate = new Date(e.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let matchTime = true
    if (timeFilter === 'Upcoming') matchTime = eventDate >= today
    if (timeFilter === 'Past') matchTime = eventDate < today

    return matchSearch && matchCategory && matchTime
  }).sort((a, b) => {
    if (sortBy === 'Date (Soonest)') return new Date(a.date) - new Date(b.date)
    if (sortBy === 'Date (Latest)') return new Date(b.date) - new Date(a.date)
    if (sortBy === 'A-Z') return a.title.localeCompare(b.title)
    return 0
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-text-secondary mt-1">Browse upcoming campus events</p>
        </div>
        {isOfficer && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            + Create Event
          </button>
        )}
      </div>

      <CreateEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm w-full sm:w-auto"
          >
            <option value="All Time">All Time</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Past">Past</option>
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm w-full sm:w-auto"
          >
            <option value="Date (Soonest)">Date (Soonest)</option>
            <option value="Date (Latest)">Date (Latest)</option>
            <option value="A-Z">A-Z</option>
          </select>
        </div>
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

      <div className="space-y-4">
        {filtered.map(event => {
          const club = clubs.find(c => c.id === event.club_id)
          const attendeesCount = eventMembers.filter(em => em.event_id === event.id).length
          const spotsLeft = event.max_attendees - attendeesCount
          const fillPercent = (attendeesCount / event.max_attendees) * 100
          const isRSVPed = eventMembers.some(em => em.event_id === event.id && em.user_id === currentUser.id)

          return (
            <MotionLink
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              key={event.id}
              to={`/events/${event.id}`}
              className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-surface rounded-2xl border border-border p-5 transition-all hover:border-primary/50 group"
            >
              {/* Date Badge */}
              <div
                className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
                style={{ background: club?.color || '#6c5ce7' }}
              >
                <span className="text-[10px] font-medium uppercase text-white/80">
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
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${club?.color}15`, color: club?.color }}
                  >
                    {club?.name}
                  </span>
                  <span className="text-[10px] text-text-secondary">{event.category}</span>
                  {isRSVPed && (
                    <span className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">Going</span>
                  )}
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors text-sm">{event.title}</h3>
                <p className="text-xs text-text-secondary mt-1 line-clamp-1">{event.description}</p>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-text-secondary">
                  <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                </div>
              </div>

              {/* Spots */}
              <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end gap-2 justify-center">
                <div className={`text-xs font-semibold ${spotsLeft <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                  {spotsLeft <= 5 ? `${spotsLeft} spots left` : `${attendeesCount} attending`}
                </div>
                <div className="w-24 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${fillPercent}%`, background: club?.color || '#6c5ce7' }}
                  />
                </div>
              </div>
            </MotionLink>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState 
          icon={Search} 
          title="No events found" 
          description="Try a different search or category." 
        />
      )}
    </div>
  )
}
