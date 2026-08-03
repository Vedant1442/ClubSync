import { Link } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary mb-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white text-sm">C</div>
            ClubSync
          </Link>
          <p className="text-text-secondary">Create your account</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); window.location.href = '/dashboard' }} className="bg-white rounded-2xl p-8 border border-border shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Alex Johnson"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-dim focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  placeholder="you@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-dim focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-dim focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            Create Account
          </button>
          <p className="text-center text-sm text-text-secondary mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
