import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ShieldCheck, CheckCircle2, Award, Building2, Calendar, 
  MapPin, ExternalLink, Printer, ArrowLeft, XCircle, Share2, 
  Sparkles, GraduationCap, Zap
} from 'lucide-react'

export default function VerifyCredential() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [cred, setCred] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true)
        setError(null)
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const res = await fetch(`${API_URL}/api/events/verify/${id}`)
        const data = await res.json()
        if (res.ok && data.valid) {
          setCred(data)
        } else {
          setError(data.error || 'Credential not found')
        }
      } catch (e) {
        setError('Failed to reach verification registry')
      } finally {
        setLoading(false)
      }
    }
    if (id) verify()
  }, [id])

  const handleLinkedInShare = () => {
    if (!cred) return
    const certName = `${cred.event_title} - Certificate of Participation`
    const orgName = `${cred.club_name} (PICT Pune)`
    const date = new Date(cred.event_date)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const certUrl = window.location.href
    const certId = cred.credential_id

    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certName)}&organizationName=${encodeURIComponent(orgName)}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent(certUrl)}&certId=${encodeURIComponent(certId)}`
    window.open(linkedInUrl, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-text-secondary animate-pulse">
            Authenticating credential with PICT ClubSync registry...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-dim py-10 px-4 print:p-0 print:bg-white">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex justify-between items-center print:hidden">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text transition-colors">
            <ArrowLeft size={15} /> Back to ClubSync
          </Link>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl border border-border bg-white dark:bg-surface text-text text-xs font-semibold hover:bg-surface-muted transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer size={13} />
            <span>Print Dossier</span>
          </button>
        </div>

        {error ? (
          <div className="bg-white dark:bg-surface border border-red-500/30 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-600 mx-auto flex items-center justify-center">
              <XCircle size={36} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text">Credential Not Authenticated</h2>
              <p className="text-xs text-text-secondary max-w-md mx-auto mt-1 leading-relaxed">
                The identifier <code className="font-mono font-bold text-red-600">{id}</code> could not be validated against the active PICT college event attendance registry.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors"
            >
              Go to ClubSync Home
            </Link>
          </div>
        ) : (
          /* VERIFIED CREDENTIAL CARD */
          <div className="bg-white dark:bg-surface border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header Shield Banner */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 backdrop-blur-md flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Official PICT Credential
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/20 text-white">
                  {cred.credential_id}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-inner shrink-0">
                  <Award size={26} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Officially Authenticated Credential
                  </h1>
                  <p className="text-xs text-white/90 mt-0.5">{cred.institution}</p>
                </div>
              </div>
            </div>

            {/* Credential Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Recipient Box */}
              <div className="p-4 bg-surface-dim rounded-2xl border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                  Conferred Upon Bonafide Student
                </span>
                <div className="text-xl font-black text-text mt-0.5">{cred.user_name}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mt-1 font-mono">
                  <span className="px-2 py-0.5 rounded bg-surface border border-border font-bold text-text">
                    {cred.college_id}
                  </span>
                  <span>•</span>
                  <span>{cred.branch}</span>
                </div>
              </div>

              {/* Event & Activity Information */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                    Technical Event / Activity
                  </span>
                  <div className="text-lg font-black text-text mt-0.5">{cred.event_title}</div>
                  <div className="text-xs text-text-secondary mt-0.5 font-medium">
                    Organized by <strong className="text-primary">{cred.club_name}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-surface-dim rounded-xl border border-border text-xs">
                    <span className="text-[10px] text-text-secondary block">Date of Event:</span>
                    <span className="font-semibold text-text">
                      {new Date(cred.event_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="p-3 bg-surface-dim rounded-xl border border-border text-xs">
                    <span className="text-[10px] text-text-secondary block">AICTE Activity Points:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Zap size={13} /> +{cred.activity_points} Pts Earned
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust Verification Stamp */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                <div className="text-xs leading-relaxed text-text">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block">Tamper-Proof Verification Confirmed</span>
                  Gate check-in attendance was verified and cryptographically recorded in the PICT Student Gymkhana ledger.
                </div>
              </div>

              {/* Action Buttons (Hidden on Print) */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 print:hidden">
                <button
                  onClick={handleLinkedInShare}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <ExternalLink size={15} />
                  <span>Add to LinkedIn Profile</span>
                </button>

                {cred.event_id && (
                  <Link
                    to={`/events/${cred.event_id}`}
                    className="w-full sm:w-auto py-3 px-5 rounded-xl border border-border hover:bg-surface-muted text-text text-xs font-semibold transition-colors text-center"
                  >
                    View Event Details
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
