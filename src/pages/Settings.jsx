import { Bell, Moon, Globe, Shield, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-surface-muted border border-border'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
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
      { key: 'darkMode', label: 'Dark mode', desc: 'Switch between light and dark theme', default: false, isDark: true },
    ],
  },
  {
    title: 'Language & Region',
    icon: Globe,
    settings: [
      { key: 'language', label: 'Language', desc: 'English', default: true, isLink: true },
    ],
  },
  {
    title: 'Privacy & Security',
    icon: Shield,
    settings: [
      { key: 'profileVisible', label: 'Profile visibility', desc: 'Visible to other students', default: true },
      { key: 'showEmail', label: 'Show email', desc: 'Display email on profile', default: false },
    ],
  },
]

export default function Settings() {
  const { dark, toggleDark } = useTheme()
  const [toggles, setToggles] = useState(() => {
    const initial = {}
    sections.forEach(s => s.settings.forEach(si => { initial[si.key] = si.default }))
    return initial
  })

  const toggle = (key, isDark) => {
    if (isDark) {
      toggleDark()
    } else {
      setToggles(prev => ({ ...prev, [key]: !prev[key] }))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {sections.map(({ title, icon: Icon, settings }) => (
          <div key={title} className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Icon size={18} className="text-primary" />
              <h2 className="font-semibold text-sm">{title}</h2>
            </div>
            <div className="divide-y divide-border">
              {settings.map(s => (
                <div key={s.key} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-text-secondary mt-0.5">{s.desc}</div>
                  </div>
                  {s.isLink ? (
                    <button className="text-sm text-primary font-medium hover:underline">{s.desc}</button>
                  ) : (
                    <Toggle
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

      <Link
        to="/"
        className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors"
      >
        <LogOut size={16} /> Sign Out
      </Link>
    </div>
  )
}
