import React, { useRef } from 'react'
import { 
  Zap, Award, CheckCircle2, TrendingUp, ShieldCheck, 
  Printer, Building2, Calendar, FileText, ArrowUpRight, GraduationCap
} from 'lucide-react'

export default function AICTEPointsTracker({ currentUser, events, eventMembers, clubs, clubMemberships }) {
  // 1. Calculate checked-in event points
  const attendedEvents = events.filter(e => {
    const em = eventMembers.find(m => String(m.event_id) === String(e.id) && String(m.user_id) === String(currentUser?.id))
    return em?.checked_in
  })

  const eventItems = attendedEvents.map(e => {
    const em = eventMembers.find(m => String(m.event_id) === String(e.id) && String(m.user_id) === String(currentUser?.id))
    const pts = Number(e.activity_points) || 10
    const club = clubs.find(c => String(c.id) === String(e.club_id))
    return {
      id: e.id,
      title: e.title,
      category: e.category || 'Technical',
      organizer: club?.name || 'PICT Student Chapter',
      date: new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      points: pts,
      refId: em?.certificate_id || `CERT-PICT-${e.id.slice(0, 5).toUpperCase()}`,
      type: 'Event Participation'
    }
  })

  // 2. Calculate club leadership points (25 pts per core role)
  const myClubs = clubs.filter(c => clubMemberships.some(m => String(m.club_id) === String(c.id) && String(m.user_id) === String(currentUser?.id)))
  const leadershipItems = myClubs.map(c => {
    const mem = clubMemberships.find(m => String(m.club_id) === String(c.id) && String(m.user_id) === String(currentUser?.id))
    const isLead = ['President', 'Vice President', 'Secretary', 'Treasurer', 'officer', 'Officer', 'Core'].some(r => (mem?.role || '').includes(r))
    const pts = isLead ? 25 : 10
    return {
      id: c.id,
      title: `${c.name} (${mem?.role || 'Member'})`,
      category: 'Club Leadership & Governance',
      organizer: c.name,
      date: 'Academic Year 2025-26',
      points: pts,
      refId: `ROLE-${c.name.slice(0, 4).toUpperCase()}-26`,
      type: 'Leadership & Council'
    }
  })

  const allLedger = [...eventItems, ...leadershipItems]
  const totalPoints = allLedger.reduce((sum, item) => sum + item.points, 0)
  const cappedPoints = Math.min(100, totalPoints)
  const progressPercent = Math.min(100, (cappedPoints / 100) * 100)

  // Level computation
  let tier = { name: 'Bronze Contributor', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  if (totalPoints >= 100) {
    tier = { name: 'Diamond AICTE Laureate (100 Pts Fulfilled)', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
  } else if (totalPoints >= 60) {
    tier = { name: 'Gold Technical Fellow', color: 'text-amber-500', bg: 'bg-amber-500/15', border: 'border-amber-500/30' }
  } else if (totalPoints >= 30) {
    tier = { name: 'Silver Collegiate Achiever', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-primary to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 backdrop-blur-md flex items-center gap-1.5">
                <GraduationCap size={13} />
                <span>AICTE / SPPU Mandatory Degree Requirement</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              100 Activity Points Portfolio
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
              Track official extracurricular credits, hackathon turnouts, and club governance points required for degree graduation.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-white text-gray-950 font-bold text-xs hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-md shrink-0"
          >
            <Printer size={15} />
            <span>Print Academic Dossier</span>
          </button>
        </div>

        {/* Big Meter Bar */}
        <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider block">Total Credits Earned</span>
              <div className="text-4xl font-black text-white flex items-baseline gap-2">
                <span>{totalPoints}</span>
                <span className="text-lg font-medium text-white/70">/ 100 Points</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-primary">
                {tier.name}
              </span>
            </div>
          </div>

          <div className="w-full h-3.5 bg-black/30 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-white/80 pt-1">
            <span>Progress: {progressPercent.toFixed(0)}% Complete</span>
            <span>{totalPoints >= 100 ? '✓ Graduation Requirement Met' : `${100 - totalPoints} Points Remaining`}</span>
          </div>
        </div>
      </div>

      {/* Itemized Points Ledger */}
      <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div>
            <h3 className="font-bold text-base text-text">Itemized Points Ledger</h3>
            <p className="text-xs text-text-secondary">Official breakdown of authenticated campus events and club roles</p>
          </div>
          <span className="text-xs font-mono font-bold text-primary">
            {allLedger.length} Record(s) Authenticated
          </span>
        </div>

        {allLedger.length > 0 ? (
          <div className="divide-y divide-border">
            {allLedger.map(item => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text truncate">{item.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary font-medium shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-1">
                    <span>{item.organizer}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px] font-bold text-primary">{item.refId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-sm">
                    +{item.points} Pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-text-secondary">
            No technical events checked-in yet. Attend club events and get scanned at the entrance gate to automatically log AICTE points!
          </div>
        )}
      </div>

      {/* Official Printable Academic Dossier (Only shows when printing) */}
      <div className="hidden print:block p-8 bg-white text-gray-900 font-sans space-y-6">
        <div className="text-center pb-4 border-b-2 border-gray-900">
          <h1 className="text-xl font-black uppercase text-blue-950 font-serif">Pune Institute of Computer Technology</h1>
          <h2 className="text-sm font-bold text-gray-800">Student Gymkhana • AICTE 100 Activity Points Statement</h2>
          <p className="text-xs text-gray-600 mt-1">
            Candidate: <strong>{currentUser.name}</strong> • PRN: <strong>{currentUser.college_id || 'C2K221142'}</strong> • Dept: <strong>{currentUser.branch || 'Computer Engineering'}</strong>
          </p>
        </div>

        <div className="text-xs flex justify-between font-bold py-2 border-b border-gray-300">
          <span>Total Authenticated Points: {totalPoints} / 100</span>
          <span>Status: {totalPoints >= 100 ? 'FULFILLED' : 'IN PROGRESS'}</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-400 text-gray-700">
              <th className="py-2">Activity / Event Title</th>
              <th className="py-2">Organizer</th>
              <th className="py-2">Credential Ref</th>
              <th className="py-2 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allLedger.map(item => (
              <tr key={item.id}>
                <td className="py-2 font-semibold">{item.title}</td>
                <td className="py-2">{item.organizer}</td>
                <td className="py-2 font-mono text-[10px]">{item.refId}</td>
                <td className="py-2 text-right font-bold">+{item.points}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-12 grid grid-cols-2 text-xs">
          <div className="text-left space-y-1">
            <div className="font-serif italic font-bold">Candidate Signature</div>
            <div className="text-[10px] text-gray-600">{currentUser.name}</div>
          </div>
          <div className="text-right space-y-1">
            <div className="font-serif italic font-bold">Faculty Academic Counselor / HOD</div>
            <div className="text-[10px] text-gray-600">Department of {currentUser.branch || 'Computer Engineering'}, PICT</div>
          </div>
        </div>
      </div>
    </div>
  )
}
