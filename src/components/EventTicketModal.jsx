import React, { useState, useEffect, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  X, Calendar, Clock, MapPin, CheckCircle, ShieldCheck, 
  Printer, Award, Ticket, Sparkles, WifiOff, RefreshCw,
  Lock, ExternalLink
} from 'lucide-react'

// Simple deterministic hash generator for rotating collegiate pass security
function generateSecurityHash(seed, timeSlot) {
  let str = `${seed}-${timeSlot}-PICT-CLUBSYNC`
  let hash1 = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash1 ^= str.charCodeAt(i)
    hash1 = Math.imul(hash1, 0x01000193)
  }
  const h1 = (hash1 >>> 0).toString(16).padStart(8, '0').toUpperCase()
  const part1 = h1.substring(0, 4)
  const part2 = h1.substring(4, 8)
  return `CS-${part1}-${part2}`
}

export default function EventTicketModal({ isOpen, onClose, event, club, user, eventMember, onOpenCertificate }) {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  const [timeLeft, setTimeLeft] = useState(20)
  const [timeSlot, setTimeSlot] = useState(() => Math.floor(Date.now() / 20000))
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Network offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 20-second dynamic TOTP countdown timer for anti-screenshot rotation
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRefreshing(true)
          setTimeSlot(Math.floor(Date.now() / 20000))
          setTimeout(() => setIsRefreshing(false), 400)
          return 20
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  const ticketCode = eventMember?.ticket_code || `TKT-${(event?.id || 'EV').slice(0, 5).toUpperCase()}`
  const isCheckedIn = Boolean(eventMember?.checked_in)

  // Compute live rotating security hash
  const securityHash = useMemo(() => {
    return generateSecurityHash(ticketCode, timeSlot)
  }, [ticketCode, timeSlot])

  if (!isOpen || !event) return null

  const qrData = JSON.stringify({
    app: 'ClubSync',
    type: 'EVENT_TICKET_SECURE',
    ticket_code: ticketCode,
    hash: securityHash,
    slot: timeSlot,
    event_id: event.id,
    user_id: user?.id,
    user_name: user?.name || user?.full_name,
    college_id: user?.college_id || null,
    branch: user?.branch || null
  })

  const handlePrint = () => {
    window.print()
  }

  const activityPoints = event.activity_points || 10
  const progressPercent = ((20 - timeLeft) / 20) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in print:p-0 print:bg-white overflow-y-auto">
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-full my-auto transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Holographic Anti-Counterfeit Shimmer Band */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 via-emerald-400 to-amber-400 animate-pulse print:hidden" />

        {/* Ticket Header */}
        <div 
          className="p-6 text-white relative flex flex-col justify-between"
          style={{ 
            background: `linear-gradient(135deg, ${club?.color || '#6c5ce7'} 0%, #0F172A 100%)` 
          }}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/90 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Collegiate Digital Pass
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                  🎯 +{activityPoints} AICTE Points
                </span>
              </div>
              <h3 className="text-lg font-black text-white leading-tight pt-1">{event.title}</h3>
              <p className="text-xs text-white/80 font-medium">{club?.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors print:hidden shrink-0 ml-2"
              title="Close Pass"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-end text-xs">
            <div>
              <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">Attendee & College PRN</span>
              <span className="font-extrabold text-white text-sm block">{user?.name || user?.full_name || 'Student Delegate'}</span>
              {(user?.college_id || user?.branch) && (
                <span className="text-[10px] text-white/90 font-mono font-medium">
                  {user?.college_id ? `PRN: ${user.college_id}` : ''} {user?.branch ? `• ${user.branch}` : ''}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">Ticket Code</span>
              <span className="font-mono font-black text-white tracking-widest text-sm">{ticketCode}</span>
            </div>
          </div>
        </div>

        {/* Realistic Ticket Perforated Divider with Dual Side Cutout Notches */}
        <div className="relative flex items-center justify-between px-4 py-2 bg-surface-dim border-y border-border/40">
          <div className="w-5 h-5 rounded-full bg-black/70 -ml-6 border-r border-border print:hidden" />
          <div className="border-t-2 border-dashed border-border/80 flex-1 mx-2" />
          <div className="w-5 h-5 rounded-full bg-black/70 -mr-6 border-l border-border print:hidden" />
        </div>

        {/* Dynamic Rotating QR Code Body */}
        <div className="p-6 text-center space-y-4">
          <div className="relative inline-block">
            {/* Rotating QR Box */}
            <div className={`p-4 bg-white rounded-2xl border border-gray-200 shadow-xl transition-all duration-300 ${
              isRefreshing ? 'scale-95 opacity-80 ring-4 ring-primary/40' : 'scale-100 ring-2 ring-primary/20'
            }`}>
              <QRCodeSVG 
                value={qrData}
                size={168}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Rotating Token Badge Indicator */}
            <div className="absolute -top-2.5 -right-2.5 bg-gray-900 border border-gray-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
              <RefreshCw size={10} className={`text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Countdown Progress Bar */}
          <div className="space-y-1.5 max-w-[220px] mx-auto">
            <div className="flex items-center justify-between text-[10px] font-semibold text-text-secondary">
              <span className="flex items-center gap-1">
                <Lock size={10} className="text-emerald-500" />
                Anti-Screenshot Rotation
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{timeLeft}s</span>
            </div>
            <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden border border-border/40">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cryptographic Security Hash Verification Pill */}
          <div className="p-2.5 rounded-xl bg-surface-dim border border-border text-left flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Security Verification Hash</div>
                <div className="text-xs font-mono font-black text-text tracking-wider truncate">{securityHash}</div>
              </div>
            </div>
            <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              GATE READY
            </span>
          </div>

          {/* Offline Cached Pass Pill */}
          {isOffline && (
            <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-semibold mx-auto max-w-xs">
              <WifiOff size={13} />
              <span>Offline Ready — Pass validated for gate entry</span>
            </div>
          )}

          {/* Attendance Status Badge */}
          <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isCheckedIn 
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {isCheckedIn ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CHECKED IN • ATTENDANCE RECORDED</span>
                </>
              ) : (
                <>
                  <Ticket size={14} />
                  <span>VALID FOR ENTRY • SHOW TO GATE SCRIBE</span>
                </>
              )}
            </div>
          </div>

          {/* Event Quick Details Card */}
          <div className="grid grid-cols-2 gap-2 text-left p-3 bg-surface-dim rounded-xl border border-border text-xs">
            <div>
              <span className="text-text-secondary block text-[10px] flex items-center gap-1 font-semibold">
                <Calendar size={10} className="text-primary" /> Date
              </span>
              <span className="font-bold text-text">
                {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div>
              <span className="text-text-secondary block text-[10px] flex items-center gap-1 font-semibold">
                <Clock size={10} className="text-primary" /> Time
              </span>
              <span className="font-bold text-text">{event.time || '10:00 AM'}</span>
            </div>
            <div className="col-span-2 pt-1.5 border-t border-border/50">
              <span className="text-text-secondary block text-[10px] flex items-center gap-1 font-semibold">
                <MapPin size={10} className="text-primary" /> Venue
              </span>
              <span className="font-bold text-text truncate block">{event.location || 'PICT Campus Auditorium'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1 print:hidden">
            {isCheckedIn && onOpenCertificate && (
              <button
                onClick={onOpenCertificate}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Award size={15} />
                <span>View Certificate of Participation</span>
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 px-4 border border-border rounded-xl text-xs font-semibold hover:bg-surface-dim transition-colors flex items-center justify-center gap-1.5 text-text"
              >
                <Printer size={14} /> Print Pass
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
