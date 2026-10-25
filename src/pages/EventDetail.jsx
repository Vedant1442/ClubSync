import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, 
  Share2, IndianRupee, ShieldCheck, Receipt, Sparkles, 
  Ticket, Award, QrCode, MessageCircle, MessageSquare, FileText, 
  FileSpreadsheet, Download, Megaphone, AlertTriangle, Bot, 
  CalendarPlus, CalendarDays, Navigation, Printer, Search, 
  RefreshCw, CheckCircle2, UserCheck, Radio, ExternalLink, 
  Filter, Copy, Check, Zap, ChevronRight
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
  const { events, clubs, eventMembers, clubMemberships, currentUser, toggleRSVP, payments, loading, refreshData } = useClubSync()

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

  // Attendee Table State
  const [attendees, setAttendees] = useState([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [attendeeFilter, setAttendeeFilter] = useState('all') // 'all' | 'checked_in' | 'registered'
  const [selectedAttendeeForOD, setSelectedAttendeeForOD] = useState(null)
  const [checkingInId, setCheckingInId] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const fetchBroadcasts = async () => {
    if (!id) return
    try {
      const res = await fetch(`${API_URL}/api/events/${id}/broadcasts`)
      if (res.ok) {
        const data = await res.json()
        setBroadcasts(data)
      }
    } catch (e) {
      console.error('Failed to load broadcasts:', e)
    }
  }

  const fetchAttendees = async () => {
    if (!id) return
    try {
      setLoadingAttendees(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/events/${id}/attendees`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAttendees(data)
      }
    } catch (e) {
      console.error('Failed to load attendees:', e)
    } finally {
      setLoadingAttendees(false)
    }
  }

  useEffect(() => {
    fetchBroadcasts()
  }, [id])

  const event = events.find(e => String(e.id) === String(id))
  const club = clubs.find(c => String(c.id) === String(event?.club_id))
  const isRSVPed = eventMembers.some(em => String(em.event_id) === String(event?.id) && String(em.user_id) === String(currentUser?.id))
  const eventMember = eventMembers.find(em => String(em.event_id) === String(event?.id) && String(em.user_id) === String(currentUser?.id))
  const attendeesCount = eventMembers.filter(em => String(em.event_id) === String(event?.id)).length
  const maxAttendees = event?.max_attendees || 100
  const spotsLeft = Math.max(0, maxAttendees - attendeesCount)
  const fillPercent = Math.min(100, (attendeesCount / maxAttendees) * 100)
  const eventPrice = Number(event?.price) || 0
  const activityPoints = event?.activity_points || 10

  // Check if current user is an officer of the organizing club (or demo officer)
  const isOfficer = currentUser?.email === 'officer@clubsync.app' || currentUser?.role === 'officer' || clubMemberships.some(m => 
    String(m.club_id) === String(event?.club_id) && 
    String(m.user_id) === String(currentUser?.id) && 
    ['President', 'Vice President', 'Secretary', 'Treasurer', 'officer', 'Officer', 'Lead', 'Head'].includes(m.role)
  )

  useEffect(() => {
    if (isOfficer && id) {
      fetchAttendees()
    }
  }, [isOfficer, id])

  // Check if current user has a verified payment record for this event
  const userPayment = payments.find(p => 
    String(p.event_id) === String(event?.id) && 
    String(p.user_id) === String(currentUser?.id) && 
    p.status === 'verified'
  ) || (isRSVPed && eventPrice > 0 ? {
    id: 'mock-rec-' + event?.id,
    ref_id: `CS-${(event?.id || 'EV').slice(0, 8).toUpperCase()}`,
    amount: eventPrice,
    currency: 'INR',
    vpa: club?.upi_vpa || 'vedant1442@fam',
    payee_name: club?.name || 'PICT Pune Society',
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

  const handleQuickCheckIn = async (attendee) => {
    if (!attendee?.ticket_code) {
      toast.error('No ticket code found for student')
      return
    }

    try {
      setCheckingInId(attendee.id)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/events/${event.id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ticket_code: attendee.ticket_code })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Check-in failed')

      toast.success(data.message || `Checked in ${attendee.user_name}`)
      fetchAttendees()
      refreshData()
    } catch (err) {
      toast.error(err.message || 'Check-in failed')
    } finally {
      setCheckingInId(null)
    }
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success('Copied to clipboard!')
  }

  const handleExportAttendeesCSV = async () => {
    try {
      setExportingAttendees(true)
      const token = localStorage.getItem('token')
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
    const message = `🎟️ *${event.title}*\n🏛️ Host: *${club?.name || 'PICT Pune Club'}*\n📅 Date: *${dateFormatted}* at *${event.time}*\n📍 Venue: *${event.location}*\n🎯 AICTE Credits: *+${activityPoints} Points*\n💰 Entry: *${priceText}*\n\n👉 Join & claim your Digital Pass on ClubSync:\n${eventUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
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

  // Filtered attendees for attendee table
  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => {
      const matchesSearch = 
        (a.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.college_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.ticket_code || '').toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (attendeeFilter === 'checked_in') return Boolean(a.checked_in)
      if (attendeeFilter === 'registered') return !a.checked_in
      return true
    })
  }, [attendees, searchQuery, attendeeFilter])

  const checkedInCount = attendees.filter(a => a.checked_in).length
  const pendingCount = attendees.length - checkedInCount

  if (loading) {
    return <SkeletonPage />
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">Event not found.</p>
        <Link to="/events" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">← Back to events</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8 space-y-6">
      {/* TOP BAR WITH BREADCRUMB & BACK LINK */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text transition-colors">
          <ArrowLeft size={16} /> Back to events
        </Link>
      </div>

      {/* OFFICER COMMAND SUITE (IF CLUB OFFICER) */}
      {isOfficer && (
        <div className="bg-gradient-to-r from-gray-900 via-[#131b2e] to-gray-900 border-2 border-emerald-500/30 rounded-3xl p-5 shadow-2xl text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black shadow-inner">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ⚡ Officer Command Suite
                  </span>
                  <span className="text-xs text-gray-400 font-medium">Auditorium Event Operations Desk</span>
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Executive Operations Control
                </h3>
              </div>
            </div>

            {/* Quick Turnout Telemetry Badge */}
            <div className="flex items-center gap-3 bg-gray-800/80 px-4 py-2 rounded-2xl border border-gray-700">
              <Radio size={14} className="text-emerald-400 animate-pulse" />
              <div className="text-xs">
                <span className="text-gray-400 font-medium">Auditorium Turnout: </span>
                <span className="font-mono font-black text-emerald-400 text-sm">{checkedInCount} / {attendees.length || attendeesCount}</span>
                <span className="text-gray-400 font-medium"> Checked In</span>
              </div>
            </div>
          </div>

          {/* Grouped Actions: Prominent Desk Kiosk Mode + Suite Actions */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
            {/* Primary Feature: Vibrant Desk Kiosk Mode */}
            <button
              onClick={() => setIsKioskModalOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-black text-xs md:text-sm rounded-2xl flex items-center gap-2.5 shadow-xl shadow-teal-500/25 ring-2 ring-emerald-400/40 hover:scale-[1.02] transition-all"
              title="Auditorium Check-In Scanner"
            >
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </div>
              <Printer size={18} />
              <span>🖨️ Desk Kiosk Mode</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/25 text-emerald-100 hidden sm:inline-block">
                Badge Scanner
              </span>
            </button>

            {/* Clean Grouping for Officer Tools: Dean OD Letter, Live Stage Q&A, Multi-Channel Broadcast */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedAttendeeForOD(null)
                  setIsODModalOpen(true)
                }}
                className="px-3.5 py-2.5 bg-surface hover:bg-surface-muted border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                title="Generate Official Dean On-Duty (OD) Attendance Letter for Students"
              >
                <FileText size={15} className="text-emerald-500" />
                <span>Dean OD Letter</span>
              </button>

              <button
                onClick={() => setIsLiveQAModalOpen(true)}
                className="px-3.5 py-2.5 bg-surface hover:bg-surface-muted border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                title="Moderate Live Stage Questions & Launch Stage Projector View"
              >
                <MessageSquare size={15} className="text-indigo-500" />
                <span>Live Stage Q&A</span>
              </button>

              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className="px-3.5 py-2.5 bg-surface hover:bg-surface-muted border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                title="Broadcast urgent notification to all registered attendees"
              >
                <Megaphone size={15} className="text-amber-500" />
                <span>Broadcast</span>
              </button>

              <button
                onClick={() => setIsScannerModalOpen(true)}
                className="px-3.5 py-2.5 bg-surface hover:bg-surface-muted border border-primary/30 text-text rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                title="Open Gate Barcode & QR Camera Scanner"
              >
                <QrCode size={15} className="text-primary" />
                <span>Gate Scanner</span>
              </button>

              <button
                onClick={handleExportAttendeesCSV}
                disabled={exportingAttendees}
                className="px-3.5 py-2.5 bg-surface hover:bg-surface-muted border border-border text-text-secondary hover:text-text rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                title="Download official roster for college faculty / attendance records"
              >
                <FileSpreadsheet size={15} className="text-emerald-500" />
                <span>{exportingAttendees ? 'Exporting...' : 'Export CSV'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PINNED BROADCAST BULLETINS */}
      {broadcasts.length > 0 && (
        <div className="space-y-3">
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

      {/* MAIN EVENT HEADER CARD */}
      <div className="bg-white dark:bg-surface rounded-3xl border border-border overflow-hidden shadow-sm">
        {/* Banner with Ambient Club Color Gradient */}
        <div className="h-44 md:h-52 relative" style={{ background: `linear-gradient(135deg, ${club?.color || '#6c5ce7'}25 0%, #0F172A 100%)` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-4 right-4 flex flex-wrap gap-2">
            {eventPrice > 0 ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-md flex items-center gap-1">
                <span>₹{eventPrice} Entry (Free for Members)</span>
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600 text-white shadow-md">
                FREE ENTRY
              </span>
            )}
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/90 dark:bg-surface/90 backdrop-blur text-text shadow-sm">
              {event.category || 'Workshop'}
            </span>
            {event.is_team_event && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-600 text-white shadow-md">
                Hackathon Squad (2-4)
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 pb-6 pt-5">
          {/* Club Pill & Payment Features */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <Link
              to={`/clubs/${club?.id}`}
              className="text-xs font-extrabold px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
              style={{ background: `${club?.color || '#6c5ce7'}20`, color: club?.color || '#6c5ce7' }}
            >
              🏛️ {club?.name || 'PICT Student Society'}
            </Link>
            {eventPrice > 0 && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Sparkles size={12} /> YouPI Zero-Fee Gateway
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black mb-4 text-text tracking-tight">{event.title}</h1>

          {/* POLISHED METADATA PILL BADGES ROW */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            {/* Date/Time Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-dim border border-border text-xs font-semibold text-text shadow-sm">
              <Calendar size={14} className="text-primary" />
              <span>{new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-text-secondary font-mono">• {event.time || '10:00 AM'}</span>
            </div>

            {/* Venue Pill with Map Icon & Interactive Guide Link */}
            <button
              type="button"
              onClick={() => setIsVenueModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30 text-xs font-bold transition-all shadow-sm"
              title="Open Interactive Campus Map & Venue Directions"
            >
              <MapPin size={14} className="text-sky-600 dark:text-sky-400" />
              <span>{event.location || 'Campus Auditorium'}</span>
              <span className="text-[10px] bg-sky-500/20 px-1.5 py-0.2 rounded font-black uppercase tracking-wider ml-0.5">Map</span>
            </button>

            {/* AICTE Activity Points Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-extrabold shadow-sm">
              <span>🎯 {activityPoints} AICTE Activity Points</span>
            </div>

            {/* Registration Fee Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold shadow-sm">
              <IndianRupee size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>{eventPrice > 0 ? `₹${eventPrice} (Free for Members)` : 'FREE ENTRY'}</span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
            <div className="flex items-center gap-3 p-3.5 bg-surface-dim rounded-2xl border border-border">
              <Calendar size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-text-secondary">Scheduled Date</div>
                <div className="text-sm font-bold text-text">
                  {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-surface-dim rounded-2xl border border-border">
              <Clock size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-text-secondary">Event Timing</div>
                <div className="text-sm font-bold text-text">{event.time || '10:00 AM IST'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-surface-dim rounded-2xl border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <MapPin size={18} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-text-secondary">Venue / Hall</div>
                  <div className="text-sm font-bold text-text truncate">{event.location || 'PICT Auditorium'}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-surface-dim rounded-2xl border border-border">
              <Users size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-text-secondary">Auditorium Turnout</div>
                <div className="text-sm font-bold text-text">{attendeesCount} / {maxAttendees} Seats</div>
              </div>
            </div>
          </div>

          {/* Event Description */}
          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">{event.description}</p>
          </div>

          {/* LIVE ATTENDANCE TURNOUT BAR WITH PROGRESS & PERCENTAGE */}
          <div className="p-4 rounded-2xl bg-surface-dim border border-border mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-2.5">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <span className="font-extrabold text-text text-sm">
                  {attendeesCount} / {maxAttendees} Registered Students
                </span>
                <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {fillPercent.toFixed(0)}% Capacity Reached
                </span>
              </div>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                spotsLeft <= 5 
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              }`}>
                {spotsLeft === 0 ? 'Capacity Full • Waitlist Open' : `${spotsLeft} spots available`}
              </span>
            </div>

            {/* Animated Percentage Fill Bar */}
            <div className="w-full h-3 bg-surface-muted rounded-full overflow-hidden p-0.5 border border-border/40">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${fillPercent}%` }} 
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

          {/* ATTENDEE PRIMARY ACTION ROW */}
          <div className="flex flex-wrap gap-2.5 items-center pt-2">
            <button
              onClick={handleRsvpClick}
              className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-md ${
                isRSVPed
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
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

            {/* View Digital Ticket Pass (Rotating QR) */}
            {isRSVPed && (
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="px-4 py-3 rounded-2xl font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Ticket size={16} />
                <span>View Event Pass (Rotating QR)</span>
              </button>
            )}

            {/* View Certificate of Participation if Checked-In */}
            {isRSVPed && eventMember?.checked_in && (
              <button
                onClick={() => setIsCertificateModalOpen(true)}
                className="px-4 py-3 rounded-2xl font-bold text-xs bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Award size={16} className="text-amber-600" />
                <span>Certificate of Participation</span>
              </button>
            )}

            {/* View On-Duty (OD) Leave Letter if Checked-In */}
            {isRSVPed && eventMember?.checked_in && (
              <button
                onClick={() => {
                  setSelectedAttendeeForOD(null)
                  setIsODModalOpen(true)
                }}
                className="px-4 py-3 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <FileText size={16} className="text-emerald-600" />
                <span>Duty Leave (OD) Letter</span>
              </button>
            )}

            {/* View E-Receipt */}
            {isRSVPed && userPayment && (
              <button
                onClick={() => setIsReceiptModalOpen(true)}
                className="px-4 py-3 rounded-2xl font-semibold text-xs border border-border bg-surface-dim hover:bg-surface-muted transition-colors flex items-center gap-1.5 text-text"
              >
                <Receipt size={16} className="text-emerald-600" />
                <span>View Receipt (UTR: {userPayment.utr})</span>
              </button>
            )}

            {/* Ask Event AI Concierge */}
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-4 py-3 rounded-2xl font-bold text-xs bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800 hover:bg-purple-100 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Instant Answers about Venue, Schedule, OD Leave & Squads"
            >
              <Bot size={16} className="text-purple-600" />
              <span>Ask Event AI</span>
            </button>

            {/* Live Audience Q&A */}
            <button
              onClick={() => setIsLiveQAModalOpen(true)}
              className="px-4 py-3 rounded-2xl font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Participate in live questions and upvoting during the event"
            >
              <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Live Q&A</span>
            </button>

            {/* WhatsApp Invite */}
            <button 
              onClick={handleWhatsAppShare}
              className="px-4 py-3 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Share event on WhatsApp class groups"
            >
              <MessageCircle size={16} className="text-emerald-600" />
              <span>WhatsApp Invite</span>
            </button>

            {/* Calendar Sync Options */}
            <div className="flex items-center gap-1.5">
              <a
                href={getGoogleCalendarUrl(event, club)}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-3 rounded-2xl font-semibold text-xs border border-border bg-surface-dim hover:bg-surface-muted transition-colors flex items-center gap-1.5 text-text"
                title="Add to Google Calendar"
              >
                <CalendarPlus size={15} className="text-primary" />
                <span>Google Cal</span>
              </a>
              <button
                onClick={() => downloadICSFile(event, club)}
                className="px-3 py-3 rounded-2xl font-semibold text-xs border border-border bg-surface-dim hover:bg-surface-muted transition-colors flex items-center gap-1 text-text-secondary"
                title="Download iCal / Outlook (.ics)"
              >
                <CalendarDays size={15} />
                <span>.ics</span>
              </button>
            </div>

            <button 
              onClick={handleShare}
              className="px-4 py-3 rounded-2xl font-semibold text-xs border border-border hover:bg-surface-muted transition-colors flex items-center gap-1.5 text-text"
            >
              <Share2 size={15} /> Share
            </button>
          </div>
        </div>
      </div>

      {/* ATTENDEE LIST TABLE SECTION (FOR OFFICERS & ORGANIZERS) */}
      {isOfficer && (
        <div className="bg-white dark:bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Gate Management
                </span>
                <span className="text-xs text-text-secondary">Live Attendee Roster</span>
              </div>
              <h2 className="text-xl font-black text-text mt-0.5">
                Registered Attendees ({attendees.length})
              </h2>
            </div>

            {/* Filter Tabs & Refresh Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-surface-dim p-1 rounded-2xl border border-border">
                <button
                  onClick={() => setAttendeeFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    attendeeFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'
                  }`}
                >
                  All ({attendees.length})
                </button>
                <button
                  onClick={() => setAttendeeFilter('checked_in')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    attendeeFilter === 'checked_in' ? 'bg-emerald-600 text-white shadow-sm' : 'text-text-secondary hover:text-text'
                  }`}
                >
                  Checked In ({checkedInCount})
                </button>
                <button
                  onClick={() => setAttendeeFilter('registered')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    attendeeFilter === 'registered' ? 'bg-gray-700 text-white shadow-sm' : 'text-text-secondary hover:text-text'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
              </div>

              <button
                onClick={fetchAttendees}
                disabled={loadingAttendees}
                className="p-2 rounded-xl border border-border bg-surface-dim hover:bg-surface-muted text-text-secondary transition-colors"
                title="Refresh Roster"
              >
                <RefreshCw size={15} className={loadingAttendees ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Search Input Filter */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student PRN / Roll No., Name, or Ticket Code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-dim border border-border text-xs text-text placeholder-text-secondary focus:outline-none focus:border-primary font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-text font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-dim border-b border-border text-text-secondary font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll No / PRN</th>
                  <th className="py-3 px-4">Class & Branch</th>
                  <th className="py-3 px-4">Ticket Pass</th>
                  <th className="py-3 px-4">Check-In Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary">
                      {loadingAttendees ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={16} className="animate-spin text-primary" />
                          <span>Loading attendance records...</span>
                        </div>
                      ) : searchQuery ? (
                        <div>
                          <p className="font-semibold text-text">No attendees found matching "{searchQuery}"</p>
                          <p className="text-xs text-text-secondary mt-1">Try searching by PRN (e.g. C2K23) or student name.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-text">No attendees registered yet</p>
                          <p className="text-xs text-text-secondary mt-1">Attendees will appear here once they register or check in at the desk kiosk.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map(att => (
                    <tr key={att.id} className="hover:bg-surface-dim/60 transition-colors">
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-text">{att.user_name}</div>
                        <div className="text-[11px] text-text-secondary font-mono">{att.user_email}</div>
                      </td>

                      {/* College PRN */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-surface-muted text-text text-[11px]">
                          {att.college_id || 'PRN Verified'}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-4 text-text-secondary">
                        <div className="truncate max-w-[150px]">{att.branch || 'Engineering'}</div>
                      </td>

                      {/* Ticket Code */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleCopy(att.ticket_code, att.id)}
                          className="font-mono font-extrabold text-primary hover:underline flex items-center gap-1 group"
                          title="Click to copy ticket code"
                        >
                          <span>{att.ticket_code}</span>
                          {copiedCode === att.id ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} className="text-text-secondary group-hover:text-primary" />
                          )}
                        </button>
                      </td>

                      {/* Check-In Status Badge with Green Pulse Dot */}
                      <td className="py-3 px-4">
                        {att.checked_in ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>Checked-In</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-muted text-text-secondary border border-border">
                            Registered
                          </span>
                        )}
                        {att.checked_in_at && (
                          <div className="text-[10px] text-text-secondary mt-0.5 font-mono">
                            {new Date(att.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!att.checked_in && (
                            <button
                              onClick={() => handleQuickCheckIn(att)}
                              disabled={checkingInId === att.id}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-sm disabled:opacity-40"
                              title="Mark Student Checked In"
                            >
                              {checkingInId === att.id ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <CheckCircle size={12} />
                              )}
                              <span>Check In</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedAttendeeForOD(att)
                              setIsODModalOpen(true)
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-border bg-surface-dim hover:bg-surface-muted text-text font-bold text-xs flex items-center gap-1 transition-colors"
                            title="Generate Official Dean OD Letter for this attendee"
                          >
                            <FileText size={12} className="text-emerald-500" />
                            <span>OD Letter</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Event Digital Ticket Pass (Rotating QR) Modal */}
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
        onClose={() => {
          setIsODModalOpen(false)
          setSelectedAttendeeForOD(null)
        }}
        event={event}
        club={club}
        user={selectedAttendeeForOD ? {
          id: selectedAttendeeForOD.user_id,
          name: selectedAttendeeForOD.user_name,
          full_name: selectedAttendeeForOD.user_name,
          email: selectedAttendeeForOD.user_email,
          college_id: selectedAttendeeForOD.college_id,
          branch: selectedAttendeeForOD.branch
        } : currentUser}
        eventMember={selectedAttendeeForOD || eventMember}
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
