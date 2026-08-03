import { Bell, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { notifications } from '../data/mock'

export default function Notifications() {
  const [items, setItems] = useState(notifications)

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })))
  const toggleRead = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n))
  const unreadCount = items.filter(n => !n.read).length

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
        {items.map(n => (
          <button
            key={n.id}
            onClick={() => toggleRead(n.id)}
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

      {items.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          <Bell size={40} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium">No notifications</p>
        </div>
      )}
    </div>
  )
}
