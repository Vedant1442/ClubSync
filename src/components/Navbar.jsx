import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, User, Settings, Bell, LogOut } from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clubs', icon: Users, label: 'Clubs' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { notifications, logout } = useClubSync()
  const unreadCount = notifications.filter(n => !n.read).length

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm">C</div>
          ClubSync
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-surface-muted transition-colors text-text-secondary">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>
          <Link to="/settings" className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-text-secondary">
            <Settings size={20} />
          </Link>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-text-secondary" title="Sign out">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-border">
        <div className="flex justify-around py-2">
          {links.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
                  active ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
