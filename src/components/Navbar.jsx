import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Calendar, User, Settings, Bell, 
  LogOut, Moon, Sun, ShieldCheck, Sparkles 
} from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { useTheme } from '../context/ThemeContext'

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clubs', icon: Users, label: 'Clubs' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { notifications, logout, currentUser } = useClubSync()
  const themeContext = useTheme()

  // Gracefully fallback if useTheme is undefined
  const isDark = themeContext ? themeContext.dark : document.documentElement.classList.contains('dark')
  const toggleDark = themeContext ? themeContext.toggleDark : () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark')
    if (isCurrentlyDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('clubsync-dark', 'false')
      localStorage.theme = 'light'
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('clubsync-dark', 'true')
      localStorage.theme = 'dark'
    }
  }

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  // Derive role badge
  const isOfficer = currentUser?.role === 'officer' || 
    currentUser?.email?.includes('officer') || 
    currentUser?.bio?.toLowerCase().includes('president') ||
    currentUser?.bio?.toLowerCase().includes('lead')

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 dark:bg-[#12121f]/90 backdrop-blur-xl border-b border-border/80 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Mark */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
                CS
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-text leading-tight group-hover:text-primary transition-colors">
                  Club<span className="text-primary">Sync</span>
                </span>
                <span className="text-[10px] font-semibold text-text-secondary tracking-widest uppercase">
                  PICT Pune
                </span>
              </div>
            </Link>

            {/* Campus Grid Live Pill */}
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Campus Grid Active</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-surface-muted/60 dark:bg-surface/50 p-1 rounded-2xl border border-border/50">
            {navLinks.map(({ to, icon: Icon, label }) => {
              const active = location.pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-primary text-white shadow-sm shadow-primary/30'
                      : 'text-text-secondary hover:text-text hover:bg-white/60 dark:hover:bg-surface-muted'
                  }`}
                >
                  <Icon size={16} className={active ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick Public Verification link */}
            <Link
              to="/verify/PICT-CERT-2026-X89"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20 hover:bg-primary/15 transition-colors border border-primary/20"
              title="Verify Official PICT Certificate"
            >
              <ShieldCheck size={14} className="text-primary" />
              <span>Verify Registry</span>
            </Link>

            {/* Dark Mode Switcher */}
            <button 
              onClick={toggleDark} 
              aria-label="Toggle visual theme"
              className="p-2.5 rounded-xl hover:bg-surface-muted active:scale-95 transition-all text-text-secondary hover:text-text border border-transparent hover:border-border" 
              title={isDark ? "Switch to daylight mode" : "Switch to midnight mode"}
            >
              {isDark ? (
                <Sun size={18} className="text-amber-400 animate-in spin-in-90 duration-200" />
              ) : (
                <Moon size={18} className="text-indigo-600 animate-in spin-in-90 duration-200" />
              )}
            </button>

            {/* Notifications */}
            <Link 
              to="/notifications" 
              className="relative p-2.5 rounded-xl hover:bg-surface-muted active:scale-95 transition-all text-text-secondary hover:text-text border border-transparent hover:border-border"
              title="Activity Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-surface animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Settings */}
            <Link 
              to="/settings" 
              className="p-2.5 rounded-xl hover:bg-surface-muted active:scale-95 transition-all text-text-secondary hover:text-text border border-transparent hover:border-border hidden sm:flex"
              title="Society Settings"
            >
              <Settings size={18} />
            </Link>

            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

            {/* User Profile Pill */}
            {currentUser && (
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-surface-muted transition-colors border border-transparent hover:border-border"
                title="View your student profile"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {currentUser.avatar_url ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt="" 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                  ) : (
                    (currentUser.full_name || currentUser.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-text truncate max-w-[110px] leading-tight">
                    {currentUser.full_name || currentUser.name || 'Student'}
                  </span>
                  <span className="text-[10px] text-text-secondary font-medium leading-none">
                    {isOfficer ? '👑 Officer' : '🎓 Member'}
                  </span>
                </div>
              </Link>
            )}

            {/* Sign Out */}
            <button 
              onClick={handleLogout} 
              className="p-2.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 active:scale-95 transition-all text-text-secondary border border-transparent hover:border-rose-500/20" 
              title="Sign out of collegiate session"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#12121f]/95 backdrop-blur-xl border-t border-border shadow-2xl px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors">
        <div className="flex items-center justify-around">
          {navLinks.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 ${
                  active 
                    ? 'text-primary bg-primary/10 dark:bg-primary/20 font-bold scale-105' 
                    : 'text-text-secondary hover:text-text font-medium'
                }`}
              >
                <Icon size={19} className={active ? 'stroke-[2.3]' : 'stroke-[1.8]'} />
                <span className="text-[11px] leading-none tracking-tight">{label}</span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-primary -mt-0.5" />
                )}
              </Link>
            )
          })}

          {/* Quick Notifications in Mobile Bar */}
          <Link
            to="/notifications"
            className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 ${
              location.pathname.startsWith('/notifications')
                ? 'text-primary bg-primary/10 dark:bg-primary/20 font-bold scale-105'
                : 'text-text-secondary hover:text-text font-medium'
            }`}
          >
            <div className="relative">
              <Bell size={19} className={location.pathname.startsWith('/notifications') ? 'stroke-[2.3]' : 'stroke-[1.8]'} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-surface" />
              )}
            </div>
            <span className="text-[11px] leading-none tracking-tight">Alerts</span>
          </Link>
        </div>
      </div>
    </>
  )
}
