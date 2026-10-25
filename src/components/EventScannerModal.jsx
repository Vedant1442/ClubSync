import React, { useState, useEffect } from 'react'
import { X, QrCode, CheckCircle, Search, RefreshCw, Users, AlertCircle, ShieldCheck, Volume2, Sparkles, Download, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useClubSync } from '../context/ClubSyncContext'

// Synthesizer chime for check-in feedback
function playSuccessBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08) // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch (e) {
    // Audio context may require user interaction
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EventScannerModal({ isOpen, onClose, event, club, onOpenKiosk }) {
  const { refreshData } = useClubSync()

  const [ticketInput, setTicketInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attendees, setAttendees] = useState([])
  const [fetchingAttendees, setFetchingAttendees] = useState(false)
  const [lastCheckIn, setLastCheckIn] = useState(null)
  const [search, setSearch] = useState('')

  const fetchAttendees = async () => {
    if (!event) return
    try {
      setFetchingAttendees(true)
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
    } finally {
      setFetchingAttendees(false)
    }
  }

  useEffect(() => {
    if (isOpen && event) {
      setTicketInput('')
      setLastCheckIn(null)
      fetchAttendees()
    }
  }, [isOpen, event?.id])

  const handleCheckIn = async (codeToUse) => {
    const code = (codeToUse || ticketInput).trim().toUpperCase()
    if (!code) {
      toast.error('Please enter a ticket code')
      return
    }

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
        throw new Error(data.error || 'Failed to check-in')
      }

      playSuccessBeep()
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }

      if (data.already_checked_in) {
        toast.info(data.message)
      } else {
        toast.success(data.message)
      }

      setLastCheckIn(data.attendee)
      setTicketInput('')
      fetchAttendees()
      refreshData()
    } catch (err) {
      toast.error(err.message || 'Check-in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (attendees.length === 0) {
      toast.info('No attendees to export.')
      return
    }
    const headers = ['Name', 'Roll No / PRN', 'Branch / Class', 'Email', 'Check-In Status', 'Check-In Time', 'Ticket Code', 'Certificate ID', 'Payment Status', 'Fee Paid (INR)', 'Payment UTR']
    const rows = attendees.map(a => [
      `"${(a.user_name || '').replace(/"/g, '""')}"`,
      `"${a.college_id || 'N/A'}"`,
      `"${(a.branch || 'N/A').replace(/"/g, '""')}"`,
      `"${(a.user_email || a.email || '').replace(/"/g, '""')}"`,
      a.checked_in ? 'Checked In' : 'Registered / Absent',
      a.checked_in_at ? `"${new Date(a.checked_in_at).toLocaleString('en-IN')}"` : 'N/A',
      `"${a.ticket_code || ''}"`,
      `"${a.certificate_id || ''}"`,
      `"${a.payment_status || 'Verified'}"`,
      a.payment_amount || 0,
      `"${a.payment_utr || 'N/A'}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Gate_Attendance.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Gate attendance CSV exported!')
  }

  if (!isOpen || !event) return null

  const checkedInCount = attendees.filter(a => a.checked_in).length
  const totalCount = attendees.length
  const percent = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0

  const filtered = attendees.filter(a => 
    (a.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.ticket_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-600 via-primary to-blue-600 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
              <QrCode size={16} />
              <span>Gate Check-In & Scanner</span>
            </div>
            <h3 className="text-xl font-bold mt-0.5 text-white">{event.title}</h3>
            <p className="text-xs text-white/80">{club?.name} • Live Venue Access Control</p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenKiosk && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenKiosk()
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Launch Fullscreen Desk Kiosk Mode with Thermal Badge Printer"
              >
                <Printer size={13} />
                <span className="hidden sm:inline">Desk Kiosk Mode</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Real-time Attendance Progress */}
          <div className="p-4 bg-surface-dim rounded-2xl border border-border space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-text flex items-center gap-1.5">
                <Users size={15} className="text-primary" /> Live Venue Attendance
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  title="Download CSV attendance sheet for faculty records"
                >
                  <Download size={13} /> Export CSV
                </button>
                <span className="font-bold text-emerald-600">
                  {checkedInCount} / {totalCount} Checked In ({percent}%)
                </span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Ticket Input Bar */}
          <form 
            onSubmit={e => { e.preventDefault(); handleCheckIn(); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <QrCode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={ticketInput}
                onChange={e => setTicketInput(e.target.value.toUpperCase())}
                placeholder="Scan or Type Ticket Code (e.g. TKT-9X4B)..."
                className="w-full pl-10 pr-4 py-3 bg-surface-dim border border-border rounded-xl font-mono text-sm tracking-wider text-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !ticketInput.trim()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={16} />}
              <span>Verify Entry</span>
            </button>
          </form>

          {/* Last Check-In Banner */}
          {lastCheckIn && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text">{lastCheckIn.user_name}</h4>
                  <p className="text-xs text-text-secondary">
                    Ticket: <span className="font-mono font-bold text-primary">{lastCheckIn.ticket_code}</span> • Checked in at {new Date(lastCheckIn.checked_in_at || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                APPROVED
              </span>
            </div>
          )}

          {/* Attendee Roster & Manual Check-In Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-text uppercase tracking-wider">Registered Attendee List</h4>
              <div className="w-56 relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter attendees..."
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-dim border border-border rounded-lg text-xs text-text placeholder:text-text-secondary/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="border border-border rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-dim text-text-secondary sticky top-0 border-b border-border">
                  <tr>
                    <th className="p-3 font-semibold">Student</th>
                    <th className="p-3 font-semibold">Ticket Code</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length > 0 ? (
                    filtered.map(attendee => (
                      <tr key={attendee.id} className="hover:bg-surface-dim transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-text">{attendee.user_name}</div>
                          <div className="text-[10px] text-text-secondary">{attendee.email || attendee.user_email}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-primary">
                          {attendee.ticket_code || 'TKT-PENDING'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            attendee.checked_in
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {attendee.checked_in ? 'Checked In' : 'Registered'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {attendee.checked_in ? (
                            <span className="text-[10px] text-text-secondary">
                              {attendee.checked_in_at ? new Date(attendee.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(attendee.ticket_code)}
                              className="px-2.5 py-1 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                            >
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-text-secondary text-xs">
                        No attendees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
