import { Link } from 'react-router-dom'
import { ArrowRight, Users, Calendar, Bell, Zap } from 'lucide-react'

const features = [
  { icon: Users, title: 'Club Directory', desc: 'Browse and join campus clubs that match your interests.' },
  { icon: Calendar, title: 'Event Calendar', desc: 'Never miss an event. RSVP and get reminders.' },
  { icon: Bell, title: 'Real-time Alerts', desc: 'Stay updated with instant notifications.' },
  { icon: Zap, title: 'Member Matching', desc: 'Find clubs based on your interests and availability.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap size={14} />
              Campus Club Management
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Your campus life,
              <span className="text-primary"> synced.</span>
            </h1>
            <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
              Discover clubs, attend events, and connect with fellow students — all in one place.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/register"
                className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                Get Started <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl font-semibold border border-border hover:bg-surface-muted transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
          <p className="text-text-secondary">Simple tools for a vibrant campus community.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '50+', label: 'Active Clubs' },
            { value: '2,400+', label: 'Members' },
            { value: '120+', label: 'Events / Semester' },
            { value: '98%', label: 'Satisfaction' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-primary">{value}</div>
              <div className="text-sm text-text-secondary mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Ready to join?</h2>
          <p className="text-white/80 mb-6 max-w-md mx-auto">Start exploring clubs and events on your campus today.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
          >
            Create Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
          <div className="font-semibold text-text">ClubSync</div>
          <div>© 2026 ClubSync. Built for campus communities.</div>
        </div>
      </footer>
    </div>
  )
}
