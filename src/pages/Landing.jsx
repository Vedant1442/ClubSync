import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowRight, ShieldCheck, Sun, Moon, Zap, 
  Shield, UserCheck, QrCode, FileText, CheckCircle2, ChevronRight
} from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { useTheme } from '../context/ThemeContext'
import { toast } from 'sonner'

export default function Landing() {
  const navigate = useNavigate()
  const { login, currentUser } = useClubSync()
  const { dark, toggleDark } = useTheme()
  const [loggingInRole, setLoggingInRole] = useState(null)

  const handleQuickLogin = async (role, email, password) => {
    try {
      setLoggingInRole(role)
      toast.loading(`Signing in as ${role}...`, { id: 'auth' })
      await login(email, password)
      toast.success(`Welcome, ${role}!`, { id: 'auth' })
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed', { id: 'auth' })
    } finally {
      setLoggingInRole(null)
    }
  }

  return (
    <div className="min-h-screen bg-surface-dim text-text flex flex-col justify-between transition-colors duration-150">
      
      {/* Minimal Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">
              CS
            </div>
            <span className="font-bold text-sm tracking-tight text-text">
              ClubSync
            </span>
            <span className="text-[11px] text-text-secondary border-l border-border pl-2 font-mono">
              PICT Pune
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg border border-border hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
            >
              {dark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
            </button>

            {currentUser ? (
              <Link
                to="/dashboard"
                className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Dashboard →
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-surface hover:bg-surface-muted border border-border text-text px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero & Quick Access */}
      <main className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center my-auto w-full">
        
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-text-secondary text-xs mb-6 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Collegiate Operations Platform</span>
        </div>

        {/* Crisp Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text mb-4">
          All-in-one operations for campus societies.
        </h1>

        <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
          Replaces scattered Google Forms and spreadsheets with continuous gate check-in kiosks, zero-fee UPI payments, and digital by-law voting.
        </p>

        {/* 1-Click Evaluator Access Box */}
        <div className="border border-border rounded-xl bg-surface p-5 sm:p-6 text-left shadow-xs mb-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <span className="text-xs font-bold text-text">Quick Demo Accounts</span>
              <p className="text-[11px] text-text-secondary mt-0.5">Click any role to test with seeded data</p>
            </div>
            <span className="text-[11px] font-mono text-text-secondary bg-surface-dim px-2 py-1 rounded border border-border">
              Pass: Password123!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loggingInRole !== null}
              onClick={() => handleQuickLogin('Officer', 'officer@clubsync.app', 'Password123!')}
              className="p-3.5 rounded-lg border border-border bg-surface-dim hover:bg-surface-muted hover:border-primary/40 text-left transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                    Aditya Deshmukh (Officer)
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    Robocon President • Kiosk &amp; CRM
                  </div>
                </div>
              </div>
              <ChevronRight size={15} className="text-text-secondary group-hover:text-primary transition-colors" />
            </button>

            <button
              type="button"
              disabled={loggingInRole !== null}
              onClick={() => handleQuickLogin('Member', 'member@clubsync.app', 'Password123!')}
              className="p-3.5 rounded-lg border border-border bg-surface-dim hover:bg-surface-muted hover:border-primary/40 text-left transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-muted text-text-secondary flex items-center justify-center shrink-0">
                  <UserCheck size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                    Kavya Kulkarni (Member)
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    Third Year IT • Tickets &amp; OD Letters
                  </div>
                </div>
              </div>
              <ChevronRight size={15} className="text-text-secondary group-hover:text-primary transition-colors" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-text-secondary">
            <span>Need to verify a certificate?</span>
            <Link to="/verify/PICT-CERT-2026-X89" className="text-primary hover:underline font-semibold flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" /> Verify PICT-CERT-2026-X89 →
            </Link>
          </div>
        </div>

        {/* 4 Clean Feature Bullets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
          <div className="p-3 rounded-lg border border-border bg-surface text-xs">
            <div className="font-semibold text-text mb-0.5">Desk Kiosk</div>
            <div className="text-[11px] text-text-secondary">80mm thermal badges &amp; scanner</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-surface text-xs">
            <div className="font-semibold text-text mb-0.5">YouPI Treasury</div>
            <div className="text-[11px] text-text-secondary">Zero-fee UPI intent &amp; UTR logs</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-surface text-xs">
            <div className="font-semibold text-text mb-0.5">Sponsorship CRM</div>
            <div className="text-[11px] text-text-secondary">Kanban pipeline &amp; audit export</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-surface text-xs">
            <div className="font-semibold text-text mb-0.5">By-Law Referendum</div>
            <div className="text-[11px] text-text-secondary">66.6% supermajority voting</div>
          </div>
        </div>

      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-border bg-surface py-5 text-xs text-text-secondary">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ClubSync • Pune Institute of Computer Technology
          </div>
          <div className="flex items-center gap-3">
            <Link to="/events" className="hover:text-text transition-colors">Events</Link>
            <Link to="/clubs" className="hover:text-text transition-colors">Clubs</Link>
            <Link to="/verify/PICT-CERT-2026-X89" className="hover:text-text transition-colors">Verify Registry</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
