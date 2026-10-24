import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  X, CheckCircle, Copy, Check, ShieldCheck, ArrowRight, 
  ExternalLink, Clock, AlertCircle, RefreshCw, Printer, Sparkles 
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useClubSync } from '../context/ClubSyncContext'

export default function UPIPaymentModal({ 
  isOpen, 
  onClose, 
  club, 
  event, 
  type = 'event_ticket', 
  amount = 150,
  onSuccess 
}) {
  const { createPaymentIntent, submitUtr, currentUser } = useClubSync()

  const [step, setStep] = useState('pay') // 'pay' | 'utr' | 'success'
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [utr, setUtr] = useState('')
  const [copiedVpa, setCopiedVpa] = useState(false)
  const [copiedAmount, setCopiedAmount] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [verifiedPayment, setVerifiedPayment] = useState(null)

  // Initialize Payment Intent on Open
  useEffect(() => {
    if (isOpen && club) {
      setStep('pay')
      setUtr('')
      setTimeLeft(600)
      setVerifiedPayment(null)
      initiatePayment()
    }
  }, [isOpen, club?.id, event?.id])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || step === 'success') return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, step])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const initiatePayment = async () => {
    try {
      setLoading(true)
      const data = await createPaymentIntent({
        club_id: club.id,
        event_id: event?.id || null,
        type,
        amount: Number(amount),
        transaction_note: event ? `${event.title} Registration` : `${club.name} Club Dues`
      })
      setPaymentData(data)
    } catch (err) {
      toast.error(err.message || 'Failed to initialize payment')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'vpa') {
      setCopiedVpa(true)
      setTimeout(() => setCopiedVpa(false), 2000)
    } else {
      setCopiedAmount(true)
      setTimeout(() => setCopiedAmount(false), 2000)
    }
    toast.success('Copied to clipboard!')
  }

  const handleOpenUpiApp = () => {
    if (!paymentData?.upiUri) return
    window.location.href = paymentData.upiUri
  }

  const handleVerifyUtr = async (e) => {
    e.preventDefault()
    const clean = utr.trim().replace(/\s+/g, '')
    if (!/^\d{12}$/.test(clean)) {
      toast.error('Please enter a valid 12-digit numeric UPI reference (UTR)')
      return
    }

    try {
      setLoading(true)
      const result = await submitUtr(paymentData.payment.id, clean)
      setVerifiedPayment(result.payment)
      setStep('success')
      toast.success('Payment verified & registered successfully! 🎉')
      if (onSuccess) onSuccess(result.payment)
    } catch (err) {
      toast.error(err.message || 'Verification failed. Please double-check your UTR.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div 
          className="p-5 text-white relative flex justify-between items-start"
          style={{ 
            background: `linear-gradient(135deg, ${club?.color || '#6c5ce7'} 0%, #0984e3 100%)` 
          }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
              <Sparkles size={14} className="text-yellow-300" />
              <span>YouPI Zero-Fee Gateway</span>
            </div>
            <h3 className="text-xl font-bold mt-1 text-white">
              {event ? event.title : `${club?.name} Dues`}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              Direct settlement to official club account
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'pay' && (
              <motion.div 
                key="pay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Amount & Timer */}
                <div className="flex items-center justify-between p-3.5 bg-surface-dim rounded-2xl border border-border">
                  <div>
                    <span className="text-xs text-text-secondary block">Amount to Pay</span>
                    <span className="text-2xl font-black text-text tracking-tight">₹{amount}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-text-secondary flex items-center gap-1 justify-end">
                      <Clock size={12} /> Time Left
                    </span>
                    <span className={`text-sm font-bold font-mono ${timeLeft < 120 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                      {formatTimer(timeLeft)}
                    </span>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-5 bg-white dark:bg-white rounded-2xl border border-border shadow-inner">
                  {loading || !paymentData ? (
                    <div className="w-52 h-52 flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={28} className="text-primary animate-spin" />
                      <span className="text-xs text-text-secondary">Generating Secure UPI QR...</span>
                    </div>
                  ) : (
                    <div className="relative group">
                      <QRCodeSVG 
                        value={paymentData.upiUri} 
                        size={190}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                          src: "https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg",
                          x: undefined,
                          y: undefined,
                          height: 28,
                          width: 28,
                          excavate: true,
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-[11px] font-medium text-gray-700">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Scan with Google Pay, PhonePe, Paytm, or BHIM</span>
                  </div>
                </div>

                {/* Mobile Intent Launcher */}
                <div className="block sm:hidden">
                  <button
                    onClick={handleOpenUpiApp}
                    className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-primary-dark transition-colors text-sm"
                  >
                    <span>Pay Directly via UPI App</span>
                    <ExternalLink size={16} />
                  </button>
                </div>

                {/* Account VPA details */}
                <div className="p-3 bg-surface-dim rounded-xl border border-border space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Payee UPI ID:</span>
                    <div className="flex items-center gap-1.5 font-mono font-medium">
                      <span>{paymentData?.vpa || club?.upi_vpa || 'vedant1442@fam'}</span>
                      <button 
                        onClick={() => copyToClipboard(paymentData?.vpa || club?.upi_vpa || 'vedant1442@fam', 'vpa')}
                        className="text-primary hover:opacity-80 p-0.5"
                      >
                        {copiedVpa ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Reference No:</span>
                    <span className="font-mono text-text font-semibold">{paymentData?.refId || 'CS-INIT'}</span>
                  </div>
                </div>

                {/* Next Step Button */}
                <button
                  onClick={() => setStep('utr')}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors text-sm"
                >
                  <span>I Have Paid — Enter 12-Digit UTR</span>
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 'utr' && (
              <motion.form 
                key="utr"
                onSubmit={handleVerifyUtr}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-text-secondary leading-relaxed">
                    Open your payment receipt on <strong>Google Pay / PhonePe / Paytm</strong> and copy the <strong>12-digit UPI Transaction ID / UTR</strong> (e.g. <span className="font-mono font-bold text-text">412384759201</span>).
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-text">
                    12-Digit UPI Reference Number (UTR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={utr}
                    onChange={e => setUtr(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 412384759201"
                    className="w-full px-4 py-3 bg-surface-dim border border-border rounded-xl font-mono text-base tracking-widest text-center text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-primary"
                    autoFocus
                  />
                  <div className="flex justify-between items-center text-[11px] text-text-secondary mt-1 px-1">
                    <span>{utr.length}/12 digits entered</span>
                    {utr.length === 12 && (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle size={12} /> Valid Format
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('pay')}
                    className="flex-1 py-3 px-4 border border-border rounded-xl text-xs font-semibold hover:bg-surface-dim transition-colors"
                  >
                    Back to QR
                  </button>
                  <button
                    type="submit"
                    disabled={loading || utr.length !== 12}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    {loading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={16} />
                    )}
                    <span>Verify & Confirm</span>
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-2 space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle size={36} />
                </div>

                <div>
                  <h4 className="text-lg font-bold text-text">Payment Verified!</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Your registration and dues have been recorded in the collegiate ledger.
                  </p>
                </div>

                {/* Printable Receipt Card */}
                <div className="p-4 bg-surface-dim rounded-2xl border border-border text-left space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-border pb-1.5 font-sans">
                    <span className="font-bold text-text">ClubSync E-Receipt</span>
                    <span className="text-emerald-600 font-semibold uppercase">Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-sans">Payer:</span>
                    <span className="font-semibold text-text">{currentUser?.name || 'Student'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-sans">Club:</span>
                    <span className="text-text">{club?.name}</span>
                  </div>
                  {event && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary font-sans">Event:</span>
                      <span className="text-text">{event.title}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-sans">Amount:</span>
                    <span className="font-bold text-text">₹{amount} (INR)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-sans">UTR Ref:</span>
                    <span className="text-primary font-bold">{verifiedPayment?.utr || utr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-sans">Timestamp:</span>
                    <span className="text-text-secondary">{new Date().toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePrintReceipt}
                    className="flex-1 py-2.5 px-4 border border-border rounded-xl text-xs font-semibold hover:bg-surface-dim transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Printer size={14} /> Print Receipt
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
