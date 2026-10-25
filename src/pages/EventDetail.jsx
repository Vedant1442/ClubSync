import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, 
  Share2, IndianRupee, ShieldCheck, Receipt, Sparkles, 
  Ticket, Award, QrCode, MessageCircle, MessageSquare, FileText, FileSpreadsheet, Download,
  Megaphone, AlertTriangle, Bot, CalendarPlus, CalendarDays, Navigation, Printer
} from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { SkeletonPage } from '../components/Skeleton'
import UPIPaymentModal from '../components/UPIPaymentModal'
import PaymentReceiptModal from '../components/PaymentReceiptModal'
import EventTicketModal from '../components/EventTicketModal'
import EventCertificateModal from '../components/EventCertificateModal'
import EventScannerModal from '../components/EventScannerModal'
import EventKioskModal from '../components/EventKioskModal'
import EventBroadcastModal from '../components/EventBroadcastModal'
import EventODLetterModal from '../components/EventODLetterModal'
import EventTeamSection from '../components/EventTeamSection'
import EventAIConciergeModal from '../components/EventAIConciergeModal'
import { getGoogleCalendarUrl, downloadICSFile } from '../utils/calendarSync'
import CampusVenueMapModal from '../components/CampusVenueMapModal'
import EventLiveQAModal from '../components/EventLiveQAModal'

