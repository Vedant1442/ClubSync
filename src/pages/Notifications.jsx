import React from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { SkeletonPage } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

export default function Notifications() {
  const { notifications, markNotificationRead, loading } = useClubSync()

  const markAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id)
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return <SkeletonPage />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-text-secondary mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <button
            key={n.id}
            onClick={() => !n.read && markNotificationRead(n.id)}
            className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-colors ${
              n.read
                ? 'bg-white border-border hover:bg-surface-dim'
                : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              n.read ? 'bg-surface-muted text-text-secondary' : 'bg-primary/10 text-primary'
            }`}>
              <Bell size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{n.title}</h3>
                {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              </div>
              <p className="text-sm text-text-secondary mt-0.5">{n.message}</p>
              <span className="text-xs text-text-secondary mt-1 block">{n.time}</span>
            </div>
          </button>
        ))}
      </div>

      {notifications.length === 0 && (
        <EmptyState 
          icon={Bell} 
          title="No notifications" 
          description="You're all caught up! Check back later." 
        />
      )}
    </div>
  )
}
