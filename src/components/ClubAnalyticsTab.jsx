import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  IndianRupee, 
  GraduationCap, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  FileSpreadsheet, 
  Sparkles,
  PieChart,
  Percent,
  Clock,
  ArrowUpRight,
  Filter
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const BRANCH_COLORS = {
  'Computer Engineering': '#6366f1',
  'Information Technology': '#06b6d4',
  'EnTC Engineering': '#f59e0b',
  'AI & Data Science': '#8b5cf6',
  'First Year Engineering': '#10b981',
  'Other': '#64748b'
}

const YEAR_COLORS = {
  'First Year (FE)': '#10b981',
  'Second Year (SE)': '#06b6d4',
  'Third Year (TE)': '#6366f1',
  'Final Year (BE)': '#f59e0b'
}

export default function ClubAnalyticsTab({ club, isOfficer }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (!club?.id) return
    setLoading(true)
    fetch(`${API_URL}/api/clubs/${club.id}/analytics`)
      .then(res => res.json())
      .then(resData => {
        setData(resData)
      })
      .catch(err => {
        console.error('Error fetching club analytics:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [club?.id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <p className="text-xs text-text-secondary">Crunching real-time attendance and demographic data...</p>
      </div>
    )
  }

  if (!data || !data.summary) {
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-2xl">
        <p className="text-sm text-text-secondary">No analytics records available yet for this club.</p>
      </div>
    )
  }

  const { summary, branchDistribution, yearDistribution, events, attendees, treasurySummary } = data

  // Filter attendees
  const filteredAttendees = attendees.filter(a => {
    const matchesSearch = 
      (a.full_name || '').toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      (a.college_id || '').toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      (a.branch || '').toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      (a.ticket_code || '').toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      (a.event_title || '').toLowerCase().includes(attendeeSearch.toLowerCase())

    if (statusFilter === 'checked_in') return matchesSearch && a.checked_in
    if (statusFilter === 'not_checked_in') return matchesSearch && !a.checked_in
    return matchesSearch
  })

  // Export full CSV Report
  const handleExportCSV = () => {
    const headers = [
      'Student Name',
      'PRN / Roll No',
      'Engineering Branch',
      'Event Title',
      'Ticket Code',
      'Checked In Status',
      'Check-in Timestamp',
      'Paid Amount (INR)',
      'Payment UTR'
    ]

    const rows = attendees.map(a => [
      `"${a.full_name || 'Student'}"`,
      `"${a.college_id || 'N/A'}"`,
      `"${a.branch || 'N/A'}"`,
      `"${a.event_title || 'N/A'}"`,
      `"${a.ticket_code || 'N/A'}"`,
      a.checked_in ? 'CHECKED-IN' : 'REGISTERED (ABSENT)',
      a.checked_in_at ? `"${new Date(a.checked_in_at).toLocaleString()}"` : 'N/A',
      a.paid_amount || '0',
      `"${a.payment_utr || 'N/A'}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${club.name.replace(/\s+/g, '_')}_Executive_Turnout_Report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-8 print:p-0">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/10 via-surface to-surface border border-border rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/20 text-primary">
              Executive Analytics & Demographics
            </span>
            <span className="text-xs text-text-secondary">Official PICT Pune Activity Audit</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-text mt-1 flex items-center gap-2">
            <BarChart3 className="text-primary" size={24} />
            {club.name} • Performance Dashboard
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-xl">
            Live turnouts, department diversity, revenue collections, and AICTE 100 activity point distributions across hosted events.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 print:hidden">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-semibold hover:border-primary/50 text-text transition-colors shadow-sm"
            title="Download full attendee list as CSV spreadsheet"
          >
            <Download size={15} className="text-emerald-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors shadow-sm"
            title="Print executive briefing sheet"
          >
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Hero Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Turnout Rate */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-text-secondary text-xs mb-2">
            <span>Turnout Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Percent size={16} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-text">
            {summary.overallTurnoutRate}%
          </div>
          <div className="text-xs text-text-secondary mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{summary.totalCheckins}</span> of {summary.totalRegistrations} verified
          </div>
          <div className="w-full h-1.5 bg-surface-dim rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(summary.overallTurnoutRate, 100)}%` }} 
            />
          </div>
        </div>

        {/* Total Registrations */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary text-xs mb-2">
            <span>Student Reach</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-text">
            {summary.totalRegistrations}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Across <span className="font-semibold text-text">{summary.totalEvents}</span> events hosted
          </div>
          <div className="text-[10px] text-sky-600 font-semibold mt-2.5 flex items-center gap-1">
            <TrendingUp size={12} /> {summary.activeMembers} enrolled members
          </div>
        </div>

        {/* AICTE Points Conferred */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary text-xs mb-2">
            <span>AICTE 100 Points</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-amber-500">
            {summary.totalAICTEPoints} <span className="text-sm font-semibold text-text-secondary">pts</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Certified activity credits conferred
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-2.5 flex items-center gap-1">
            <Sparkles size={12} /> Official PICT Portfolio Credits
          </div>
        </div>

        {/* YouPI Payments Revenue */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary text-xs mb-2">
            <span>Ticket Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-text">
            ₹{summary.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Direct Zero-Fee YouPI Payments
          </div>
          <div className="text-[10px] text-indigo-500 font-semibold mt-2.5 flex items-center gap-1">
            <CheckCircle2 size={12} /> Verified via Bank UTR
          </div>
        </div>
      </div>

      {/* Demographics Distributions: Branch & Academic Year */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Engineering Branch Breakdown */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-text flex items-center gap-2">
                <PieChart size={18} className="text-primary" />
                Engineering Department Representation
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">Attendee distribution across PICT degree programs</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {branchDistribution.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-6">No branch demographic data recorded yet.</p>
            ) : (
              branchDistribution.map((b) => {
                const color = BRANCH_COLORS[b.branch] || '#6366f1'
                return (
                  <div key={b.branch} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-text flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                        {b.branch}
                      </span>
                      <span className="text-text-secondary font-semibold">
                        {b.count} students ({b.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-dim rounded-full overflow-hidden border border-border/40">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(b.percentage, 4)}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Academic Year of Study Breakdown */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-text flex items-center gap-2">
                <GraduationCap size={18} className="text-primary" />
                Student Year of Study
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">Undergraduate cohort distribution (FE to BE)</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {yearDistribution.map((y) => {
              const color = YEAR_COLORS[y.year] || '#6366f1'
              return (
                <div key={y.year} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      {y.year}
                    </span>
                    <span className="text-text-secondary font-semibold">
                      {y.count} students ({y.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-dim rounded-full overflow-hidden border border-border/40">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(y.percentage, y.count > 0 ? 5 : 0)}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Events Performance Breakdown Table */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-text flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Event-by-Event Performance Audit
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Turnout efficiency and revenue breakdown per scheduled event</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-dim border border-border text-text-secondary">
            {events.length} Events Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-dim/60 border-b border-border text-text-secondary uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">Event Title</th>
                <th className="py-3.5 px-4 font-bold">Date & Time</th>
                <th className="py-3.5 px-4 font-bold">Capacity / Registered</th>
                <th className="py-3.5 px-4 font-bold">Verified Attendance</th>
                <th className="py-3.5 px-4 font-bold">Turnout %</th>
                <th className="py-3.5 px-4 font-bold">YouPI Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-surface-dim/40 transition-colors">
                  <td className="py-4 px-4 font-semibold text-text max-w-xs truncate">
                    {evt.title}
                  </td>
                  <td className="py-4 px-4 text-text-secondary whitespace-nowrap">
                    {new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="block text-[10px] text-text-secondary/80">{evt.time || '10:00 AM'}</span>
                  </td>
                  <td className="py-4 px-4 text-text whitespace-nowrap">
                    <span className="font-bold">{evt.registrationsCount}</span> / {evt.max_attendees || 100}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} /> {evt.checkinsCount} checked in
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-dim rounded-full overflow-hidden border border-border/40">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${evt.turnoutRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-text">{evt.turnoutRate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-text whitespace-nowrap">
                    {evt.price > 0 ? (
                      <span className="text-emerald-600">₹{evt.revenue.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-text-secondary">Free Event</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified Student Attendee Roster */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-text flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-primary" />
              Verified Student Attendee Directory
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Search and audit student check-ins, PRNs, and payment UTRs</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search PRN, name, branch..."
                value={attendeeSearch}
                onChange={e => setAttendeeSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-border bg-surface-dim text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary w-48 md:w-60"
              />
            </div>

            {/* Filter Toggle */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-surface-dim text-xs text-text focus:outline-none"
            >
              <option value="all">All Attendees</option>
              <option value="checked_in">Checked In Only</option>
              <option value="not_checked_in">Pending Check-in</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-surface-dim border-b border-border z-10">
              <tr className="text-text-secondary uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Student Name</th>
                <th className="py-3 px-4 font-bold">PICT PRN</th>
                <th className="py-3 px-4 font-bold">Department / Branch</th>
                <th className="py-3 px-4 font-bold">Event</th>
                <th className="py-3 px-4 font-bold">Ticket Code</th>
                <th className="py-3 px-4 font-bold">Door Status</th>
                <th className="py-3 px-4 font-bold">Payment UTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-secondary text-xs">
                    No attendee records match the search filter.
                  </td>
                </tr>
              ) : (
                filteredAttendees.map((att, i) => (
                  <tr key={i} className="hover:bg-surface-dim/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text whitespace-nowrap">
                      {att.full_name || 'Student'}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-primary whitespace-nowrap">
                      {att.college_id || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {att.branch || 'Computer Engineering'}
                    </td>
                    <td className="py-3 px-4 text-text whitespace-nowrap max-w-xs truncate">
                      {att.event_title}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary whitespace-nowrap">
                      {att.ticket_code || 'TKT-PENDING'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {att.checked_in ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px] border border-emerald-500/20">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary font-medium text-[10px]">
                          Registered
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-text-secondary whitespace-nowrap">
                      {att.payment_utr || 'Free RSVP'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
