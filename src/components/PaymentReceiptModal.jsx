import React from 'react'
import { X, Printer, CheckCircle, ShieldCheck, Download, Sparkles, Building2, Calendar, User, Mail, Hash } from 'lucide-react'

export default function PaymentReceiptModal({ isOpen, onClose, payment, event, club, user }) {
  if (!isOpen || !payment) return null

  const handlePrint = () => {
    window.print()
  }

  const receiptDate = payment.verified_at 
    ? new Date(payment.verified_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date(payment.created_at || Date.now()).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })

  const receiptNo = `CS-REC-${(payment.ref_id || payment.id || '0000').slice(-8).toUpperCase()}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-6 text-white flex justify-between items-start print:hidden">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-100">
              <ShieldCheck size={16} />
              <span>Verified Payment Acknowledgement</span>
            </div>
            <h3 className="text-xl font-bold mt-1 text-white">E-Receipt & Tax Invoice</h3>
            <p className="text-xs text-white/80 mt-0.5">ClubSync Collegiate Transaction Record</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 md:p-8 space-y-6 text-text" id="printable-receipt">
          {/* Institutional Header */}
          <div className="text-center border-b border-border pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 mb-2">
              <Building2 size={24} />
            </div>
            <h2 className="text-base font-black uppercase tracking-wide text-text">
              Pune Institute of Computer Technology
            </h2>
            <p className="text-xs text-text-secondary font-medium mt-0.5">
              {club?.name || 'College Student Council'} • Student Gymkhana
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <CheckCircle size={14} />
              <span>PAYMENT STATUS: CONFIRMED & RECONCILED</span>
            </div>
          </div>

          {/* Receipt Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-surface-dim rounded-2xl border border-border text-xs">
            <div>
              <span className="text-text-secondary block text-[11px]">Receipt Number</span>
              <span className="font-mono font-bold text-text">{receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-text-secondary block text-[11px]">Date & Time</span>
              <span className="font-medium text-text">{receiptDate}</span>
            </div>
            <div>
              <span className="text-text-secondary block text-[11px]">System Reference ID</span>
              <span className="font-mono font-bold text-primary">{payment.ref_id}</span>
            </div>
            <div className="text-right">
              <span className="text-text-secondary block text-[11px]">Payment Mode</span>
              <span className="font-semibold text-text">UPI Direct (YouPI Zero-Fee)</span>
            </div>
          </div>

          {/* Student & Event Information */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary flex items-center gap-1.5">
                <User size={14} /> Student / Payer:
              </span>
              <span className="font-semibold text-text">
                {user?.name || user?.full_name || payment.user_name || 'Registered Student'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Mail size={14} /> Registered Email:
              </span>
              <span className="font-medium text-text">
                {user?.email || payment.user_email || 'student@pict.edu'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Club / Organization:</span>
              <span className="font-medium text-text">{club?.name || payment.club_name}</span>
            </div>
            {event && (
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-secondary">Event / Activity:</span>
                <span className="font-semibold text-primary">{event.title}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary">Receiving VPA (UPI ID):</span>
              <span className="font-mono font-bold text-text">{payment.vpa || club?.upi_vpa || 'vedant1442@fam'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Hash size={14} /> Bank UTR Reference:
              </span>
              <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                {payment.utr || 'N/A'}
              </span>
            </div>
          </div>

          {/* Fee Breakdown Table */}
          <div className="p-4 bg-surface-dim rounded-2xl border border-border space-y-2">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Registration / Dues Amount:</span>
              <span className="font-semibold text-text">₹{Number(payment.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>YouPI Gateway Platform Fee:</span>
              <span className="font-semibold text-emerald-600">₹0.00 (Zero Fee)</span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>College Surcharge:</span>
              <span className="font-semibold text-text">₹0.00</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-center text-sm font-black text-text">
              <span>Total Amount Paid (INR):</span>
              <span className="text-lg text-emerald-600">₹{Number(payment.amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-[10px] text-text-secondary text-center space-y-1 pt-1">
            <p>This is a computer-generated official receipt issued by ClubSync & PICT Student Council.</p>
            <p className="font-mono text-[9px] text-text-secondary/70">NPCI-UPI Verified • UTR {payment.utr} • Ref {payment.ref_id}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 border border-border rounded-xl text-xs font-semibold hover:bg-surface-dim transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
