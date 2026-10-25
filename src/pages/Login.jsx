import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClubSync } from '../context/ClubSyncContext'
import { useTheme } from '../context/ThemeContext'
import { Eye, EyeOff, Moon, Sun, ArrowRight, ShieldCheck } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { login } = useClubSync()
  const { dark, toggleDark } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-dim p-4 text-text font-sans relative transition-colors duration-200">
      {/* Top Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={toggleDark}
          className="p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-muted text-text-secondary hover:text-text transition-colors shadow-xs"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
        </button>
      </div>

      <div className="w-full max-w-[420px] bg-surface border border-border rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              CS
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-text">
              Club<span className="text-primary">Sync</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-text">Sign in to ClubSync</h2>
          <p className="text-text-secondary text-sm mt-1">Collegiate Society Operations for PICT Pune</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl mb-6 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-text">Email address</label>
            <input 
              type="email" 
              required 
              placeholder="officer@clubsync.app"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-surface-dim border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-secondary/50" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-text">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="Enter password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-surface-dim border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-secondary/50" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm mt-2 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Continue to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-6 p-4 rounded-2xl bg-surface-dim border border-border text-center">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2.5">
            Quick 1-Click Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('officer@clubsync.app');
                setPassword('Password123!');
              }}
              className="px-3 py-2.5 text-xs font-bold rounded-xl bg-surface hover:bg-surface-muted text-text transition-colors border border-border shadow-xs hover:border-amber-500/40"
            >
              👑 Officer Account
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('member@clubsync.app');
                setPassword('Password123!');
              }}
              className="px-3 py-2.5 text-xs font-bold rounded-xl bg-surface hover:bg-surface-muted text-text transition-colors border border-border shadow-xs hover:border-primary/40"
            >
              🎓 Member Account
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-secondary">
          No account? <Link to="/register" className="text-primary hover:underline font-bold">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
