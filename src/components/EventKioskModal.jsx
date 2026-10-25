import React, { useState, useEffect, useRef } from 'react'
import { 
  X, QrCode, CheckCircle2, AlertCircle, Printer, Users, 
  Sparkles, Maximize2, Minimize2, Search, Volume2, VolumeX,
  UserPlus, UserCheck, RefreshCw, Clock, ShieldCheck, Zap,
  Award, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { useClubSync } from '../context/ClubSyncContext'

// Sound synthesizer chime for rapid hands-free check-in
function playBeep(success = true) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    if (success) {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08) // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28)
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime) // A3 low buzz
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    }
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch (e) {
    // Audio context may require click interaction
  }
}

export default function EventKioskModal({ isOpen, onClose, event, club }) {
  const { refreshData } = useClubSync()

  const [ticketInput, setTicketInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attendees, setAttendees] = useState([])
  const [lastAttendee, setLastAttendee] = useState(null)
  const [recentScans, setRecentScans] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoPrint, setAutoPrint] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('scanner') // 'scanner' | 'walkin'
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-IN'))

  // Walk-in form
  const [walkInForm, setWalkInForm] = useState({
    full_name: '',
    email: '',
    college_id: '',
    branch: 'TE - Computer Engineering'
  })
  const [registeringWalkIn, setRegisteringWalkIn] = useState(false)

  const inputRef = useRef(null)
  const badgePrintRef = useRef(null)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-refocus scanner input for hardware wedge barcode scanners
  useEffect(() => {
    if (isOpen && activeTab === 'scanner') {
      const focusTimer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus()
      }, 100)
      return () => clearTimeout(focusTimer)
    }
  }, [isOpen, activeTab, loading])

  // Fetch attendees list
  const fetchAttendees = async () => {
    if (!event) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/events/${event.id}/attendees`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAttendees(data)
      }
    } catch (err) {
      console.error('Failed to fetch attendees:', err)
    }
  }

  useEffect(() => {
    if (isOpen && event) {
      fetchAttendees()
    }
  }, [isOpen, event?.id])

  // Trigger Badge Print
  const handlePrintBadge = () => {
    window.print()
  }

  // Handle continuous check-in
  const handleCheckIn = async (codeToUse) => {
    const code = (codeToUse || ticketInput).trim().toUpperCase()
    if (!code) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/events/${event.id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ticket_code: code })
      })

      const data = await res.json()

      if (!res.ok) {
        if (soundEnabled) playBeep(false)
        throw new Error(data.error || 'Invalid ticket code')
      }

      if (soundEnabled) playBeep(true)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }

      const attendeeObj = data.attendee
      setLastAttendee(attendeeObj)
      setRecentScans(prev => [attendeeObj, ...prev.filter(a => a.id !== attendeeObj.id)].slice(0, 6))
      setTicketInput('')

      if (data.already_checked_in) {
        toast.info(data.message)
      } else {
        toast.success(data.message)
      }

      fetchAttendees()
      refreshData()

      // If auto-print is toggled, open print dialog
      if (autoPrint) {
        setTimeout(() => {
          handlePrintBadge()
        }, 300)
      }
    } catch (err) {
      toast.error(err.message || 'Check-in failed')
    } finally {
      setLoading(false)
      // Keep input focused for next attendee
      if (inputRef.current) inputRef.current.focus()
    }
  }

  // Handle spot walk-in registration
  const handleWalkInSubmit = async (e) => {
    e.preventDefault()
    if (!walkInForm.full_name.trim() || !walkInForm.email.trim()) {
      toast.error('Student Name and Email are required')
      return
    }

    try {
      setRegisteringWalkIn(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/events/${event.id}/walk-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(walkInForm)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to register walk-in')

      if (soundEnabled) playBeep(true)
      toast.success(data.message)

      const attendeeObj = data.attendee
      setLastAttendee(attendeeObj)
      setRecentScans(prev => [attendeeObj, ...prev].slice(0, 6))
      setWalkInForm({
        full_name: '',
        email: '',
        college_id: '',
        branch: 'TE - Computer Engineering'
      })
      setActiveTab('scanner')
      fetchAttendees()
      refreshData()

      if (autoPrint) {
        setTimeout(() => handlePrintBadge(), 300)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRegisteringWalkIn(false)
    }
  }

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  if (!isOpen || !event) return null

  const checkedInCount = attendees.filter(a => a.checked_in).length
  const totalCount = attendees.length
  const percent = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F19] text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* KIOSK TOP HEADER */}
      <div className="bg-[#111827] border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 font-bold">
            <QrCode size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PICT Registration Desk Kiosk
              </span>
              <span className="text-xs text-gray-400 font-mono font-medium">
                {currentTime}
              </span>
            </div>
            <h1 className="text-lg font-black text-white leading-tight mt-0.5">
              {event.title} <span className="text-xs font-normal text-gray-400">• {club?.name}</span>
            </h1>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled ? 'bg-gray-800 text-emerald-400 border-gray-700' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
            title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Auto Print Toggle */}
          <button
            onClick={() => setAutoPrint(!autoPrint)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              autoPrint ? 'bg-primary text-white border-primary shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
            }`}
            title="Auto-trigger thermal slip printing on scan"
          >
            <Printer size={14} />
            <span>Auto-Print: {autoPrint ? 'ON' : 'OFF'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
            title="Toggle Fullscreen Table Display"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Exit Kiosk Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
            title="Exit Desk Kiosk"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* PROGRESS GAUGE BAR */}
      <div className="bg-gray-900/80 border-b border-gray-800/80 px-6 py-2.5 flex items-center justify-between text-xs shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <span className="font-semibold text-gray-300">Live Turnout:</span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              {checkedInCount} / {totalCount}
            </span>
            <span className="text-gray-400">({percent}% Checked In)</span>
          </div>
          <div className="w-36 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700/60 hidden sm:block">
            <div 
              className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Tab switch between scanner & walk-in */}
        <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-xl border border-gray-700">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'scanner' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Fast-Lane Scanner
          </button>
          <button
            onClick={() => setActiveTab('walkin')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'walkin' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus size={12} />
            <span>Spot Walk-In</span>
          </button>
        </div>
      </div>

      {/* MAIN KIOSK BODY (SPLIT VIEW) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden print:p-0">
        {/* LEFT COLUMN: SCANNER INPUT OR SPOT WALK-IN (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4 overflow-y-auto print:hidden">
          {activeTab === 'scanner' ? (
            /* SCANNER STATION */
            <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 mb-2">
                  <Zap size={14} className="text-primary animate-pulse" />
                  Hands-Free Continuous Scanner Input
                </span>
                <h2 className="text-2xl font-black text-white">Scan Ticket or PRN Pass</h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Position student's QR code in front of barcode scanner wedge. System auto-verifies, registers AICTE attendance, and renders badge instantly.
                </p>
              </div>

              {/* Huge Scanner Input Box */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCheckIn()
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    placeholder="SCANNING READY... (or type TK-XXXXX / PRN)"
                    disabled={loading}
                    className="w-full py-5 px-6 rounded-2xl bg-gray-900 border-2 border-primary/60 text-xl font-mono font-bold text-emerald-400 placeholder-gray-600 focus:outline-none focus:border-emerald-500 shadow-inner tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={loading || !ticketInput.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-colors shadow-md disabled:opacity-30"
                  >
                    {loading ? <RefreshCw size={15} className="animate-spin" /> : 'Enter ➔'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 font-mono">
                  <span>Input automatically auto-focuses after each scan</span>
                  <span>Press [Enter] to submit</span>
                </div>
              </form>

              {/* Quick Preset Test Scan Chips */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Quick Check-In Presets (Click to Test Desk Relay):
                </span>
                <div className="flex flex-wrap gap-2">
                  {attendees.slice(0, 4).map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleCheckIn(a.ticket_code)}
                      className="px-3 py-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700 border border-gray-700 text-xs font-semibold text-gray-200 transition-colors flex items-center gap-1.5"
                    >
                      <span className={`w-2 h-2 rounded-full ${a.checked_in ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="truncate max-w-[120px]">{a.user_name}</span>
                      <span className="font-mono text-[10px] text-gray-400">({a.ticket_code})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RECENT SCANS STREAM */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Recent Desk Scans ({recentScans.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recentScans.map((scan, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setLastAttendee(scan)}
                      className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-primary/50 cursor-pointer flex items-center justify-between text-xs transition-all"
                    >
                      <div className="truncate">
                        <div className="font-bold text-white truncate">{scan.user_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{scan.college_id || 'PRN Verified'}</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                        Badge Ready
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* SPOT WALK-IN REGISTRATION FORM */
            <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 mb-1">
                  <UserPlus size={14} />
                  Fast-Lane Walk-In Desk Registration
                </span>
                <h2 className="text-xl font-black text-white">Instant Student Check-In</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Register non-RSVP students arriving at the entrance gate on the spot and print their badge.
                </p>
              </div>

              <form onSubmit={handleWalkInSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Full Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Atharva Joshi"
                    value={walkInForm.full_name}
                    onChange={(e) => setWalkInForm({ ...walkInForm, full_name: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-gray-900 border border-gray-700 text-sm font-bold text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">College Roll No / PRN</label>
                    <input
                      type="text"
                      placeholder="e.g. C2K231189"
                      value={walkInForm.college_id}
                      onChange={(e) => setWalkInForm({ ...walkInForm, college_id: e.target.value })}
                      className="w-full py-2 px-3 rounded-xl bg-gray-900 border border-gray-700 text-xs font-mono text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Class & Department</label>
                    <select
                      value={walkInForm.branch}
                      onChange={(e) => setWalkInForm({ ...walkInForm, branch: e.target.value })}
                      className="w-full py-2 px-3 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-primary font-medium"
                    >
                      <option value="FE - First Year">FE - First Year</option>
                      <option value="SE - Computer Engineering">SE - Computer Engineering</option>
                      <option value="TE - Computer Engineering">TE - Computer Engineering</option>
                      <option value="BE - Computer Engineering">BE - Computer Engineering</option>
                      <option value="TE - Information Technology">TE - Information Technology</option>
                      <option value="BE - Information Technology">BE - Information Technology</option>
                      <option value="TE - E&TC Engineering">TE - E&TC Engineering</option>
                      <option value="BE - E&TC Engineering">BE - E&TC Engineering</option>
                      <option value="TE - AI & Data Science">TE - AI & Data Science</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@pict.edu"
                    value={walkInForm.email}
                    onChange={(e) => setWalkInForm({ ...walkInForm, email: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('scanner')}
                    className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registeringWalkIn}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg flex items-center gap-1.5"
                  >
                    {registeringWalkIn ? <RefreshCw size={14} className="animate-spin" /> : <Printer size={14} />}
                    <span>Register & Generate Badge</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE BADGE SLIP PREVIEW & THERMAL PRINTER (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between overflow-y-auto print:m-0 print:p-0 print:w-full print:block">
          <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-between h-full space-y-4 print:border-none print:shadow-none print:bg-white print:p-0">
            {/* Action Bar */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-gray-800 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Printer size={14} className="text-primary" />
                Physical Badge Slip
              </span>
              <button
                onClick={handlePrintBadge}
                disabled={!lastAttendee}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-40 transition-colors"
              >
                <Printer size={13} />
                <span>Print Thermal Slip</span>
              </button>
            </div>

            {/* THE THERMAL BADGE / CARD COMPONENT (Formatted for 80mm thermal paper or desk badge) */}
            {lastAttendee ? (
              <div 
                ref={badgePrintRef}
                className="w-full max-w-[340px] bg-white text-black p-5 rounded-2xl border-2 border-dashed border-gray-300 shadow-2xl space-y-4 text-center my-auto print:border-none print:shadow-none print:max-w-none print:w-full"
              >
                {/* Header Logo */}
                <div className="border-b-2 border-black pb-3 space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                    SCTR's Pune Institute of Computer Technology
                  </div>
                  <div className="text-sm font-black uppercase text-black leading-tight">
                    {club?.name || 'ClubSync Society'}
                  </div>
                  <div className="text-[11px] font-bold text-primary">
                    {event.title}
                  </div>
                </div>

                {/* Attendee Name & PRN */}
                <div className="py-2 space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Official Delegate Pass
                  </div>
                  <h3 className="text-2xl font-black text-black tracking-tight leading-none uppercase">
                    {lastAttendee.user_name}
                  </h3>
                  <div className="text-xs font-mono font-bold text-gray-800 mt-1">
                    {lastAttendee.college_id || 'PRN: Verified Student'}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-600">
                    {lastAttendee.branch || 'Engineering Department'}
                  </div>
                  {lastAttendee.team_name && (
                    <div className="text-xs font-black text-indigo-700 bg-indigo-50 py-0.5 px-2 rounded-md mt-1 inline-block">
                      Team: {lastAttendee.team_name}
                    </div>
                  )}
                </div>

                {/* Barcode & Ticket Code */}
                <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-2">
                  {/* Simulated High-Res Barcode */}
                  <div className="flex justify-center items-center h-10 gap-[2px] overflow-hidden px-4">
                    {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7, 9, 5].map((w, i) => (
                      <div 
                        key={i} 
                        className="bg-black h-full" 
                        style={{ width: `${(w % 3) + 1.5}px` }}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-mono font-black tracking-widest text-black">
                    {lastAttendee.ticket_code || lastAttendee.certificate_id}
                  </div>
                </div>

                {/* Badges / Entitlements */}
                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-black uppercase pt-1">
                  <div className="border border-black py-1 px-1 rounded font-mono">
                    ✓ EVENT KIT ISSUED
                  </div>
                  <div className="border border-black py-1 px-1 rounded font-mono">
                    ✓ LUNCH PASS VALID
                  </div>
                </div>

                {/* Footer Seal */}
                <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 flex justify-between items-center font-mono">
                  <span>VERIFIED AT {new Date(lastAttendee.checked_in_at || Date.now()).toLocaleTimeString()}</span>
                  <span>GYMKHANA PICT</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 px-6 space-y-3 my-auto">
                <div className="w-16 h-16 rounded-full bg-gray-800 text-gray-600 flex items-center justify-center mx-auto">
                  <Printer size={28} />
                </div>
                <h4 className="text-sm font-bold text-gray-300">Awaiting Scanner Input</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Scan a student's digital QR ticket or perform a walk-in registration to generate an instant thermal badge slip.
                </p>
              </div>
            )}

            {/* Print Tips Note */}
            <div className="w-full p-3 rounded-2xl bg-gray-900 border border-gray-800 text-[11px] text-gray-400 flex items-center gap-2 print:hidden">
              <Sparkles size={14} className="text-primary shrink-0" />
              <span>Optimized for 80mm thermal receipt roll or standard badge sticker printer.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
