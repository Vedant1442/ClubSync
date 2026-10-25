import React, { useState, useEffect } from 'react'
import { Bell, Moon, Globe, Shield, LogOut, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useClubSync } from '../context/ClubSyncContext'
import { toast } from 'sonner'

function Toggle({ enabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
        enabled ? 'bg-primary' : 'bg-surface-muted border border-border'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

const sections = [
  {
    title: 'Notifications',
    icon: Bell,
    settings: [
      { key: 'eventReminder', label: 'Event reminders', desc: 'Get notified before events you RSVP\'d to', default: true },
      { key: 'clubUpdates', label: 'Club announcements', desc: 'Updates from clubs you\'re a member of', default: true },
      { key: 'newEvents', label: 'New events', desc: 'When clubs you follow add events', default: false },
    ],
  },
  {
    title: 'Appearance',
    icon: Moon,
    settings: [
      { key: 'darkMode', label: 'Dark mode', desc: 'Switch between light and dark theme', default: true, isDark: true },
    ],
  },
  {
    title: 'Language & Region',
    icon: Globe,
    settings: [
      { key: 'language', label: 'Language', desc: 'English (India)', default: true, isLink: true },
    ],
  },
  {
    title: 'Privacy & Security',
    icon: Shield,
    settings: [
      { key: 'profileVisible', label: 'Profile visibility', desc: 'Visible to other collegiate students', default: true },
      { key: 'showEmail', label: 'Show email', desc: 'Display email on student profile', default: false },
    ],
  },
]

export default function Settings() {
  const { dark, toggleDark } = useTheme()
  const { logout } = useClubSync()
  const navigate = useNavigate()

  const [toggles, setToggles] = useState(() => {
    try {
      const saved = localStorage.getItem('clubsync_settings')
      if (saved) return JSON.parse(saved)
    } catch (e) {}

    const initial = {}
    sections.forEach(s => s.settings.forEach(si => { initial[si.key] = si.default }))
    return initial
  })

  useEffect(() => {
    try {
      localStorage.setItem('clubsync_settings', JSON.stringify(toggles))
    } catch (e) {}
  }, [toggles])

  const toggle = (key, isDark) => {
    if (isDark) {
      toggleDark()
      toast.success(dark ? 'Switched to Light mode' : 'Switched to Dark mode')
    } else {
      setToggles(prev => {
        const nextVal = !prev[key]
        toast.success('Preference updated')
        return { ...prev, [key]: nextVal }
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
      navigate('/login')
    } catch (e) {
      navigate('/login')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-xs text-text-secondary mt-1">Manage collegiate preferences, appearance, and notifications</p>
      </div>

      <div className="space-y-5">
        {sections.map(({ title, icon: Icon, settings }) => (
          <div key={title} className="bg-surface rounded-xl border border-border overflow-hidden shadow-xs">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-surface-dim">
              <Icon size={16} className="text-primary" />
              <h2 className="font-semibold text-xs uppercase tracking-wider text-text">{title}</h2>
            </div>
            <div className="divide-y divide-border">
              {settings.map(s => (
                <div key={s.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-muted/40 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-text">{s.label}</div>
                    <div className="text-xs text-text-secondary mt-0.5">{s.desc}</div>
                  </div>
                  {s.isLink ? (
                    <button 
                      type="button"
                      onClick={() => toast.info('Default language: English (India)')}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      {s.desc}
                    </button>
                  ) : (
                    <Toggle
                      label={s.label}
                      enabled={s.isDark ? dark : toggles[s.key]}
                      onChange={() => toggle(s.key, s.isDark)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold text-xs bg-rose-500/5 hover:bg-rose-500/10 transition-colors cursor-pointer"
      >
        <LogOut size={15} /> Sign Out of Account
      </button>
    </div>
  )
}
