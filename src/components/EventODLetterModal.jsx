import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Printer, FileText, CheckCircle, ShieldCheck, Building2, Calendar, Clock, MapPin } from 'lucide-react'

export default function EventODLetterModal({ isOpen, onClose, event, club, user, eventMember }) {
  if (!isOpen || !event) return null

  const refNumber = `PICT/OD/2026/${(event.id || 'EV').slice(0, 6).toUpperCase()}`
  const attendeeName = user?.name || user?.full_name || 'Participating Student'
  const collegeId = user?.college_id || 'PRN: C2K221142'
  const branch = user?.branch || 'Computer Engineering'
  const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const checkInTime = eventMember?.checked_in_at 
    ? new Date(eventMember.checked_in_at).toLocaleString('en-IN')
    : `${eventDate}, ${event.time || '10:00 AM'}`

  const verificationUrl = `${window.location.origin}/verify/${refNumber.replace(/\//g, '-')}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in print:p-0 print:bg-white overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-white text-gray-900 border border-gray-300 rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-full my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Controls Toolbar (Hidden on Print) */}
        <div className="bg-gray-900 px-6 py-3 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <FileText size={16} />
            <span>Official On-Duty (OD / DL) Attendance Letter</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer size={13} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Official Letterhead Paper */}
        <div className="p-8 md:p-12 bg-white text-gray-900 text-sm font-sans space-y-6">
          {/* Institutional Header */}
          <div className="text-center pb-5 border-b-2 border-gray-800 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Building2 size={24} className="text-blue-900" />
              <h1 className="text-lg md:text-xl font-black uppercase tracking-wide text-blue-950 font-serif">
                Society for Computer Technology & Research
              </h1>
            </div>
            <h2 className="text-base md:text-lg font-bold text-gray-900">
              Pune Institute of Computer Technology (PICT), Pune
            </h2>
            <p className="text-[11px] text-gray-600">
              Affiliated to Savitribai Phule Pune University (SPPU) • Approved by AICTE • Accredited by NBA & NAAC
            </p>
            <p className="text-[11px] font-semibold text-blue-900">
              Student Gymkhana & Technical Activities Council • {club?.name || 'Technical Student Chapter'}
            </p>
          </div>

          {/* Reference & Date Meta */}
          <div className="flex justify-between items-center text-xs text-gray-700">
            <div>
              <span className="font-bold text-gray-900">Ref. No: </span>
              <span className="font-mono font-semibold">{refNumber}</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">Date: </span>
              <span>{issueDate}</span>
            </div>
          </div>

          {/* Recipient Address */}
          <div className="text-xs space-y-0.5 text-gray-900">
            <p className="font-bold">To,</p>
            <p className="font-semibold">The Head of Department,</p>
            <p>Department of {branch},</p>
            <p>Pune Institute of Computer Technology,</p>
            <p>Dhankawadi, Pune - 411043</p>
          </div>

          {/* Subject Line */}
          <div className="p-2.5 bg-gray-100 rounded-lg border border-gray-300 text-xs font-bold text-gray-950 text-center">
            Subject: Recommendation for Grant of On-Duty (OD / DL) Attendance Leave
          </div>

          {/* Formal Body Paragraphs */}
          <div className="space-y-3 text-xs leading-relaxed text-gray-800">
            <p>Respected Sir / Madam,</p>

            <p>
              This is to certify that <strong>{attendeeName}</strong>, bonafide student of <strong>{branch}</strong> bearing Roll No / PRN <strong>{collegeId}</strong>, has actively attended and officially participated in the collegiate technical event:
            </p>

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
              <div className="font-bold text-sm text-blue-950 font-serif">
                "{event.title}"
              </div>
              <div className="text-[11px] text-gray-700 flex flex-wrap gap-4 pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar size={12} className="text-blue-800" /> {eventDate}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock size={12} className="text-blue-800" /> {event.time || '10:00 AM - 5:00 PM'}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <MapPin size={12} className="text-blue-800" /> {event.location || 'PICT Campus Labs'}
                </span>
              </div>
            </div>

            <p>
              The candidate's physical venue attendance and registration was verified through the ClubSync Digital Gate Scanner system on <strong>{checkInTime}</strong> with Pass Token <code>{eventMember?.ticket_code || 'VERIFIED'}</code>.
            </p>

            <p>
              In accordance with college technical activity council norms and university extracurricular guidelines, it is respectfully requested that the student be granted official <strong>On-Duty (OD) attendance credit</strong> for the academic lectures/practical sessions conducted during the aforementioned event schedule.
            </p>

            <p>Thanking you,</p>
          </div>

          {/* Verification Badge & Signatures */}
          <div className="pt-6 border-t border-gray-300 grid grid-cols-3 items-end text-xs">
            {/* Student Chapter Convener */}
            <div className="text-center space-y-1">
              <div className="font-serif italic font-bold text-indigo-950 text-sm">
                Aditya Deshmukh
              </div>
              <div className="text-[10px] font-bold text-gray-900 uppercase">
                Student Convener / President
              </div>
              <div className="text-[10px] text-gray-600">
                {club?.name || 'PICT Technical Chapter'}
              </div>
            </div>

            {/* Central Official Digital Verification Stamp */}
            <div className="text-center flex flex-col items-center">
              <div className="p-1.5 bg-white border border-gray-300 rounded-lg shadow-sm mb-1 inline-block">
                <QRCodeSVG value={verificationUrl} size={64} level="M" />
              </div>
              <span className="text-[9px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck size={11} /> Digitally Verified
              </span>
            </div>

            {/* Faculty Incharge / Sponsor */}
            <div className="text-center space-y-1">
              <div className="font-serif italic font-bold text-indigo-950 text-sm">
                Dr. P. S. Patil
              </div>
              <div className="text-[10px] font-bold text-gray-900 uppercase">
                Faculty Advisor
              </div>
              <div className="text-[10px] text-gray-600">
                Technical Activities Council, PICT
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
