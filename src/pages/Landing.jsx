import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowRight, Users, Calendar, ShieldCheck, Printer, 
  CreditCard, Kanban, Scale, GraduationCap, Radio, 
  ExternalLink, Moon, Sun, Copy, Check, ChevronRight, 
  Lock, Building2, Zap, ScanBarcode, Shield, UserCheck, FileCheck
} from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { useTheme } from '../context/ThemeContext'
import { toast } from 'sonner'

export default function Landing() {
  const navigate = useNavigate()
  const { login, currentUser } = useClubSync()
  const { dark, toggleDark } = useTheme()
  const [loggingInRole, setLoggingInRole] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const handleQuickLogin = async (role, email, password) => {
    try {
      setLoggingInRole(role)
      toast.loading(`Signing in as ${role}...`, { id: 'quick-login' })
      await login(email, password)
      toast.success(`Authenticated as ${role}`, { id: 'quick-login' })
      navigate('/dashboard')
    } catch (err) {
      console.error('Quick login failed:', err)
      toast.error(err.message || `Failed to sign in as ${role}`, { id: 'quick-login' })
    } finally {
      setLoggingInRole(null)
    }
  }

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`Copied: ${text}`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const features = [
    {
      icon: Printer,
      title: 'Gate Kiosk & 80mm Badge Print',
      tag: 'Hardware Integration',
      metric: '< 120ms Latency',
      desc: 'Sub-second barcode turnstile scanning with anti-passback controls and direct ESC/POS hardware badge roll printing for symposiums.'
    },
    {
      icon: CreditCard,
      title: 'Zero-Fee UPI Treasury Ledger',
      tag: 'FinOps',
      metric: '0% Gateway MDR',
      desc: 'Direct peer UPI deep-link routing, dual-signatory approvals, and 12-digit UTR reconciliation with immutable collegiate ledgers.'
    },
    {
      icon: Kanban,
      title: 'Corporate Sponsorship CRM',
      tag: 'Brand Outreach',
      metric: 'Stage Pipeline',
      desc: '5-stage sponsorship Kanban: Title, Powered-By, and Associate tiers, deliverable checklists, and 1-click Gymkhana audit CSV export.'
    },
    {
      icon: Scale,
      title: 'By-Law Referendum & Quorum',
      tag: 'Governance',
      metric: '66.6% Threshold',
      desc: 'Collegiate constitution revisions with side-by-side Git diffing, live quorum verification, and two-thirds supermajority validation.'
    },
    {
      icon: GraduationCap,
      title: 'Senior-Junior Peer Mentorship',
      tag: 'Academics',
      metric: 'Domain Matching',
      desc: 'Structured senior developer pairings across DSA, Web3, and Robotics, campus room scheduling, and verified star reviews.'
    },
    {
      icon: Radio,
      title: 'Discord & Telegram Syndicate',
      tag: 'Syndication',
      metric: 'Multi-Channel',
      desc: 'Automated webhook relays broadcasting event releases, room changes, and urgent notifications to official club channels.'
    }
  ]

  const pictSocieties = [
    {
      name: 'PICT IEEE Student Branch',
      acronym: 'PISB',
      founded: '1988',
      type: 'Technical',
      fest: 'Credenz',
      desc: 'Pune’s oldest student branch hosting international competitions, project symposiums, and IEEE Xplore paper presentations.',
      members: '320+ Members'
    },
    {
      name: 'PICT ACM Student Chapter',
      acronym: 'PASC',
      founded: '2011',
      type: 'Technical',
      fest: 'Pulzion',
      desc: 'Competitive coding community conducting algorithmic hackathons, mock interviews, and open-source bootcamps.',
      members: '280+ Members'
    },
    {
      name: 'PICT Robocon & Robotics Club',
      acronym: 'Robocon',
      founded: '2008',
      type: 'Technical',
      fest: 'ABU Robocon / TechPulse',
      desc: 'Autonomous mobile robotics and mechatronics team representing PICT in national and international ABU Robocon challenges.',
      members: '110+ Members'
    },
    {
      name: 'PICT Computer Society of India',
      acronym: 'CSI PICT',
      founded: '1992',
      type: 'Technical',
      fest: 'Xenia',
      desc: 'Technical workshop organizer specializing in systems architecture, networking, cyber forensics, and cloud infrastructure.',
      members: '240+ Members'
    },
    {
      name: 'PICT Entrepreneurship Cell',
      acronym: 'PICT EDC',
      founded: '2014',
      type: 'Entrepreneurship',
      fest: 'E-Summit',
      desc: 'Startup incubator fostering student ventures, angel investor pitch sessions, and intellectual property patent filings.',
      members: '160+ Members'
    },
    {
      name: 'PICT Art Circle',
      acronym: 'Art Circle',
      founded: '1995',
      type: 'Cultural',
      fest: 'Firodiya Karandak',
      desc: 'Performing arts troupe competing in state collegiate drama, music, production design, and fine arts festivals.',
      members: '190+ Members'
    }
  ]

  const filteredSocieties = activeTab === 'all' 
    ? pictSocieties 
    : activeTab === 'tech'
      ? pictSocieties.filter(s => s.type === 'Technical')
      : pictSocieties.filter(s => s.type !== 'Technical')

  return (
    <div className="min-h-screen bg-surface-dim text-text transition-colors duration-150">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-xs">
              CS
            </div>
            <span className="font-bold text-base tracking-tight text-text">
              Club<span className="text-primary">Sync</span>
            </span>
            <span className="text-[11px] font-mono text-text-secondary border-l border-border pl-2.5 ml-1 hidden sm:inline-block">
              PICT Pune
            </span>
          </Link>

          {/* Right Action */}
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleDark} 
              aria-label="Toggle theme"
              className="p-2 rounded-lg hover:bg-surface-muted text-text-secondary hover:text-text border border-border transition-colors"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
            </button>

            {currentUser ? (
              <Link
                to="/dashboard"
                className="bg-primary hover:bg-primary-dark text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                Dashboard <ArrowRight size={13} />
              </Link>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-surface-muted transition-colors text-text"
                >
                  Sign In
                </Link>
                <a
                  href="#sandbox"
                  className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Quick Demo
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border py-16 md:py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-4 text-center">
          
          <div className="inline-flex items-center gap-2 bg-surface-muted border border-border text-text-secondary px-3 py-1 rounded-md text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Collegiate Society Operations • PICT Pune (IEEE, ACM, CSI, Robocon)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight mb-4 max-w-3xl mx-auto">
            The Operating System for Engineering Campus Societies.
          </h1>

          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
            Replaces scattered Google Forms, manual spreadsheets, and unverified UPI payments with gate check-in kiosks, corporate sponsorship CRM, and cryptographic by-law referendums.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
            <a
              href="#sandbox"
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Zap size={14} />
              <span>Launch Evaluator Sandbox</span>
            </a>
            <Link
              to="/verify/PICT-CERT-2026-X89"
              className="px-4 py-2.5 rounded-lg text-xs font-medium border border-border bg-surface hover:bg-surface-muted transition-colors text-text flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Verify Public Credential</span>
            </Link>
          </div>

          {/* Technical Specs Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto p-4 rounded-xl bg-surface-dim border border-border text-left">
            <div>
              <div className="text-xs font-mono font-bold text-text">PostgreSQL 16</div>
              <div className="text-[11px] text-text-secondary">Neon Serverless DB</div>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-text">100% Param SQL</div>
              <div className="text-[11px] text-text-secondary">Zero Raw Injection</div>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-text">&lt; 400ms</div>
              <div className="text-[11px] text-text-secondary">Turnstile Ingress</div>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-text">80mm ESC/POS</div>
              <div className="text-[11px] text-text-secondary">Direct Thermal Badge</div>
            </div>
          </div>

        </div>
      </section>

      {/* Evaluator Quick Sandbox */}
      <section id="sandbox" className="scroll-mt-16 max-w-5xl mx-auto px-4 py-12">
        <div className="border border-border rounded-2xl bg-surface p-6 sm:p-8 shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                Jury &amp; Evaluator Sandbox
              </div>
              <h2 className="text-xl font-bold text-text">
                1-Click Direct Authentication
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Click any role card below to authenticate immediately with preloaded PICT society data.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs bg-surface-dim p-2 rounded-lg border border-border font-mono text-text-secondary self-start sm:self-auto">
              <span>Password:</span>
              <code className="text-text font-bold">Password123!</code>
              <button
                onClick={() => handleCopy('Password123!', 'pwd')}
                className="hover:text-text transition-colors ml-1 p-0.5"
                title="Copy password"
              >
                {copiedKey === 'pwd' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            
            {/* Officer */}
            <div className="border border-border rounded-xl p-5 bg-surface-dim hover:border-border/80 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Shield size={18} />
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    Officer Role
                  </span>
                </div>
                <h3 className="font-bold text-sm text-text">Aditya Deshmukh</h3>
                <div className="text-xs text-text-secondary mt-0.5">President @ Robocon &amp; PASC Officer</div>
                <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                  Controls Desk Kiosk mode, 80mm thermal badge printer, sponsorship CRM, and Dean OD letters.
                </p>
              </div>

              <button
                type="button"
                disabled={loggingInRole !== null}
                onClick={() => handleQuickLogin('Club Officer', 'officer@clubsync.app', 'Password123!')}
                className="mt-5 w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {loggingInRole === 'Club Officer' ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate as Officer</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>

            {/* Member */}
            <div className="border border-border rounded-xl p-5 bg-surface-dim hover:border-border/80 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-muted text-text-secondary flex items-center justify-center">
                    <UserCheck size={18} />
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-surface-muted text-text-secondary">
                    Member Role
                  </span>
                </div>
                <h3 className="font-bold text-sm text-text">Kavya Kulkarni</h3>
                <div className="text-xs text-text-secondary mt-0.5">Student Member (Third Year IT)</div>
                <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                  Rotating QR gate passes, YouPI registration payments, AICTE activity log, and mentorship bookings.
                </p>
              </div>

              <button
                type="button"
                disabled={loggingInRole !== null}
                onClick={() => handleQuickLogin('Student Member', 'member@clubsync.app', 'Password123!')}
                className="mt-5 w-full py-2 px-3 rounded-lg border border-border bg-surface hover:bg-surface-muted text-text text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {loggingInRole === 'Student Member' ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate as Member</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>

            {/* Credential Registry */}
            <div className="border border-border rounded-xl p-5 bg-surface-dim hover:border-border/80 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileCheck size={18} />
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Public Verification
                  </span>
                </div>
                <h3 className="font-bold text-sm text-text">Public Credential Ledger</h3>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">PICT-CERT-2026-X89</div>
                <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                  Cryptographic verification of symposium merit certificates with 1-click LinkedIn Profile integration.
                </p>
              </div>

              <Link
                to="/verify/PICT-CERT-2026-X89"
                className="mt-5 w-full py-2 px-3 rounded-lg border border-border bg-surface hover:bg-surface-muted text-text text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Inspect Credential Dossier</span>
                <ExternalLink size={13} />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* Six Systems Grid */}
      <section id="systems" className="scroll-mt-16 max-w-5xl mx-auto px-4 py-12 border-t border-border">
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
            Architecture &amp; Features
          </div>
          <h2 className="text-2xl font-bold text-text">
            Core Subsystems
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Engineered specifically for engineering symposium realities and Gymkhana requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, tag, metric, desc }) => (
            <div 
              key={title}
              className="border border-border rounded-xl p-5 bg-surface hover:border-border/80 transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-muted text-primary flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-dim border border-border text-text-secondary">
                    {tag}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-text mb-1">{title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-secondary">
                <span>Metric: {metric}</span>
                <span className="text-primary font-bold">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PICT Societies Showcase */}
      <section id="societies" className="scroll-mt-16 max-w-5xl mx-auto px-4 py-12 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
              Collegiate Ecosystem
            </div>
            <h2 className="text-2xl font-bold text-text">
              Active PICT Student Societies
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Collegiate organizations preloaded in ClubSync's database.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-surface p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'all' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('tech')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'tech' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'
              }`}
            >
              Technical
            </button>
            <button
              onClick={() => setActiveTab('other')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'other' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'
              }`}
            >
              Non-Tech
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSocieties.map((s) => (
            <div
              key={s.acronym}
              className="border border-border rounded-xl p-5 bg-surface hover:border-border/80 transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {s.acronym}
                  </span>
                  <span className="text-[11px] text-text-secondary font-mono">
                    Est. {s.founded}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-text">{s.name}</h3>
                <div className="text-xs font-medium text-text-secondary mt-0.5 mb-2">
                  Symposium: {s.fest}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-secondary text-[11px]">{s.members}</span>
                <Link to="/clubs" className="text-primary hover:underline font-medium text-[11px] flex items-center gap-1">
                  View Roster <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Minimal Clean Footer */}
      <footer className="border-t border-border bg-surface py-8 text-xs text-text-secondary">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text">ClubSync</span>
            <span>•</span>
            <span>Pune Institute of Computer Technology (PICT)</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#sandbox" className="hover:text-text transition-colors">Sandbox</a>
            <Link to="/verify/PICT-CERT-2026-X89" className="hover:text-text transition-colors">Registry</Link>
            <Link to="/login" className="hover:text-text transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
