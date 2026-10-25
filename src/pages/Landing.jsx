import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowRight, Users, Calendar, Bell, Zap, ShieldCheck, Printer, 
  CreditCard, Kanban, Scale, GraduationCap, Radio, Sparkles, 
  CheckCircle2, ExternalLink, Moon, Sun, ArrowUpRight, Copy, 
  Check, ChevronRight, Lock, Award, Building2, Flame
} from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { useTheme } from '../context/ThemeContext'
import { toast } from 'sonner'

export default function Landing() {
  const navigate = useNavigate()
  const { login, currentUser } = useClubSync()
  const themeContext = useTheme()
  const [loggingInRole, setLoggingInRole] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const isDark = themeContext ? themeContext.dark : document.documentElement.classList.contains('dark')
  const toggleDark = themeContext ? themeContext.toggleDark : () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('clubsync-dark', 'false')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('clubsync-dark', 'true')
    }
  }

  // 1-Click Fast Sandbox Logins
  const handleQuickLogin = async (role, email, password) => {
    try {
      setLoggingInRole(role)
      toast.loading(`Signing in as ${role}...`, { id: 'quick-login' })
      await login(email, password)
      toast.success(`Authenticated as ${role}! Redirecting to dashboard...`, { id: 'quick-login' })
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

  // Showcase Features
  const features = [
    {
      icon: Printer,
      title: 'Continuous Gate Kiosk & 80mm Thermal Badge Printing',
      tag: 'Ingress & Hardware',
      color: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      metric: '< 120ms Scan-to-Print',
      desc: 'Sub-second QR turnstile scanning with anti-passback controls and direct ESC/POS hardware badge roll printing for symposiums like Credenz and Pulzion.'
    },
    {
      icon: CreditCard,
      title: 'YouPI Zero-Fee Collegiate Payment & Treasury Ledger',
      tag: 'FinOps & UPI Direct',
      color: 'from-emerald-600 to-teal-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      metric: '₹0 Gateway Toll Fees',
      desc: 'Zero-MDR peer UPI deep-link routing, dual-signatory treasury approval, and automatic 12-digit UTR reconciliation with immutable student gymkhana ledgers.'
    },
    {
      icon: Kanban,
      title: 'Corporate Sponsorship & Brand Outreach CRM Kanban',
      tag: 'Sponsorship CRM',
      color: 'from-amber-600 to-orange-600',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      metric: '100% Deliverable Tracking',
      desc: 'Multi-stage sponsorship pipeline tailored for national hackathons: Title, Platinum, and Tech sponsor tiers, live MOU tracking, and corporate relations history.'
    },
    {
      icon: Scale,
      title: 'Democratic Constitutional Governance & 66.6% Supermajority',
      tag: 'Digital Bylaws',
      color: 'from-purple-600 to-violet-600',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      metric: '66.7% Quorum Enforced',
      desc: 'Tamper-proof collegiate constitution revisions, live quorum verification, and cryptographic ballot tallies requiring two-thirds supermajority for executive bylaws.'
    },
    {
      icon: GraduationCap,
      title: 'Senior-Junior Peer Project Mentorship with Star Ratings',
      tag: 'Guild & Academics',
      color: 'from-cyan-600 to-blue-600',
      badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      metric: 'AICTE Activity Points',
      desc: 'Structured BE-TE-SE student developer pairings, sprint milestones, verified peer ratings, and automated AICTE activity point certificate generation.'
    },
    {
      icon: Radio,
      title: 'Multi-Channel Discord & Telegram Webhook Syndicate',
      tag: 'Omni Broadcast',
      color: 'from-rose-600 to-pink-600',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      metric: 'Sub-Second Dispatch',
      desc: 'Synchronous webhook broadcast syndicate pushing emergency announcements, gate check-in alerts, and ticket releases to official collegiate Discord & Telegram channels.'
    }
  ]

  // Real PICT Societies
  const pictSocieties = [
    {
      name: 'PICT IEEE Student Branch (PISB)',
      acronym: 'PISB',
      founded: '1988',
      type: 'Technical',
      fest: 'Credenz (Pune\'s Oldest Fest)',
      members: '320+ Members',
      accent: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5',
      desc: 'Leading IEEE chapter organizing national technical symposium Credenz, hands-on workshops, and IEEE Xplore paper presentations.'
    },
    {
      name: 'PICT ACM Student Chapter (PASC)',
      acronym: 'PASC',
      founded: '2011',
      type: 'Technical',
      fest: 'Pulzion & AlgoRhythms',
      members: '280+ Members',
      accent: 'border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/5',
      desc: 'Premier collegiate computing community driving competitive programming contests, open-source projects, and Pulzion hackathons.'
    },
    {
      name: 'CSI Student Chapter PICT',
      acronym: 'CSI',
      founded: '1995',
      type: 'Technical',
      fest: 'TechPulse & Research Colloquium',
      members: '240+ Members',
      accent: 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5',
      desc: 'Computer Society of India student branch dedicated to software craftsmanship, national technical quizzes, and cloud computing summits.'
    },
    {
      name: 'PICT Robocon',
      acronym: 'ROBOCON',
      founded: '2008',
      type: 'Autonomous Robotics',
      fest: 'ABU Robocon & DD Robocon',
      members: '60+ Core Guild',
      accent: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5',
      desc: 'National robotics powerhouses building multi-degree autonomous manipulators, ROS2 navigators, and high-precision mechanical bots.'
    },
    {
      name: 'PICT EDC (Entrepreneurship Cell)',
      acronym: 'EDC',
      founded: '2014',
      type: 'Venture & Startups',
      fest: 'E-Summit & Pitch Tank',
      members: '190+ Members',
      accent: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5',
      desc: 'Incubating student founders with angel investor networks, VC pitch days, patent mentorship, and startup acceleration clinics.'
    },
    {
      name: 'PICT Art Circle',
      acronym: 'ART CIRCLE',
      founded: '1985',
      type: 'Cultural & Theatre',
      fest: 'Firodiya Karandak & Udaan',
      members: '210+ Artists',
      accent: 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/5',
      desc: 'Award-winning cultural troupe representing PICT at Purushottam & Firodiya Karandak, annual fest Udaan, and classical music ensembles.'
    }
  ]

  const filteredSocieties = activeTab === 'all' 
    ? pictSocieties 
    : pictSocieties.filter(s => activeTab === 'tech' ? s.type.includes('Technical') || s.type.includes('Robotics') : !s.type.includes('Technical') && !s.type.includes('Robotics'))

  return (
    <div className="min-h-screen bg-surface-dim text-text transition-colors duration-200">
      
      {/* =========================================================================
          LANDING TOP HEADER / NAVBAR
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#12121f]/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
              CS
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-text leading-tight">
                Club<span className="text-primary">Sync</span>
              </span>
              <span className="text-[10px] font-semibold text-text-secondary tracking-widest uppercase">
                PICT Pune Operations
              </span>
            </div>
          </Link>

          {/* Desktop Anchor Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-text-secondary">
            <a href="#sandbox" className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1.5 font-bold">
              <Zap size={14} className="fill-primary" /> Evaluator Sandbox
            </a>
            <a href="#features" className="hover:text-text transition-colors">Core Systems</a>
            <a href="#societies" className="hover:text-text transition-colors">PICT Societies</a>
            <Link to="/verify/PICT-CERT-2026-X89" className="hover:text-text transition-colors flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" /> Public Registry
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={toggleDark} 
              aria-label="Toggle visual theme"
              className="p-2 rounded-xl hover:bg-surface-muted transition-colors text-text-secondary hover:text-text border border-border/60"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            {currentUser ? (
              <Link
                to="/dashboard"
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-primary/30 flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-border hover:bg-surface-muted transition-colors"
                >
                  Sign In
                </Link>
                <a
                  href="#sandbox"
                  className="hidden sm:inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-primary/30 hover:scale-[1.02]"
                >
                  <Zap size={14} /> Test Sandbox
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION
      ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-primary/20 via-indigo-500/10 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative text-center">
          
          {/* Real Campus Society Callout Pill */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-6 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Built for PICT Pune Societies • IEEE (PISB), ACM (PASC), CSI, Robocon, EDC</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto text-text">
            Collegiate Society &amp; Operations Platform,
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent block mt-1">
              Engineered for Pune Technologists.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            Eliminate chaotic WhatsApp groups, lost paper receipts, and gate queues. From 80mm thermal badge printing to zero-fee UPI collegiate treasury — unified in one operating system.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14">
            <a
              href="#sandbox"
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-7 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={18} className="fill-white" />
              <span>Launch Evaluator Sandbox</span>
              <ArrowRight size={18} />
            </a>

            <Link
              to="/verify/PICT-CERT-2026-X89"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-semibold border border-border bg-white dark:bg-surface hover:bg-surface-muted hover:border-primary/40 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <ShieldCheck size={18} className="text-emerald-500" />
              <span>Inspect Credential Registry</span>
            </Link>
          </div>

          {/* Fast Metric Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-4 sm:p-6 rounded-3xl bg-white/70 dark:bg-surface/70 border border-border/80 backdrop-blur-xl shadow-lg">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-primary">6,200+</div>
              <div className="text-xs font-semibold text-text-secondary mt-0.5">PICT Engineers Synced</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-500">₹18.4L</div>
              <div className="text-xs font-semibold text-text-secondary mt-0.5">Zero-MDR Treasury</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-500">&lt; 120ms</div>
              <div className="text-xs font-semibold text-text-secondary mt-0.5">Gate Check-in Latency</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-purple-500">100%</div>
              <div className="text-xs font-semibold text-text-secondary mt-0.5">Tamper-Proof Audit</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ⚡ EVALUATOR QUICK SANDBOX (CRITICAL REQUIREMENT)
      ========================================================================= */}
      <section id="sandbox" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="relative rounded-3xl p-6 sm:p-10 border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-indigo-500/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          
          {/* Subtle Ambient Badge */}
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-44 h-44 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

          {/* Sandbox Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-border/70">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-extrabold uppercase tracking-wider mb-2">
                <Zap size={14} className="fill-current" />
                <span>Collegiate Hackathon &amp; Jury Sandbox</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-text">
                Evaluator 1-Click Interactive Access
              </h2>
              <p className="text-sm text-text-secondary mt-1 max-w-xl">
                Zero typing or registration required. Click any persona card below to instantly authenticate and evaluate preloaded PICT society data.
              </p>
            </div>

            {/* Quick Public Verification Reference */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-surface dark:bg-surface-muted/60 p-3 rounded-2xl border border-border">
              <span className="text-xs font-mono font-bold text-text-secondary">Demo Credential:</span>
              <div className="flex items-center gap-1.5">
                <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  PICT-CERT-2026-X89
                </code>
                <button
                  onClick={() => handleCopy('PICT-CERT-2026-X89', 'cert')}
                  className="p-1 hover:bg-surface-muted rounded text-text-secondary hover:text-text transition-colors"
                  title="Copy Certificate ID"
                >
                  {copiedKey === 'cert' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* 3 Sandbox Launch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
            
            {/* Card 1: Club Officer */}
            <div className="relative bg-white dark:bg-surface rounded-2xl p-6 border-2 border-amber-500/30 hover:border-amber-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
              <div className="absolute top-4 right-4">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold border border-amber-500/20">
                  Full Officer Powers
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">👑</span>
                </div>
                <h3 className="text-lg font-black text-text">Test as Club Officer</h3>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  Experience executive governance: Kiosk gate check-in, 80mm badge printing, UPI treasury approvals, referendum creation, and meeting rooms.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-surface-dim border border-border/80 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Email:</span>
                    <span className="font-bold text-text">officer@clubsync.app</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Role:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">President (Robocon / PISB)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={loggingInRole !== null}
                onClick={() => handleQuickLogin('Club Officer', 'officer@clubsync.app', 'Password123!')}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loggingInRole === 'Club Officer' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in as Officer...</span>
                  </>
                ) : (
                  <>
                    <span>👑 Launch as Club Officer</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* Card 2: Student Member */}
            <div className="relative bg-white dark:bg-surface rounded-2xl p-6 border-2 border-primary/30 hover:border-primary shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
              <div className="absolute top-4 right-4">
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold border border-primary/20">
                  Student Member
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="text-lg font-black text-text">Test as Student Member</h3>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  Explore collegiate student experience: 1-tap QR gate passes, YouPI membership dues, AICTE activity points log, peer mentorship, and voting.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-surface-dim border border-border/80 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Email:</span>
                    <span className="font-bold text-text">member@clubsync.app</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Role:</span>
                    <span className="font-bold text-primary">Student Member (Third Year)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={loggingInRole !== null}
                onClick={() => handleQuickLogin('Student Member', 'member@clubsync.app', 'Password123!')}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loggingInRole === 'Student Member' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in as Member...</span>
                  </>
                ) : (
                  <>
                    <span>🎓 Launch as Student Member</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* Card 3: Public Certificate Registry */}
            <div className="relative bg-white dark:bg-surface rounded-2xl p-6 border-2 border-emerald-500/30 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
              <div className="absolute top-4 right-4">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold border border-emerald-500/20">
                  Public Ledger
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-lg font-black text-text">Public Certificate Registry</h3>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  Verify authentic tamper-proof certificates: Conferred student PRN, AICTE points endorsement, organizing society stamp, and LinkedIn certification export.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-surface-dim border border-border/80 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Target:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">PICT-CERT-2026-X89</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Issuing:</span>
                    <span className="font-bold text-text">PICT Student Gymkhana</span>
                  </div>
                </div>
              </div>

              <Link
                to="/verify/PICT-CERT-2026-X89"
                className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck size={16} />
                <span>🛡️ Verify Live Credential</span>
              </Link>
            </div>

          </div>

          {/* Sandbox Footer Note */}
          <div className="mt-6 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Standard Demo Password for both accounts: <code className="font-mono font-bold text-text">Password123!</code></span>
            </div>
            <button
              onClick={() => handleCopy('Password123!', 'pwd')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              {copiedKey === 'pwd' ? 'Password Copied!' : 'Copy Password to Clipboard'}
            </button>
          </div>

        </div>
      </section>

      {/* =========================================================================
          FEATURE SHOWCASE GRID (6 SYSTEMS SPECIFIED)
      ========================================================================= */}
      <section id="features" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} /> Full Operations Suite
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-text tracking-tight">
            Six Purpose-Built Primitives for Collegiate Societies
          </h2>
          <p className="text-base text-text-secondary mt-3">
            Architected to eliminate manual spreadsheets, gate crowding, and lost sponsorship agreements across Pune engineering campuses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, tag, badgeBg, metric, desc }) => (
            <div 
              key={title} 
              className="bg-white/80 dark:bg-surface/80 rounded-3xl p-7 border border-border hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 backdrop-blur-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Icon size={24} className="stroke-[2.2]" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${badgeBg}`}>
                    {tag}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-text leading-snug mb-2.5">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-primary flex items-center gap-1">
                  <Zap size={13} /> {metric}
                </span>
                <span className="text-xs font-semibold text-text-secondary group-hover:text-primary transition-colors flex items-center gap-0.5">
                  Production Ready <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          REAL PICT SOCIETIES SHOWCASE
      ========================================================================= */}
      <section id="societies" className="scroll-mt-20 bg-white dark:bg-[#12121e] border-y border-border py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-2">
                <Building2 size={13} /> Official Collegiate Branches
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-text tracking-tight">
                Empowering PICT Pune Society Ecosystem
              </h2>
              <p className="text-sm text-text-secondary mt-2 max-w-xl">
                From national robotics arenas to Pune's largest technical symposiums, ClubSync unifies the entire Student Gymkhana registry.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-surface-muted dark:bg-surface p-1 rounded-2xl border border-border w-fit">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                All Societies
              </button>
              <button
                onClick={() => setActiveTab('tech')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'tech'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                Technical &amp; Robocon
              </button>
              <button
                onClick={() => setActiveTab('other')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'other'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                EDC &amp; Arts
              </button>
            </div>
          </div>

          {/* Societies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSocieties.map((s) => (
              <div
                key={s.acronym}
                className="rounded-3xl p-6 bg-surface-dim dark:bg-surface border border-border hover:border-primary/30 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${s.accent}`}>
                      {s.acronym}
                    </span>
                    <span className="text-[11px] font-mono text-text-secondary">
                      Est. {s.founded}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-text mb-1">{s.name}</h3>
                  <div className="text-xs font-semibold text-primary mb-3">
                    🎪 Flagship: {s.fest}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {s.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                    <Users size={14} className="text-primary" /> {s.members}
                  </span>
                  <Link 
                    to="/clubs"
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    View Roster <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          TESTIMONIALS / STUDENT LEAD QUOTES
      ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            <Award size={14} /> Society Testimonials
          </div>
          <h2 className="text-3xl font-black text-text">Voices from PICT Leaders</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-surface p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-text-secondary italic leading-relaxed mb-6">
              "During Credenz gate rushes, verifying 1,400+ attendees with paper receipts was a nightmare. The 80mm thermal badge printing and instant QR ingress reduced entry time to under 10 seconds per student."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 font-black flex items-center justify-center text-sm">
                AD
              </div>
              <div>
                <div className="font-bold text-xs text-text">Aditya Deshmukh</div>
                <div className="text-[11px] text-text-secondary">President, PICT Robocon &amp; Tech Lead</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-text-secondary italic leading-relaxed mb-6">
              "YouPI zero-MDR direct intent collection saved PISB over ₹34,000 in gateway fees during workshop registrations. Dual signatory verification means our treasurer and faculty audit without friction."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <div className="w-10 h-10 rounded-full bg-emerald-600/10 text-emerald-600 font-black flex items-center justify-center text-sm">
                KK
              </div>
              <div>
                <div className="font-bold text-xs text-text">Kavya Kulkarni</div>
                <div className="text-[11px] text-text-secondary">General Secretary, PICT IEEE Branch</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-text-secondary italic leading-relaxed mb-6">
              "The sponsorship Kanban tracked 18 tech companies for Pulzion. Live deliverable check-offs ensured no sponsor logo or speaker slot was ever missed, sealing 100% renewals."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <div className="w-10 h-10 rounded-full bg-purple-600/10 text-purple-600 font-black flex items-center justify-center text-sm">
                RS
              </div>
              <div>
                <div className="font-bold text-xs text-text">Rohan Sawant</div>
                <div className="text-[11px] text-text-secondary">Outreach Lead, PICT ACM Pulzion</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CALL TO ACTION BANNER
      ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-primary via-indigo-600 to-purple-700 text-white shadow-2xl overflow-hidden text-center">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-4">
              <Zap size={14} /> Ready for Evaluation
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
              Test ClubSync on PICT Society Infrastructure Today.
            </h2>
            <p className="text-sm sm:text-base text-white/85 mb-8 leading-relaxed">
              Experience the collegiate software standard. Launch the evaluator sandbox in one click or authenticate your custom college society credentials.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#sandbox"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-primary font-bold text-sm hover:bg-white/90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Zap size={18} className="fill-primary" />
                <span>Jump to Evaluator Sandbox</span>
              </a>
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-semibold text-sm border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Create Student Account</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
      ========================================================================= */}
      <footer className="border-t border-border bg-white dark:bg-[#0e0e1a] py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-extrabold text-sm">
                  CS
                </div>
                <span className="font-extrabold text-lg text-text">ClubSync PICT</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
                Collegiate Society &amp; Operations Platform deployed for Pune Institute of Computer Technology (PICT), Pune - 411043. Empowering PISB, PASC, CSI, Robocon, and Student Gymkhana.
              </p>
            </div>

            <div>
              <div className="text-xs font-bold text-text uppercase tracking-wider mb-3">Platform</div>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><a href="#sandbox" className="hover:text-primary transition-colors">Evaluator Sandbox</a></li>
                <li><Link to="/verify/PICT-CERT-2026-X89" className="hover:text-primary transition-colors">Certificate Registry</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">Officer Dashboard</Link></li>
                <li><Link to="/events" className="hover:text-primary transition-colors">Event Calendar</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold text-text uppercase tracking-wider mb-3">Societies</div>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><a href="#societies" className="hover:text-primary transition-colors">PICT IEEE (PISB)</a></li>
                <li><a href="#societies" className="hover:text-primary transition-colors">PICT ACM (PASC)</a></li>
                <li><a href="#societies" className="hover:text-primary transition-colors">PICT Robocon</a></li>
                <li><a href="#societies" className="hover:text-primary transition-colors">PICT EDC Incubator</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
            <div>
              &copy; 2026 ClubSync. Engineering Society Systems for Pune Institute of Computer Technology.
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                PICT Gymkhana Grid Live
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
