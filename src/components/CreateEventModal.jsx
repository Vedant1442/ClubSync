import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
export default function CreateEventModal({ isOpen, onClose, preselectedClubId = null }) {
  const { createEvent, clubs, clubMemberships, currentUser } = useClubSync()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    club_id: preselectedClubId || '',
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Social',
    max_attendees: 100
  })

  // Get clubs where user is an officer
  const officerClubs = clubs.filter(club => {
    const membership = clubMemberships.find(m => m.club_id === club.id && m.user_id === currentUser?.id)
    return membership && ['President', 'Vice President', 'Secretary', 'Treasurer'].includes(membership.role)
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.club_id) {
      toast.error("Please select a club")
      return
    }

    try {
      setLoading(true)
      await createEvent(formData)
      toast.success("Event created successfully!")
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-[#131315] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-border"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Create New Event</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-muted rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text-secondary">Host Club</label>
            <select
              required
              value={formData.club_id}
              onChange={e => setFormData({...formData, club_id: e.target.value})}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
            >
              <option value="">Select a club you manage...</option>
              {officerClubs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text-secondary">Event Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
              placeholder="e.g. Fall Hackathon"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text-secondary">Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all resize-none"
              placeholder="What is this event about?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-text-secondary">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-text-secondary">Time</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-text-secondary">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                placeholder="e.g. Student Union"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-text-secondary">Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={formData.max_attendees}
                onChange={e => setFormData({...formData, max_attendees: Number(e.target.value)})}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text-secondary">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
            >
              <option>Social</option>
              <option>Academic</option>
              <option>Professional</option>
              <option>Meeting</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
