import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, Plus, X, Loader2 } from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'

const getClubColor = (name = '') => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const CATEGORIES = ['Technology', 'Arts', 'Academic', 'Social', 'Sports', 'Cultural', 'Other']

import { SkeletonPage } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { motion } from 'framer-motion'
const MotionLink = motion(Link)

export default function Clubs() {
  const { clubs, loading, createClub } = useClubSync()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Most Members')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newClub, setNewClub] = useState({ name: '', description: '', category: 'Technology' })

  if (loading) {
    return <SkeletonPage />
  }

  const categories = ['All', ...new Set(clubs.map(c => c.category).filter(Boolean))]

  const filtered = clubs.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === 'All' || c.category === activeCategory
    return matchSearch && matchCategory
  }).sort((a, b) => {
    if (sortBy === 'Most Members') return (b.members_count || 0) - (a.members_count || 0)
    if (sortBy === 'Newest') return new Date(b.created_at) - new Date(a.created_at)
    if (sortBy === 'Oldest') return new Date(a.created_at) - new Date(b.created_at)
    if (sortBy === 'A-Z') return a.name.localeCompare(b.name)
    return 0
  })

  const handleCreateClub = async (e) => {
    e.preventDefault()
    if (!newClub.name.trim()) return
    setCreating(true)
    await createClub(newClub.name.trim(), newClub.description.trim(), newClub.category)
    setCreating(false)
    setShowCreate(false)
    setNewClub({ name: '', description: '', category: 'Technology' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clubs</h1>
          <p className="text-text-secondary mt-1">Discover and join campus clubs</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Create Club
        </button>
      </div>

      {/* Create Club Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create New Club</h2>
              <button onClick={() => setShowCreate(false)} className="text-text-secondary hover:text-text">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Club Name *</label>
                <input
                  type="text"
                  value={newClub.name}
                  onChange={e => setNewClub(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Photography Society"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-dim focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newClub.description}
                  onChange={e => setNewClub(p => ({ ...p, description: e.target.value }))}
                  placeholder="What is this club about?"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-dim focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newClub.category}
                  onChange={e => setNewClub(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-dim focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                >
                  {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {creating && <Loader2 size={16} className="animate-spin" />}
                {creating ? 'Creating...' : 'Create Club'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search clubs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm min-w-[140px]"
        >
          <option value="Most Members">Most Members</option>
          <option value="Newest">Newest</option>
          <option value="Oldest">Oldest</option>
          <option value="A-Z">A-Z</option>
        </select>
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
        {filtered.map(club => {
          const color = getClubColor(club.name)
          return (
            <MotionLink
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={club.id}
              to={`/clubs/${club.id}`}
              className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden transition-all hover:border-primary/50 group"
            >
              <div className="h-24 relative" style={{ background: `${color}12` }}>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: color }} />
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl absolute -bottom-5 left-5 shadow-lg"
                  style={{ background: color }}
                >
                  {club.name.charAt(0)}
                </div>
              </div>
              <div className="p-5 pt-8">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors text-sm">{club.name}</h3>
                </div>
                <span className="text-[10px] font-medium text-text-secondary bg-surface-muted px-2 py-0.5 rounded-full">
                  {club.category}
                </span>
                <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">{club.description}</p>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {club.members_count || 0} members
                  </span>
                </div>
              </div>
            </MotionLink>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState 
          icon={Search} 
          title="No clubs found" 
          description="Try a different search or create a new club!" 
        />
      )}
    </div>
  )
}
