import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Printer, Award, ShieldCheck, Download, Sparkles, Building2, CheckCircle } from 'lucide-react'

export default function EventCertificateModal({ isOpen, onClose, event, club, user, eventMember }) {
  if (!isOpen || !event) return null

  const certId = eventMember?.certificate_id || `CERT-2026-${(event.id || 'EV').slice(0, 6).toUpperCase()}`
  const attendeeName = user?.name || user?.full_name || 'Participating Student'
  const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const verificationUrl = `${window.location.origin}/verify/${certId}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in print:p-0 print:bg-white overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-white text-gray-900 border-4 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-full my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Controls Toolbar (Hidden on Print) */}
        <div className="bg-gray-900 px-6 py-3 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Award size={16} />
            <span>Collegiate Certificate of Participation</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Paper */}
        <div className="p-8 md:p-12 relative bg-[#fcfbfa] border-[12px] border-double border-amber-900/20 m-2 md:m-4 rounded-2xl shadow-inner font-serif text-center">
          {/* Corner Flourishes */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-700/60" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-700/60" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-700/60" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-700/60" />

          {/* Institutional Crest & Seal */}
          <div className="flex items-center justify-center gap-2 mb-2 font-sans">
            <Building2 size={24} className="text-amber-800" />
            <span className="text-xs uppercase tracking-widest text-amber-900 font-extrabold">
              Pune Institute of Computer Technology
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-wide uppercase text-amber-950 mb-1">
            Certificate of Participation
          </h1>
          <p className="text-xs uppercase tracking-widest text-amber-800/80 mb-6 font-sans font-semibold">
            Issued by {club?.name || 'Technical Student Council'} • Student Gymkhana
          </p>

          <p className="text-xs text-gray-600 italic mb-2">This is to proudly certify that</p>

          {/* Student Name & Academic Details */}
          <div className="my-3 pb-2 border-b-2 border-amber-900/30 inline-block px-12">
            <span className="text-2xl md:text-3xl font-black text-gray-900 font-serif tracking-wide block">
              {attendeeName}
            </span>
            {(user?.college_id || user?.branch) && (
              <span className="text-xs text-amber-900/80 font-sans font-bold tracking-wider uppercase mt-1 block">
                {user?.college_id ? `PRN: ${user.college_id}` : ''} {user?.branch ? `• ${user.branch}` : ''}
              </span>
            )}
          </div>

          <p className="text-xs md:text-sm text-gray-700 max-w-lg mx-auto leading-relaxed mt-2 font-sans">
            has successfully attended and actively participated in the collegiate technical event <br />
            <strong className="text-base text-gray-950 font-serif font-bold">"{event.title}"</strong> <br />
            conducted on <span className="font-semibold text-gray-900">{eventDate}</span> at {event.location || 'PICT Pune'}.
          </p>

          {/* Signatures & Seal Section */}
          <div className="mt-10 pt-6 grid grid-cols-3 items-end font-sans text-xs">
            {/* Signature 1 */}
            <div className="text-center">
              <div className="font-serif italic text-lg text-indigo-900 font-semibold mb-1">
                Aditya Deshmukh
              </div>
              <div className="w-28 h-0.5 bg-gray-400 mx-auto mb-1" />
              <span className="block font-bold text-gray-800 text-[11px]">Club President</span>
              <span className="block text-[10px] text-gray-500">{club?.name || 'PICT Robocon'}</span>
            </div>

            {/* Official Gold Seal Badge */}
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-white shadow-md flex items-center justify-center p-2 border-2 border-white">
                <div className="border border-white/60 rounded-full w-full h-full flex flex-col items-center justify-center">
                  <ShieldCheck size={18} />
                  <span className="text-[7px] font-black uppercase tracking-tighter">Verified</span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-gray-500 mt-2 block font-semibold">
                ID: {certId}
              </span>
            </div>

            {/* Signature 2 / QR Verification */}
            <div className="text-center flex flex-col items-center">
              <div className="p-1.5 bg-white border border-gray-300 rounded-lg shadow-sm mb-1 inline-block">
                <QRCodeSVG value={verificationUrl} size={50} level="M" />
              </div>
              <span className="block text-[9px] text-gray-500 font-mono">Scan to Verify</span>
              <span className="block font-bold text-gray-800 text-[11px]">Faculty Coordinator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
