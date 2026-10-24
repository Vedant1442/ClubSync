import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Calendar, Clock, MapPin, CheckCircle, ShieldCheck, Printer, Award, Ticket, Sparkles, WifiOff } from 'lucide-react'

export default function EventTicketModal({ isOpen, onClose, event, club, user, eventMember, onOpenCertificate }) {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)

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

  if (!isOpen || !event) return null

  const ticketCode = eventMember?.ticket_code || `TKT-${(event.id || 'EV').slice(0, 5).toUpperCase()}`
  const isCheckedIn = Boolean(eventMember?.checked_in)

  const qrData = JSON.stringify({
    app: 'ClubSync',
    type: 'EVENT_TICKET',
    ticket_code: ticketCode,
    event_id: event.id,
    user_id: user?.id,
    user_name: user?.name || user?.full_name,
    college_id: user?.college_id || null,
    branch: user?.branch || null
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Ticket Top Notch Header */}
        <div 
          className="p-6 text-white relative flex flex-col justify-between"
          style={{ 
            background: `linear-gradient(135deg, ${club?.color || '#6c5ce7'} 0%, #1e1e2f 100%)` 
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                Collegiate Event Pass
              </span>
              <h3 className="text-lg font-black mt-2 text-white leading-tight">{event.title}</h3>
              <p className="text-xs text-white/80 mt-0.5">{club?.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors print:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-end text-xs">
            <div>
              <span className="text-white/60 block text-[10px]">Attendee & College ID</span>
              <span className="font-bold text-white text-sm block">{user?.name || user?.full_name || 'Student Member'}</span>
              {(user?.college_id || user?.branch) && (
                <span className="text-[10px] text-white/90 font-mono">
                  {user?.college_id ? `PRN: ${user.college_id}` : ''} {user?.branch ? `• ${user.branch}` : ''}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-white/60 block text-[10px]">Ticket No.</span>
              <span className="font-mono font-bold text-white tracking-wider">{ticketCode}</span>
            </div>
          </div>
        </div>

        {/* Perforated Stub Divider */}
        <div className="relative flex items-center justify-between px-4 py-2 bg-surface-dim">
          <div className="w-5 h-5 rounded-full bg-black/60 -ml-6 print:hidden" />
          <div className="border-t-2 border-dashed border-border/80 flex-1 mx-2" />
          <div className="w-5 h-5 rounded-full bg-black/60 -mr-6 print:hidden" />
        </div>

        {/* Ticket Body with Dynamic Check-in QR */}
        <div className="p-6 text-center space-y-4">
          <div className="inline-block p-4 bg-white rounded-2xl border border-border shadow-inner">
            <QRCodeSVG 
              value={qrData}
              size={170}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg",
                x: undefined,
                y: undefined,
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>

          {isOffline && (
            <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-semibold mx-auto max-w-xs">
              <WifiOff size={13} />
              <span>Offline Ready • Pass cached on device</span>
            </div>
          )}

          <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isCheckedIn 
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
            }`}>
              {isCheckedIn ? <CheckCircle size={14} /> : <Ticket size={14} />}
              <span>{isCheckedIn ? 'CHECKED IN • ATTENDED' : 'VALID FOR ENTRY • SHOW AT GATE'}</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5 font-mono">
              Code: <span className="font-bold text-text">{ticketCode}</span>
            </p>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-left p-3 bg-surface-dim rounded-xl border border-border text-xs">
            <div>
              <span className="text-text-secondary block text-[10px] flex items-center gap-1">
                <Calendar size={10} /> Date
              </span>
              <span className="font-semibold text-text">
                {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div>
              <span className="text-text-secondary block text-[10px] flex items-center gap-1">
                <Clock size={10} /> Time
              </span>
              <span className="font-semibold text-text">{event.time || '10:00 AM'}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-border/50">
              <span className="text-text-secondary block text-[10px] flex items-center gap-1">
                <MapPin size={10} /> Venue
              </span>
              <span className="font-semibold text-text truncate block">{event.location || 'PICT Campus'}</span>
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
                className="flex-1 py-2.5 px-4 border border-border rounded-xl text-xs font-semibold hover:bg-surface-dim transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer size={14} /> Print Pass
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