export default function EventDetail() {
  const { id } = useParams()
  const { events, clubs, eventMembers, clubMemberships, currentUser, toggleRSVP, payments, loading } = useClubSync()

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  const [isODModalOpen, setIsODModalOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false)
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false)
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false)
  const [isLiveQAModalOpen, setIsLiveQAModalOpen] = useState(false)
  const [broadcasts, setBroadcasts] = useState([])
  const [exportingAttendees, setExportingAttendees] = useState(false)

  const fetchBroadcasts = async () => {
    if (!id) return
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/events/${id}/broadcasts`)
      if (res.ok) {
        const data = await res.json()
        setBroadcasts(data)
      }
    } catch (e) {
      console.error('Failed to load broadcasts:', e)
    }
  }

  useEffect(() => {
    fetchBroadcasts()
  }, [id])

  const handleExportAttendeesCSV = async () => {
    try {
      setExportingAttendees(true)
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_URL}/api/events/${event.id}/attendees`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch attendee records')
      const data = await res.json()
      if (!data || data.length === 0) {
        toast.info('No attendees registered yet for this event.')
        return
      }

      const headers = ['Student Name', 'Roll No / PRN', 'Branch / Class', 'Email', 'Registration Status', 'Check-In Status', 'Check-In Time', 'Ticket Code', 'Certificate ID', 'Payment Status', 'Fee Paid (INR)', 'Payment UTR']
      const rows = data.map(a => [
        `"${(a.user_name || '').replace(/"/g, '""')}"`,
        `"${a.college_id || 'N/A'}"`,
        `"${(a.branch || 'N/A').replace(/"/g, '""')}"`,
        `"${(a.user_email || '').replace(/"/g, '""')}"`,
        `"${a.status || 'registered'}"`,
        a.checked_in ? 'Checked In' : 'Registered / Absent',
        a.checked_in_at ? `"${new Date(a.checked_in_at).toLocaleString('en-IN')}"` : 'N/A',
        `"${a.ticket_code || ''}"`,
        `"${a.certificate_id || ''}"`,
        `"${a.payment_status || (eventPrice > 0 ? 'Verified' : 'Free')}"`,
        a.payment_amount || eventPrice || 0,
        `"${a.payment_utr || 'N/A'}"`
      ])

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Attendees_Roster.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Attendee report exported successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV')
    } finally {
      setExportingAttendees(false)
    }
  }

  const handleWhatsAppShare = () => {
    const eventUrl = window.location.href
    const dateFormatted = new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    const priceText = eventPrice > 0 ? `₹${eventPrice}` : 'FREE'
    const message = `🎟️ *${event.title}*\n🏛️ Host: *${club?.name || 'PICT Pune Club'}*\n📅 Date: *${dateFormatted}* at *${event.time}*\n📍 Venue: *${event.location}*\n💰 Entry: *${priceText}*\n\n👉 Join & claim your Digital Pass on ClubSync:\n${eventUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) {
    return <SkeletonPage />
  }

  const event = events.find(e => String(e.id) === String(id))

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">Event not found.</p>
        <Link to="/events" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">← Back to events</Link>
      </div>
    )
  }

  const club = clubs.find(c => String(c.id) === String(event.club_id))
  const isRSVPed = eventMembers.some(em => String(em.event_id) === String(event.id) && String(em.user_id) === String(currentUser?.id))
  const eventMember = eventMembers.find(em => String(em.event_id) === String(event.id) && String(em.user_id) === String(currentUser?.id))
  const attendeesCount = eventMembers.filter(em => String(em.event_id) === String(event.id)).length
  const maxAttendees = event.max_attendees || 100
  const spotsLeft = Math.max(0, maxAttendees - attendeesCount)
  const fillPercent = Math.min(100, (attendeesCount / maxAttendees) * 100)
  const eventPrice = Number(event.price) || 0

  // Check if current user is an officer of the organizing club
  const isOfficer = clubMemberships.some(m => 
    String(m.club_id) === String(event.club_id) && 
    String(m.user_id) === String(currentUser?.id) && 
    ['President', 'Vice President', 'Secretary', 'Treasurer', 'officer', 'Officer'].includes(m.role)
  )

  // Check if current user has a verified payment record for this event
  const userPayment = payments.find(p => 
    String(p.event_id) === String(event.id) && 
    String(p.user_id) === String(currentUser?.id) && 
    p.status === 'verified'
  ) || (isRSVPed && eventPrice > 0 ? {
    id: 'mock-rec-' + event.id,
    ref_id: `CS-${(event.id || 'EV').slice(0, 8).toUpperCase()}`,
    amount: eventPrice,
    currency: 'INR',
    vpa: club?.upi_vpa || 'vedant1442@fam',
    payee_name: club?.name || 'PICT Robocon Pune',
    utr: '412384759201',
    status: 'verified',
    verified_at: new Date()
  } : null)

  const handleRsvpClick = async () => {
    if (eventPrice > 0 && !isRSVPed) {
      setIsPaymentModalOpen(true)
      return
    }

    try {
      await toggleRSVP(event.id)
    } catch (e) {
      toast.error("Failed to update RSVP")
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Join ${event.title} organized by ${club?.name} on ClubSync!`,
        url: window.location.href
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Event link copied to clipboard!')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex justify-between items-center mb-6">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text">
          <ArrowLeft size={16} /> Back to events
        </Link>

        {isOfficer && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
              title="Blast urgent bulletin or notice to all registered attendees"
            >
              <Megaphone size={15} />
              <span>Broadcast Notice</span>
            </button>
            <button
              onClick={handleExportAttendeesCSV}
              disabled={exportingAttendees}
              className="px-3.5 py-2 bg-surface-dim hover:bg-surface-muted border border-border text-text rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              title="Download official roster for college faculty / attendance records"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <span>{exportingAttendees ? 'Exporting...' : 'Export Roster (CSV)'}</span>
            </button>
            <button
              onClick={() => setIsKioskModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
              title="Launch Fullscreen Registration Desk Kiosk & Thermal Badge Printer"
            >
              <Printer size={15} />
              <span>Desk Kiosk & Badge Print</span>
            </button>
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-primary hover:from-indigo-700 hover:to-primary-dark text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
            >
              <QrCode size={16} />
              <span>Gate Scanner & Check-In</span>
            </button>
          </div>
        )}
      </div>

      {/* Pinned Broadcast Bulletins */}
      {broadcasts.length > 0 && (
        <div className="space-y-3 mb-6">
          {broadcasts.map(bc => (
            <div 
              key={bc.id}
              className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-sm ${
                bc.priority === 'urgent'
                  ? 'bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border-red-500/30'
                  : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                bc.priority === 'urgent' ? 'bg-red-500/20 text-red-600' : 'bg-primary/20 text-primary'
              }`}>
                {bc.priority === 'urgent' ? <AlertTriangle size={18} /> : <Megaphone size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    bc.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-primary text-white'
                  }`}>
                    {bc.priority === 'urgent' ? '🚨 Urgent Notice' : 'Event Bulletin'}
                  </span>
                  <span className="text-xs font-bold text-text truncate">{bc.title}</span>
                  <span className="text-[11px] text-text-secondary ml-auto shrink-0">
                    {new Date(bc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  {bc.message}
                </p>
                {bc.author_name && (
                  <div className="text-[10px] text-text-secondary/80 mt-1 font-medium">
                    Posted by {bc.author_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden mb-6">
        <div className="h-36 md:h-48 relative" style={{ background: `${club?.color || '#6c5ce7'}18` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            {eventPrice > 0 ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                <span>₹{eventPrice} Entry</span>
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600 text-white shadow-sm">
                Free Event
              </span>
            )}
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/90 dark:bg-surface/90 backdrop-blur text-text-secondary">
              {event.category || 'Workshop'}
            </span>
          </div>
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={`/clubs/${club?.id}`}
              className="text-xs font-semibold px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
              style={{ background: `${club?.color || '#6c5ce7'}15`, color: club?.color || '#6c5ce7' }}
            >
              {club?.name}
            </Link>
            {eventPrice > 0 && (
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <Sparkles size={12} /> YouPI Zero-Fee UPI
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-4 text-text">{event.title}</h1>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3.5 bg-surface-dim rounded-xl border border-border">
              <Calendar size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-text-secondary">Date</div>
                <div className="text-sm font-semibold text-text">
                  {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-surface-dim rounded-xl border border-border">
              <Clock size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-text-secondary">Time</div>
                <div className="text-sm font-semibold text-text">{event.time || 'TBD'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-surface-dim rounded-xl border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <MapPin size={18} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-text-secondary">Location</div>
                  <div className="text-sm font-semibold text-text truncate">{event.location || 'Campus Auditorium'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVenueModalOpen(true)}
                className="ml-2 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
                title="View PICT Campus Venue Navigator & Directions"
              >
                <Navigation size={13} />
                <span>Map & Guide</span>
              </button>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-surface-dim rounded-xl border border-border">
              <Users size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-text-secondary">Capacity</div>
                <div className="text-sm font-semibold text-text">{attendeesCount} / {maxAttendees}</div>
              </div>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-text-secondary leading-relaxed">{event.description}</p>
          </div>

          {/* Capacity bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-secondary text-xs">{attendeesCount} student(s) registered</span>
              <span className={`text-xs font-semibold ${spotsLeft <= 5 ? 'text-orange-500' : 'text-emerald-600'}`}>
                {spotsLeft} spots remaining
              </span>
            </div>
            <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${fillPercent}%`, background: club?.color || '#6c5ce7' }} 
              />
            </div>
          </div>

          {/* Hackathon Squad / Team Section if Team Event */}
          {event.is_team_event && (
            <div className="mb-6">
              <EventTeamSection
                event={event}
                club={club}
                currentUser={currentUser}
                onTeamUpdated={() => {}}
              />
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleRsvpClick}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${
                isRSVPed
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-primary text-white hover:bg-primary-dark hover:scale-[1.02]'
              }`}
            >
              {isRSVPed ? (
                <>
                  <CheckCircle size={18} />
                  <span>Registered {eventPrice > 0 ? '(Paid ₹' + eventPrice + ')' : ''}</span>
                </>
              ) : eventPrice > 0 ? (
                <>
                  <IndianRupee size={18} />
                  <span>Pay ₹{eventPrice} & Register via UPI</span>
                </>
              ) : (
                'RSVP Now (Free)'
              )}
            </button>

            {/* View Digital Ticket Pass (QR) */}
            {isRSVPed && (
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="px-4 py-3 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Ticket size={16} />
                <span>View Event Pass (QR)</span>
              </button>
            )}

            {/* View Certificate of Participation if Checked-In */}
            {isRSVPed && eventMember?.checked_in && (
              <button
                onClick={() => setIsCertificateModalOpen(true)}
                className="px-4 py-3 rounded-xl font-bold text-xs bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Award size={16} className="text-amber-600" />
                <span>Certificate of Participation</span>
              </button>
            )}

            {/* View On-Duty (OD) Leave Letter if Checked-In */}
            {isRSVPed && eventMember?.checked_in && (
              <button
                onClick={() => setIsODModalOpen(true)}
                className="px-4 py-3 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <FileText size={16} className="text-emerald-600" />
                <span>Duty Leave (OD) Letter</span>
              </button>
            )}

            {/* View E-Receipt */}
            {isRSVPed && userPayment && (
              <button
                onClick={() => setIsReceiptModalOpen(true)}
                className="px-4 py-3 rounded-xl font-medium text-xs border border-border bg-surface-dim hover:bg-surface-muted transition-colors flex items-center gap-1.5"
              >
                <Receipt size={16} className="text-emerald-600" />
                <span>View Receipt (UTR: {userPayment.utr})</span>
              </button>
            )}

            <button 
              onClick={handleWhatsAppShare}
              className="px-4 py-3 rounded-xl font-semibold text-xs bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Share event on WhatsApp class groups"
            >
              <MessageCircle size={16} className="text-emerald-600" />
              <span>WhatsApp Invite</span>
            </button>

            {/* Event AI Concierge Button */}
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-4 py-3 rounded-xl font-bold text-xs bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800 hover:bg-purple-100 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Instant Answers about Venue, Schedule, OD Leave & Squads"
            >
              <Bot size={16} className="text-purple-600" />
              <span>Ask Event AI</span>
            </button>

            {/* Live Audience Q&A (Slido Style) */}
            <button
              onClick={() => setIsLiveQAModalOpen(true)}
              className="px-4 py-3 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Participate in live questions and upvoting during the event"
            >
              <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Live Q&A</span>
            </button>

            {/* Campus Venue Navigator */}
            <button
              onClick={() => setIsVenueModalOpen(true)}
              className="px-3.5 py-3 rounded-xl font-bold text-xs bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-950/60 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Open Interactive PICT Campus Map & Walking Directions"
            >
              <Navigation size={15} className="text-sky-600 dark:text-sky-400" />
              <span>Campus Map</span>
            </button>

            {/* Calendar Sync Options */}
            <div className="flex items-center gap-1.5">
              <a
                href={getGoogleCalendarUrl(event, club)}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-3 rounded-xl font-medium text-xs border border-border bg-surface-dim hover:bg-surface-muted transition-colors flex items-center gap-1.5"
                title="Add to Google Calendar"
              >
                <CalendarPlus size={15} className="text-primary" />
                <span>Google Cal</span>
              </a>
              <button
                onClick={() => downloadICSFile(event, club)}
                className="px-3 py-3 rounded-xl font-medium text-xs border border-border bg-surface-dim hover:bg-surface-muted transition-colors flex items-center gap-1"
                title="Download iCal / Outlook (.ics)"
              >
                <CalendarDays size={15} className="text-text-secondary" />
                <span>.ics</span>
              </button>
            </div>

            <button 
              onClick={handleShare}
              className="px-4 py-3 rounded-xl font-medium text-sm border border-border hover:bg-surface-muted transition-colors flex items-center gap-2"
            >
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      </div>

      {/* YouPI Zero-Fee UPI Payment Checkout Modal */}
      {club && (
        <UPIPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          club={club}
          event={event}
          type="event_ticket"
          amount={eventPrice}
          onSuccess={() => {
            setIsPaymentModalOpen(false)
            setIsTicketModalOpen(true)
          }}
        />
      )}

      {/* Official Collegiate E-Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        payment={userPayment}
        event={event}
        club={club}
        user={currentUser}
      />

      {/* Event Digital Ticket Pass (QR) Modal */}
      <EventTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        event={event}
        club={club}
        user={currentUser}
        eventMember={eventMember}
        onOpenCertificate={() => {
          setIsTicketModalOpen(false)
          setIsCertificateModalOpen(true)
        }}
      />

      {/* Event Certificate of Participation Modal */}
      <EventCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        event={event}
        club={club}
        user={currentUser}
        eventMember={eventMember}
      />

      {/* Official On-Duty (OD / DL) Attendance Letter Modal */}
      <EventODLetterModal
        isOpen={isODModalOpen}
        onClose={() => setIsODModalOpen(false)}
        event={event}
        club={club}
        user={currentUser}
        eventMember={eventMember}
      />

      {/* Officer Venue Scanner & Live Check-in Modal */}
      {isOfficer && (
        <EventScannerModal
          isOpen={isScannerModalOpen}
          onClose={() => setIsScannerModalOpen(false)}
          event={event}
          club={club}
          onOpenKiosk={() => setIsKioskModalOpen(true)}
        />
      )}

      {/* Event Day Desk Kiosk & Thermal Badge Printing Modal */}
      {isOfficer && (
        <EventKioskModal
          isOpen={isKioskModalOpen}
          onClose={() => setIsKioskModalOpen(false)}
          event={event}
          club={club}
        />
      )}

      {/* Officer Broadcast Bulletin Modal */}
      {isOfficer && (
        <EventBroadcastModal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
          event={event}
          club={club}
          attendeesCount={attendeesCount}
          onBroadcastSent={(newBroadcast) => {
            setBroadcasts(prev => [newBroadcast, ...prev])
          }}
        />
      )}

      {/* Event AI Concierge Q&A Modal */}
      <EventAIConciergeModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        event={event}
        club={club}
      />

      {/* Campus Venue Navigator Modal */}
      <CampusVenueMapModal
        isOpen={isVenueModalOpen}
        onClose={() => setIsVenueModalOpen(false)}
        event={event}
        club={club}
      />

      {/* Live Audience Q&A Modal */}
      <EventLiveQAModal
        isOpen={isLiveQAModalOpen}
        onClose={() => setIsLiveQAModalOpen(false)}
        event={event}
        club={club}
        currentUser={currentUser}
        isOfficer={isOfficer}
      />
    </div>
  )
}
