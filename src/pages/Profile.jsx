import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Mail, Users, Calendar, Edit, ArrowRight, Ticket, Award, 
  Receipt, QrCode, CheckCircle, Clock, MapPin, IndianRupee, 
  Sparkles, ExternalLink, ShieldCheck, GraduationCap, WifiOff, FileText, Zap
} from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import EmptyState from '../components/EmptyState'
import { AnimatePresence } from 'framer-motion'
import EditProfileModal from '../components/EditProfileModal'
import EventTicketModal from '../components/EventTicketModal'
import EventCertificateModal from '../components/EventCertificateModal'
import PaymentReceiptModal from '../components/PaymentReceiptModal'
import EventODLetterModal from '../components/EventODLetterModal'
import AICTEPointsTracker from '../components/AICTEPointsTracker'

export default function Profile() {
  const { currentUser, clubs, events, clubMemberships, eventMembers, payments = [] } = useClubSync()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('passes') // 'passes' | 'certificates' | 'clubs'

  const [selectedTicketEvent, setSelectedTicketEvent] = useState(null)
  const [selectedReceiptEvent, setSelectedReceiptEvent] = useState(null)
  const [selectedCertificateEvent, setSelectedCertificateEvent] = useState(null)
  const [selectedODEvent, setSelectedODEvent] = useState(null)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!currentUser) return null

  const myClubs = clubs.filter(c => clubMemberships.some(m => String(m.club_id) === String(c.id)))
  const myEvents = events.filter(e => eventMembers.some(em => String(em.event_id) === String(e.id) && String(em.user_id) === String(currentUser?.id)))
  
  // Events where user is checked in
  const earnedCertificates = myEvents.filter(e => {
    const em = eventMembers.find(m => String(m.event_id) === String(e.id) && String(m.user_id) === String(currentUser?.id))
    return em?.checked_in
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Profile Card */}
      <div className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden mb-8 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-primary to-blue-600 relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-4 right-4 hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-semibold">
            <GraduationCap size={15} />
            <span>PICT Pune • Student Portal</span>
          </div>
        </div>
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {currentUser.avatar_url ? (
              <img 
                src={currentUser.avatar_url} 
                alt="Avatar" 
                className="w-24 h-24 rounded-2xl object-cover shadow-xl border-4 border-white dark:border-surface bg-white" 
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-xl border-4 border-white dark:border-surface">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-text">{currentUser.name}</h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  PICT Student Member
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mt-1.5">
                <span className="flex items-center gap-1">
                  <Mail size={13} /> {currentUser.email}
                </span>
                {currentUser.college_id && (
                  <span className="font-mono bg-surface-dim px-2 py-0.5 rounded-md border border-border font-bold text-text">
                    PRN: {currentUser.college_id}
                  </span>
                )}
                {currentUser.branch && (
                  <span className="bg-surface-dim px-2 py-0.5 rounded-md border border-border text-text font-medium">
                    {currentUser.branch}
                  </span>
                )}
              </div>
              {currentUser.bio && (
                <p className="mt-2 text-xs text-text-secondary max-w-2xl leading-relaxed">
                  {currentUser.bio}
                </p>
              )}
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-surface-muted transition-colors flex items-center gap-2 self-start sm:self-end"
            >
              <Edit size={14} /> Edit Profile
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-border">
            <div className="p-3 bg-surface-dim rounded-xl border border-border text-center">
              <div className="text-xl font-black text-primary">{myEvents.length}</div>
              <div className="text-[11px] font-medium text-text-secondary mt-0.5">Active Passes</div>
            </div>
            <div className="p-3 bg-surface-dim rounded-xl border border-border text-center">
              <div className="text-xl font-black text-amber-600 dark:text-amber-400">{earnedCertificates.length}</div>
              <div className="text-[11px] font-medium text-text-secondary mt-0.5">Certificates</div>
            </div>
            <div className="p-3 bg-surface-dim rounded-xl border border-border text-center">
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{myClubs.length}</div>
              <div className="text-[11px] font-medium text-text-secondary mt-0.5">Joined Clubs</div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}
      </AnimatePresence>

      {/* Passbook Tabs Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('passes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'passes'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-surface-muted hover:text-text'
          }`}
        >
          <Ticket size={16} />
          <span>My Passes ({myEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'certificates'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-surface-muted hover:text-text'
          }`}
        >
          <Award size={16} />
          <span>Certificates of Participation ({earnedCertificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('clubs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'clubs'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-surface-muted hover:text-text'
          }`}
        >
          <Users size={16} />
          <span>Enrolled Clubs ({myClubs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('aicte')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'aicte'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
              : 'text-text-secondary hover:bg-surface-muted hover:text-text'
          }`}
        >
          <Zap size={16} className={activeTab === 'aicte' ? 'text-amber-300' : 'text-purple-600'} />
          <span>100 Activity Points</span>
        </button>
      </div>

      {/* TAB 1: DIGITAL PASSES (QR) */}
      {activeTab === 'passes' && (
        <div>
          {isOffline && (
            <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center gap-3 text-xs">
              <WifiOff size={18} className="shrink-0" />
              <div>
                <span className="font-bold">Offline Passbook Active:</span> All your QR event passes and venue credentials remain fully accessible and scannable without cellular signal.
              </div>
            </div>
          )}

          {myEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {myEvents.map(event => {
                const club = clubs.find(c => String(c.id) === String(event.club_id))
                const eventMember = eventMembers.find(em => String(em.event_id) === String(event.id) && String(em.user_id) === String(currentUser?.id))
                const price = Number(event.price) || 0
                const isCheckedIn = Boolean(eventMember?.checked_in)
                const userPayment = payments.find(p => String(p.event_id) === String(event.id) && String(p.user_id) === String(currentUser?.id) && p.status === 'verified')

                return (
                  <div 
                    key={event.id}
                    className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ background: club?.color || '#6366f1' }}
                          />
                          <span className="text-xs font-bold text-text truncate max-w-[180px]">
                            {club?.name || 'PICT Student Club'}
                          </span>
                        </div>
                        {price > 0 ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            ₹{price} Entry
                          </span>
                        ) : (
                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                            Free Pass
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-text line-clamp-1 mb-2">{event.title}</h3>

                      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-primary shrink-0" />
                          <span>{new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-primary shrink-0" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <MapPin size={13} className="text-primary shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>

                      {/* Check-In Gate Status Pill */}
                      <div className="mb-4">
                        {isCheckedIn ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                            <CheckCircle size={14} />
                            <span>Checked-In at Gate | Pass Validated</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                            <QrCode size={14} />
                            <span>Active Pass | Ready for Gate Scanner</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="px-5 py-3.5 bg-surface-dim border-t border-border flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTicketEvent(event)}
                          className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Ticket size={13} />
                          <span>Show QR Pass</span>
                        </button>

                        {(price > 0 || userPayment) && (
                          <button
                            onClick={() => setSelectedReceiptEvent(event)}
                            className="px-3 py-1.5 rounded-xl border border-border bg-white dark:bg-surface text-text text-xs font-semibold hover:bg-surface-muted transition-colors flex items-center gap-1"
                            title="View E-Receipt"
                          >
                            <Receipt size={13} className="text-emerald-600" />
                            <span>Receipt</span>
                          </button>
                        )}

                        {isCheckedIn && (
                          <button
                            onClick={() => setSelectedCertificateEvent(event)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1"
                            title="View Certificate"
                          >
                            <Award size={13} className="text-amber-600" />
                            <span>Certificate</span>
                          </button>
                        )}

                        {isCheckedIn && (
                          <button
                            onClick={() => setSelectedODEvent(event)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                            title="Download On-Duty (OD) Leave Letter"
                          >
                            <FileText size={13} className="text-emerald-600" />
                            <span>OD Letter</span>
                          </button>
                        )}
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="text-xs text-text-secondary hover:text-text font-medium flex items-center gap-1"
                      >
                        Details <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState 
              icon={Ticket} 
              title="No active event passes" 
              description="Browse upcoming PICT campus events and RSVP to get your verified QR pass." 
            />
          )}
        </div>
      )}

      {/* TAB 2: CERTIFICATES OF PARTICIPATION */}
      {activeTab === 'certificates' && (
        <div>
          {earnedCertificates.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {earnedCertificates.map(event => {
                const club = clubs.find(c => String(c.id) === String(event.club_id))
                const eventMember = eventMembers.find(em => String(em.event_id) === String(event.id) && String(em.user_id) === String(currentUser?.id))
                const certId = eventMember?.certificate_id || `CERT-PICT-${event.id.slice(0, 6).toUpperCase()}`

                return (
                  <div 
                    key={event.id}
                    className="relative bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 dark:from-amber-950/10 dark:via-surface dark:to-amber-950/20 border-2 border-amber-300 dark:border-amber-800/60 rounded-3xl p-6 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                            <Award size={20} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                              Official Collegiate Certificate
                            </span>
                            <span className="text-xs font-semibold text-text">{club?.name || 'PICT Student Chapter'}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">
                          Verified
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-text mb-1">{event.title}</h3>
                      <p className="text-xs text-text-secondary leading-relaxed mb-4">
                        Conferred upon <span className="font-bold text-text">{currentUser.name}</span> for active attendance and technical participation.
                      </p>

                      <div className="p-3 bg-surface-dim rounded-xl border border-border flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-text-secondary block">Credential ID:</span>
                          <span className="font-mono font-bold text-primary">{certId}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-text-secondary block">Date of Issue:</span>
                          <span className="font-semibold text-text">{new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-amber-200 dark:border-amber-900/40 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCertificateEvent(event)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]"
                        >
                          <Award size={14} />
                          <span>Certificate</span>
                        </button>
                        <button
                          onClick={() => setSelectedODEvent(event)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]"
                        >
                          <FileText size={14} />
                          <span>OD Letter</span>
                        </button>
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="text-xs text-text-secondary hover:text-text font-medium flex items-center gap-1"
                      >
                        Event <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4 bg-white dark:bg-surface rounded-2xl border border-border">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center mb-4">
                <Award size={32} />
              </div>
              <h3 className="font-bold text-base text-text mb-1">No Certificates Earned Yet</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto mb-5 leading-relaxed">
                Attend campus events and present your digital QR pass at the entrance gate. When scanned by club officers, your verified collegiate certificate of participation is automatically issued here!
              </p>
              <Link 
                to="/events"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
              >
                Browse Campus Events <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ENROLLED CLUBS */}
      {activeTab === 'clubs' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base text-text">Clubs You Belong To</h2>
            <Link to="/clubs" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Explore All Clubs <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {myClubs.length > 0 ? (
              myClubs.map(club => {
                const membership = clubMemberships.find(m => String(m.club_id) === String(club.id) && String(m.user_id) === String(currentUser?.id))
                return (
                  <Link
                    key={club.id}
                    to={`/clubs/${club.id}`}
                    className="flex items-center gap-3.5 bg-white dark:bg-surface rounded-2xl p-4 border border-border hover:shadow-md transition-shadow"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm" 
                      style={{ background: club.color || '#6366f1' }}
                    >
                      {club.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text truncate">{club.name}</span>
                        {membership?.role && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold shrink-0">
                            {membership.role}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {club.category} • {club.memberCount || 1} members
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-text-secondary shrink-0" />
                  </Link>
                )
              })
            ) : (
              <EmptyState 
                icon={Users} 
                title="No clubs joined yet" 
                description="Explore college societies and technical teams to join." 
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AICTE 100 ACTIVITY POINTS */}
      {activeTab === 'aicte' && (
        <AICTEPointsTracker
          currentUser={currentUser}
          events={events}
          eventMembers={eventMembers}
          clubs={clubs}
          clubMemberships={clubMemberships}
        />
      )}

      {/* Modals for Direct Passbook Actions */}
      {selectedTicketEvent && (
        <EventTicketModal
          isOpen={!!selectedTicketEvent}
          onClose={() => setSelectedTicketEvent(null)}
          event={selectedTicketEvent}
          club={clubs.find(c => String(c.id) === String(selectedTicketEvent.club_id))}
          user={currentUser}
          eventMember={eventMembers.find(em => String(em.event_id) === String(selectedTicketEvent.id) && String(em.user_id) === String(currentUser?.id))}
          onOpenCertificate={() => {
            const ev = selectedTicketEvent
            setSelectedTicketEvent(null)
            setSelectedCertificateEvent(ev)
          }}
        />
      )}

      {selectedReceiptEvent && (
        <PaymentReceiptModal
          isOpen={!!selectedReceiptEvent}
          onClose={() => setSelectedReceiptEvent(null)}
          payment={payments.find(p => String(p.event_id) === String(selectedReceiptEvent.id) && String(p.user_id) === String(currentUser?.id) && p.status === 'verified') || {
            id: 'mock-rec-' + selectedReceiptEvent.id,
            ref_id: `CS-${(selectedReceiptEvent.id || 'EV').slice(0, 8).toUpperCase()}`,
            amount: selectedReceiptEvent.price || 150,
            currency: 'INR',
            vpa: clubs.find(c => String(c.id) === String(selectedReceiptEvent.club_id))?.upi_vpa || 'vedant1442@fam',
            payee_name: clubs.find(c => String(c.id) === String(selectedReceiptEvent.club_id))?.name || 'PICT Robocon Pune',
            utr: '412384759201',
            status: 'verified',
            verified_at: new Date()
          }}
          event={selectedReceiptEvent}
          club={clubs.find(c => String(c.id) === String(selectedReceiptEvent.club_id))}
          user={currentUser}
        />
      )}

      {selectedCertificateEvent && (
        <EventCertificateModal
          isOpen={!!selectedCertificateEvent}
          onClose={() => setSelectedCertificateEvent(null)}
          event={selectedCertificateEvent}
          club={clubs.find(c => String(c.id) === String(selectedCertificateEvent.club_id))}
          user={currentUser}
          eventMember={eventMembers.find(em => String(em.event_id) === String(selectedCertificateEvent.id) && String(em.user_id) === String(currentUser?.id))}
        />
      )}

      {selectedODEvent && (
        <EventODLetterModal
          isOpen={!!selectedODEvent}
          onClose={() => setSelectedODEvent(null)}
          event={selectedODEvent}
          club={clubs.find(c => String(c.id) === String(selectedODEvent.club_id))}
          user={currentUser}
          eventMember={eventMembers.find(em => String(em.event_id) === String(selectedODEvent.id) && String(em.user_id) === String(currentUser?.id))}
        />
      )}
    </div>
  )
}
