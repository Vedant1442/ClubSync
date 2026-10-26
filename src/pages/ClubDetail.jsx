import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  Users, Clock, MapPin, Calendar, ArrowLeft, UserPlus, Mail, 
  BookOpen, FileText, CheckSquare, MessageSquare, MessageCircle, Shield, HelpCircle,  
  Upload, FolderPlus, Download, CheckCircle, Play, Plus, Trash2, Edit3, Send, Video, DollarSign, TrendingUp, TrendingDown,
  Briefcase, X
} from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { SkeletonPage } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import CreateEventModal from '../components/CreateEventModal'
import UPIPaymentModal from '../components/UPIPaymentModal'
import PaymentReceiptModal from '../components/PaymentReceiptModal'
import ClubRecruitmentTab from '../components/ClubRecruitmentTab'
import ClubAnalyticsTab from '../components/ClubAnalyticsTab'
import ClubInventoryTab from '../components/ClubInventoryTab'
import ClubSponsorshipTab from '../components/ClubSponsorshipTab'
import ClubWebhookTab from '../components/ClubWebhookTab'
import ClubMentorshipTab from '../components/ClubMentorshipTab'
import ClubResolutionAmendments from '../components/ClubResolutionAmendments'
import FormattedMessage from '../components/FormattedMessage'
import { IndianRupee, QrCode, Receipt as ReceiptIcon, Sparkles, ShieldCheck, BarChart3, Package, Handshake, Radio, HeartHandshake, GraduationCap, Scale } from 'lucide-react'

// Generate a deterministic color from a string
const getClubColor = (name = '') => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function ClubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const clubId = id  // UUID string — do NOT convert to Number
  
  const { 
    clubs, events, constitutions, meetings, elections, payments, updatePaymentStatus, 
    electionCandidates, electionVotes, documents, tasks, transactions, messages,
    clubMemberships, allClubMembers, isClubOfficer, getUserClubRole, 
    joinClub, leaveClub, updateMemberRole, rsvpEvent, cancelRsvp,
    addConstitutionVersion, addTransaction, addMessage, addMeeting, updateMeetingMinutes, 
    createElection, castVote, addTask, updateTaskStatus, 
    uploadDocument, askAI, loading, refreshData, currentUser
  } = useClubSync()

  const [activeTab, setActiveTab] = useState('overview')
  const [isDuesPaymentModalOpen, setIsDuesPaymentModalOpen] = useState(false)
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null)
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false)
  const [isEditClubModalOpen, setIsEditClubModalOpen] = useState(false)
  const [editClubData, setEditClubData] = useState({
    description: '',
    meetingSchedule: '',
    location: '',
    upi_vpa: ''
  })
  const club = clubs.find(c => c.id === clubId)

  useEffect(() => {
    if (club) {
      setEditClubData({
        description: club.description || '',
        meetingSchedule: club.meetingSchedule || '',
        location: club.location || '',
        upi_vpa: club.upi_vpa || ''
      })
    }
  }, [club])

  const handleSaveClubDetails = (e) => {
    e.preventDefault()
    if (club) {
      club.description = editClubData.description
      club.meetingSchedule = editClubData.meetingSchedule
      club.location = editClubData.location
      club.upi_vpa = editClubData.upi_vpa
    }
    toast.success('Club details updated successfully!')
    setIsEditClubModalOpen(false)
  }

  // Tab states
  const [constitutionSubTab, setConstitutionSubTab] = useState('resolutions') // 'resolutions' | 'document'
  const [constVersion, setConstVersion] = useState('')
  const [constTitle, setConstTitle] = useState('')
  const [constContent, setConstContent] = useState('')
  const [compareVersion1, setCompareVersion1] = useState('')
  const [compareVersion2, setCompareVersion2] = useState('')

  // Meeting states
  const [meetTitle, setMeetTitle] = useState('')
  const [meetDate, setMeetDate] = useState('')
  const [meetTime, setMeetTime] = useState('')
  const [meetLoc, setMeetLoc] = useState('')
  const [meetDesc, setMeetDesc] = useState('')
  const [selectedMeetingId, setSelectedMeetingId] = useState(null)
  const [meetMinutes, setMeetMinutes] = useState('')

  // Election states
  const [electTitle, setElectTitle] = useState('')
  const [electRole, setElectRole] = useState('')
  const [candidatesText, setCandidatesText] = useState('')

  // Document states
  const [docFile, setDocFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [docFolder, setDocFolder] = useState('/')
  const [newFolderName, setNewFolderName] = useState('')
  const [folders, setFolders] = useState(['/', '/Minutes', '/Constitution', '/Finance'])

  // Task states
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskAssigneeId, setTaskAssigneeId] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')

  // Chat states
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatBottomRef = useRef(null)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '👋 Hi, I am your ClubSync Knowledge Assistant! Ask me anything about our leadership, upcoming events, senior mentors, sponsors, or constitution.' }
  ])

  if (loading) {
    return <SkeletonPage />
  }

  if (!club) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">Club not found.</p>
        <Link to="/clubs" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">← Back to clubs</Link>
      </div>
    )
  }

  const isJoined = clubMemberships.some(m => String(m.club_id) === String(clubId) && String(m.user_id) === String(currentUser?.id))
  const isOfficer = isClubOfficer(clubId)
  const myRole = getUserClubRole(clubId)
  const clubColor = getClubColor(club?.name)

  // Real club members from DB
  const clubRealMembers = (allClubMembers || []).filter(m => m.club_id === clubId)

  // Filtered lists
  const clubEvents = events.filter(e => e.club_id === clubId)
  const clubConstitutions = constitutions.filter(c => c.club_id === clubId)
  const clubMeetings = meetings.filter(m => m.club_id === clubId)
  const clubElections = elections.filter(e => e.club_id === clubId)
  const clubDocs = documents.filter(d => d.club_id === clubId).filter(d => d.folder_path === docFolder)
  const clubTasks = tasks.filter(t => t.club_id === clubId)

  const activeElection = clubElections.find(e => e.status === 'active')
  const completedElections = clubElections.filter(e => e.status !== 'active')

  // Timeline / Recent activities (Mock generated from data changes)
  const timelineActivities = [
    { title: 'Club Created', desc: `${club.name} was established on ClubSync.`, date: 'May 2026' },
    ...clubConstitutions.map(c => ({
      title: 'Constitution Updated',
      desc: `Version ${c.version} was uploaded by ${c.updated_by || 'Officer'}.`,
      date: new Date(c.updated_at).toLocaleDateString()
    })),
    ...clubMeetings.filter(m => m.minutes).map(m => ({
      title: 'Minutes Logged',
      desc: `Minutes and summary generated for meeting: ${m.title}.`,
      date: new Date(m.created_at).toLocaleDateString()
    })),
    ...clubElections.map(e => ({
      title: e.status === 'active' ? 'Election Started' : 'Election Completed',
      desc: `Election for role: ${e.role}.`,
      date: new Date(e.created_at).toLocaleDateString()
    }))
  ].reverse()

  // Handlers
  const handleUploadConstitution = async (e) => {
    e.preventDefault()
    if (!constVersion || !constTitle || !constContent) return
    await addConstitutionVersion(clubId, constTitle, constContent, constVersion)
    setConstVersion('')
    setConstTitle('')
    setConstContent('')
  }

  const handleScheduleMeeting = async (e) => {
    e.preventDefault()
    if (!meetTitle || !meetDate || !meetTime || !meetLoc) return
    await addMeeting(clubId, {
      title: meetTitle,
      date: meetDate,
      time: meetTime,
      location: meetLoc,
      description: meetDesc
    })
    setMeetTitle('')
    setMeetDate('')
    setMeetTime('')
    setMeetLoc('')
    setMeetDesc('')
    refreshData()
  }

  const handleLogMinutes = async (e) => {
    e.preventDefault()
    if (!selectedMeetingId || !meetMinutes) return
    
    // Simulate AI Summarization
    const aiSummary = `AI Generated Summary:\n- Key points discussed: Reviewed objectives and action items.\n- Decided to move forward with planning upcoming workshops.\n- Next steps: Assign roles for the hackathon event.`
    await updateMeetingMinutes(selectedMeetingId, meetMinutes, aiSummary)
    setSelectedMeetingId(null)
    setMeetMinutes('')
  }

  const handleCreateElection = async (e) => {
    e.preventDefault()
    if (!electTitle || !electRole || !candidatesText) return
    const candidateNames = candidatesText.split(',').map(name => name.trim()).filter(Boolean)
    await createElection(clubId, electTitle, electRole, candidateNames)
    setElectTitle('')
    setElectRole('')
    setCandidatesText('')
  }

  const handleCastVote = async (candidateId) => {
    if (!activeElection) return
    const success = await castVote(activeElection.id, candidateId)
    if (!success) {
      toast.error('You have already voted in this election!')
    }
  }

  const handleCreateFolder = (e) => {
    e.preventDefault()
    if (!newFolderName) return
    const formatted = newFolderName.startsWith('/') ? newFolderName : `/${newFolderName}`
    if (!folders.includes(formatted)) {
      setFolders(prev => [...prev, formatted])
    }
    setNewFolderName('')
  }

  const handleUploadDoc = async (e) => {
    e.preventDefault()
    if (!docFile) return
    setIsUploading(true)
    await uploadDocument(clubId, docFile, docFolder)
    setDocFile(null)
    setIsUploading(false)
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!taskTitle) return
    const assignee = clubRealMembers.find(m => m.user_id === taskAssigneeId)
    await addTask(clubId, {
      title: taskTitle,
      description: taskDesc,
      assignee_id: taskAssigneeId || currentUser?.id,
      assignee_name: assignee?.name || currentUser?.name || 'Unassigned',
      due_date: taskDueDate || 'No due date'
    })
    setTaskTitle('')
    setTaskDesc('')
    setTaskDueDate('')
  }

  useEffect(() => {
    if (activeTab === 'assistant') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isChatLoading, activeTab])

  const allTabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'constitution', label: 'Constitution', icon: BookOpen },
    { id: 'recruitment', label: 'Recruitment & Auditions', icon: Briefcase },
    { id: 'meetings', label: 'Meetings & Minutes', icon: Calendar, memberOnly: true },
    { id: 'elections', label: 'Elections', icon: CheckCircle, memberOnly: true },
    { id: 'documents', label: 'Documents', icon: FileText, memberOnly: true },
    { id: 'tasks', label: 'Tasks (Kanban)', icon: CheckSquare, memberOnly: true },
    { id: 'treasury', label: 'Treasury', icon: DollarSign, memberOnly: true },
    { id: 'inventory', label: 'Lab & Equipment', icon: Package },
    { id: 'mentorship', label: 'Peer Mentorship', icon: GraduationCap },
    { id: 'chat', label: 'Group Chat', icon: MessageCircle, memberOnly: true },
    { id: 'assistant', label: 'Knowledge AI', icon: MessageSquare },
    // Executive Suite (Officer Only)
    { id: 'analytics', label: 'Executive Analytics', icon: BarChart3, officerOnly: true },
    { id: 'sponsorships', label: 'Sponsorships & CRM', icon: Handshake, officerOnly: true },
    { id: 'webhooks', label: 'Discord & Telegram', icon: Radio, officerOnly: true },
    { id: 'settings', label: 'Settings', icon: Shield, officerOnly: true },
  ], [])

  const visibleTabs = useMemo(() => {
    return allTabs.filter(t => {
      if (t.officerOnly) return isOfficer
      if (t.memberOnly) return isJoined || isOfficer
      return true
    })
  }, [allTabs, isOfficer, isJoined])

  useEffect(() => {
    const validIds = visibleTabs.map(t => t.id)
    if (!validIds.includes(activeTab)) {
      setActiveTab('overview')
    }
  }, [visibleTabs, activeTab])

  const handleSendChat = async (e, customPrompt) => {
    if (e && e.preventDefault) e.preventDefault()
    const query = (customPrompt || chatInput || '').trim()
    if (!query || isChatLoading) return
    const userMsg = { role: 'user', content: query }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsChatLoading(true)
    
    try {
      const response = await askAI(clubId, query)
      const assistantMsg = { role: 'assistant', content: response }
      setChatMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, I had trouble retrieving the club records. Please try again.' }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleExportFinancialCSV = () => {
    const clubTx = (transactions || []).filter(t => t.club_id === club.id)
    const clubPmts = (payments || []).filter(p => p.club_id === club.id)
    if (clubTx.length === 0 && clubPmts.length === 0) {
      toast.info('No financial records found to export.')
      return
    }

    let csvRows = []
    csvRows.push(['PICT PUNE - CLUB FINANCIAL AUDIT STATEMENT FY2025-26'])
    csvRows.push([`Club: ${club.name}`, `Generated on: ${new Date().toLocaleDateString('en-IN')}`, `Official UPI VPA: ${club.upi_vpa || 'vedant1442@fam'}`])
    csvRows.push([])
    csvRows.push(['--- TREASURY EXPENSE & INCOME LEDGER ---'])
    csvRows.push(['Date', 'Type', 'Category', 'Description', 'Amount (INR)'])
    clubTx.forEach(t => {
      csvRows.push([
        `"${new Date(t.date || t.created_at || Date.now()).toLocaleDateString('en-IN')}"`,
        `"${(t.type || '').toUpperCase()}"`,
        `"${(t.category || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        Number(t.amount || 0).toFixed(2)
      ])
    })

    csvRows.push([])
    csvRows.push(['--- ONLINE UPI PAYMENTS & UTR RECONCILIATION ---'])
    csvRows.push(['Date', 'Payer Name', 'Type', 'Reference ID', '12-Digit UTR', 'Amount (INR)', 'Verification Status'])
    clubPmts.forEach(p => {
      csvRows.push([
        `"${new Date(p.created_at || Date.now()).toLocaleDateString('en-IN')}"`,
        `"${(p.user_name || 'Member').replace(/"/g, '""')}"`,
        `"${(p.type || '').replace('_', ' ').toUpperCase()}"`,
        `"${p.ref_id || ''}"`,
        `"${p.utr || 'Pending'}"`,
        Number(p.amount || 0).toFixed(2),
        `"${(p.status || 'pending').toUpperCase()}"`
      ])
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(r => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${club.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Financial_Audit_FY26.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Financial audit statement downloaded!')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Back Button */}
      <Link to="/clubs" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-6">
        <ArrowLeft size={16} /> Back to clubs
      </Link>

      {/* Club Cover & Header */}
      <div className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden mb-6 shadow-xs">
        <div className="h-32 md:h-44 relative" style={{ background: `${clubColor}18` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-surface/90 text-text backdrop-blur-md border border-white/20 dark:border-border shadow-sm">
              <Sparkles size={12} className="text-primary" />
              Verified PICT Club
            </span>
          </div>
        </div>
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 min-w-0 flex-1">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl border-4 border-white dark:border-surface shrink-0"
                style={{ background: clubColor }}
              >
                {club.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-text tracking-tight truncate">
                    {club.name}
                  </h1>
                  {isJoined && (
                    <span className="text-[11px] bg-primary/10 dark:bg-primary/20 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full font-bold">
                      {myRole || 'Member'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {/* Category Badge with high dark/light contrast */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 dark:bg-primary/20 text-primary border border-primary/25 dark:border-primary/30 shadow-xs">
                    <Sparkles size={12} />
                    {club.category}
                  </span>

                  {/* Member Count Badge with high dark/light contrast */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-muted dark:bg-surface-dim text-text-secondary dark:text-zinc-200 border border-border shadow-xs">
                    <Users size={13} className="text-primary" />
                    <span>{(clubRealMembers.length > 0 ? clubRealMembers.length : (club.members_count || club.member_count || 142))} members</span>
                  </span>

                  {/* Location badge if available */}
                  {club.location && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-muted dark:bg-surface-dim text-text-secondary dark:text-zinc-300 border border-border">
                      <MapPin size={12} className="text-text-secondary" />
                      <span>{club.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Join/Leave + Officer Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0">
              {/* Officer Action Buttons: Edit, Add Event, Broadcast */}
              {isOfficer && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditClubModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-muted dark:bg-surface-dim hover:bg-surface-dim dark:hover:bg-zinc-800 text-text border border-border hover:border-primary/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    title="Edit club metadata & settings"
                  >
                    <Edit3 size={14} className="text-primary" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreateEventModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-muted dark:bg-surface-dim hover:bg-surface-dim dark:hover:bg-zinc-800 text-text border border-border hover:border-primary/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    title="Schedule a new symposium or workshop event"
                  >
                    <Plus size={14} className="text-emerald-500" />
                    <span>Add Event</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('webhooks')
                      toast.info('Switched to Discord & Telegram Webhook Broadcast Studio')
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 dark:bg-primary/25 dark:hover:bg-primary/35 text-primary border border-primary/25 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    title="Broadcast instant notice to Discord & Telegram channels"
                  >
                    <Radio size={14} className="text-primary animate-pulse" />
                    <span>Broadcast</span>
                  </button>
                </>
              )}

              {/* Join / Leave Club button */}
              <button
                type="button"
                onClick={() => isJoined ? leaveClub(club.id) : joinClub(club.id)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isJoined
                    ? 'bg-surface-muted dark:bg-surface-dim text-text-secondary hover:text-red-500 hover:bg-red-500/10 border border-border hover:border-red-500/20'
                    : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20 hover:shadow-md'
                }`}
              >
                <UserPlus size={15} />
                <span>{isJoined ? 'Leave Club' : 'Join Club'}</span>
              </button>
            </div>
          </div>

          <p className="text-text-secondary mt-4 leading-relaxed text-sm max-w-4xl">{club.description}</p>
        </div>
      </div>

      {/* Horizontally scrollable Tabs Menu with hidden scrollbar and active pill indicator */}
      <div className="relative mb-6">
        <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-surface rounded-2xl border border-border shadow-xs overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
          {visibleTabs.map(t => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 select-none ${
                  active
                    ? 'bg-primary text-white shadow-sm shadow-primary/25 font-extrabold scale-[1.02]'
                    : 'text-text-secondary hover:text-text hover:bg-surface-muted dark:hover:bg-surface-dim'
                }`}
              >
                <Icon size={15} className={active ? 'text-white' : 'text-text-secondary'} />
                <span>{t.label}</span>
                {t.officerOnly && (
                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 bg-amber-500/20 text-amber-500 rounded-md">
                    Officer
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Tab View */}
      <div className="min-h-[400px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Events */}
              <div>
                <h2 className="font-semibold text-lg mb-4">Upcoming Events</h2>
                {clubEvents.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {clubEvents.map(event => (
                      <Link
                        key={event.id}
                        to={`/events/${event.id}`}
                        className="bg-white dark:bg-surface rounded-2xl border border-border p-5 hover:shadow-md transition-shadow group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{event.category}</span>
                            <span className="text-xs text-text-secondary">{event.status}</span>
                          </div>
                          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                          <p className="text-xs text-text-secondary line-clamp-2 mb-4">{event.description}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-secondary border-t border-border pt-3">
                          <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon={Calendar} 
                    title="No upcoming events" 
                    description="This club hasn't scheduled any events yet." 
                  />
                )}
              </div>

              {/* Activity Timeline */}
              <div>
                <h2 className="font-semibold text-lg mb-4">Activity Timeline</h2>
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-6 space-y-6">
                  {timelineActivities.map((act, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== timelineActivities.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-border" />
                      )}
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary text-primary">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{act.title}</div>
                        <p className="text-xs text-text-secondary mt-0.5">{act.desc}</p>
                        <span className="text-[10px] text-text-secondary mt-1 block">{act.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5">
                <h3 className="font-semibold text-sm mb-4">Meeting Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Clock size={16} className="text-primary" />
                    <span>{club.meetingSchedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <MapPin size={16} className="text-primary" />
                    <span>{club.location}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5">
                <h3 className="font-semibold text-sm mb-3">Club Leadership</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-xs text-primary">S</div>
                    <div>
                      <div className="text-sm font-medium">Sarah Miller</div>
                      <div className="text-[10px] text-text-secondary">President</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-xs text-primary">D</div>
                    <div>
                      <div className="text-sm font-medium">David Chen</div>
                      <div className="text-[10px] text-text-secondary">Vice President</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXECUTIVE ANALYTICS TAB */}
        {activeTab === 'analytics' && isOfficer && (
          <ClubAnalyticsTab club={club} isOfficer={isOfficer} />
        )}

        {/* RECRUITMENT TAB */}
        {activeTab === 'recruitment' && (
          <ClubRecruitmentTab
            club={club}
            isOfficer={isOfficer}
            currentUser={currentUser}
          />
        )}

        {/* CONSTITUTION TAB */}
        {activeTab === 'constitution' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-1.5 bg-surface-dim p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setConstitutionSubTab('resolutions')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    constitutionSubTab === 'resolutions' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'
                  }`}
                >
                  <Scale size={14} />
                  <span>Amendment Resolutions & Voting</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConstitutionSubTab('document')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    constitutionSubTab === 'document' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'
                  }`}
                >
                  <BookOpen size={14} />
                  <span>Active Constitution & History</span>
                </button>
              </div>
            </div>

            {constitutionSubTab === 'resolutions' ? (
              <ClubResolutionAmendments clubId={club.id} currentUser={currentUser} isOfficer={isOfficer} />
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Document display */}
              <div className="bg-white dark:bg-surface rounded-2xl border border-border p-6 shadow-sm">
                {clubConstitutions.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                      <div>
                        <h2 className="font-bold text-lg">{clubConstitutions[clubConstitutions.length - 1].title}</h2>
                        <span className="text-xs text-text-secondary">Version {clubConstitutions[clubConstitutions.length - 1].version} • Updated {new Date(clubConstitutions[clubConstitutions.length - 1].updated_at).toLocaleDateString()}</span>
                      </div>
                      <span className="bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                      {clubConstitutions[clubConstitutions.length - 1].content}
                    </p>
                  </div>
                ) : (
                  <EmptyState 
                    icon={BookOpen} 
                    title="No Constitution Uploaded" 
                    description="Submit the first constitution version to establish rules." 
                  />
                )}
              </div>

              {/* Version Comparison */}
              {clubConstitutions.length > 1 && (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="font-semibold text-sm mb-4">Compare Versions</h3>
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Version 1</label>
                      <select 
                        value={compareVersion1} 
                        onChange={e => setCompareVersion1(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                      >
                        <option value="">Select version</option>
                        {clubConstitutions.map(c => (
                          <option key={c.id} value={c.id}>v{c.version} - {c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Version 2</label>
                      <select 
                        value={compareVersion2} 
                        onChange={e => setCompareVersion2(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                      >
                        <option value="">Select version</option>
                        {clubConstitutions.map(c => (
                          <option key={c.id} value={c.id}>v{c.version} - {c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {compareVersion1 && compareVersion2 && (
                    <div className="grid md:grid-cols-2 gap-4 border border-border rounded-xl p-4 bg-surface-dim max-h-80 overflow-y-auto">
                      <div>
                        <h4 className="font-semibold text-xs mb-2">v{clubConstitutions.find(c => c.id === Number(compareVersion1))?.version}</h4>
                        <p className="text-xs text-text-secondary whitespace-pre-line">{clubConstitutions.find(c => c.id === Number(compareVersion1))?.content}</p>
                      </div>
                      <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4">
                        <h4 className="font-semibold text-xs mb-2">v{clubConstitutions.find(c => c.id === Number(compareVersion2))?.version}</h4>
                        <p className="text-xs text-text-secondary whitespace-pre-line">{clubConstitutions.find(c => c.id === Number(compareVersion2))?.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Upload Form */}
              {isOfficer ? (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="font-semibold text-sm mb-4">Upload Constitution Version</h3>
                  <form onSubmit={handleUploadConstitution} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Version (e.g. 1.1)</label>
                      <input 
                        type="text" 
                        value={constVersion}
                        onChange={e => setConstVersion(e.target.value)}
                        placeholder="1.1"
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:ring-1 focus:ring-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
                      <input 
                        type="text" 
                        value={constTitle}
                        onChange={e => setConstTitle(e.target.value)}
                        placeholder="Amended Article II"
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:ring-1 focus:ring-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Content</label>
                      <textarea 
                        rows={6}
                        value={constContent}
                        onChange={e => setConstContent(e.target.value)}
                        placeholder="Add amendment text here..."
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:ring-1 focus:ring-primary focus:outline-none"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-primary text-white text-xs py-2 rounded-xl font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-1"
                    >
                      <Upload size={14} /> Submit Version
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 text-center text-text-secondary">
                  <Shield size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Only club officers can amend the constitution.</p>
                </div>
              )}

              {/* Version History List */}
              <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5">
                <h3 className="font-semibold text-sm mb-3">Version History</h3>
                <div className="space-y-3">
                  {clubConstitutions.map(c => (
                    <div key={c.id} className="flex justify-between items-start border-b border-border pb-2 last:border-b-0">
                      <div>
                        <div className="text-xs font-bold">v{c.version} - {c.title}</div>
                        <div className="text-[10px] text-text-secondary">By {c.updated_by}</div>
                      </div>
                      <span className="text-[10px] text-text-secondary">{new Date(c.updated_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
            )}
          </div>
        )}

        {/* MEETINGS TAB */}
        {activeTab === 'meetings' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Meeting Schedule</h2>
                <button
                  onClick={async () => {
                    const { data } = await addMeeting(clubId, {
                      title: `Instant Meeting - ${new Date().toLocaleTimeString()}`,
                      date: new Date().toISOString(),
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      location: 'Virtual',
                      description: `Instant meeting started by ${currentUser?.full_name || currentUser?.name || 'Member'}.`
                    });
                    if (data?.id) {
                      navigate(`/clubs/${clubId}/meetings/${data.id}/room`);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                >
                  <Video size={14} /> Instant Meeting
                </button>
              </div>
              {clubMeetings.length > 0 ? (
                <div className="space-y-3">
                  {clubMeetings.map(m => (
                    <div key={m.id} className="bg-white dark:bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm">{m.title}</h3>
                          {m.minutes && <span className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">Minutes Logged</span>}
                        </div>
                        <p className="text-xs text-text-secondary">{m.description || 'No description provided.'}</p>
                        
                        <div className="flex gap-4 text-[10px] text-text-secondary pt-2">
                          <span className="flex items-center gap-1"><Clock size={12} /> {m.date} at {m.time}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} /> {m.location}</span>
                        </div>
                        
                        <div className="pt-2">
                          <div className="shrink-0 flex items-start gap-2">
                            {isOfficer && !m.minutes && (
                              <button 
                                onClick={() => setSelectedMeetingId(m.id)}
                                className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1"
                              >
                                <FileText size={12} /> Log Minutes
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/clubs/${clubId}/meetings/${m.id}/room`)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-colors shadow-sm flex items-center gap-1.5"
                            >
                              <Video size={12} /> Join Video Call
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Minutes */}
                        {m.minutes && (
                          <div className="mt-3 p-3 bg-surface-muted rounded-xl text-xs space-y-2 border border-border">
                            <div>
                              <strong className="text-[10px] uppercase text-text-secondary">Official Minutes:</strong>
                              <p className="mt-1 text-text-secondary whitespace-pre-line">{m.minutes}</p>
                            </div>
                            {m.ai_summary && (
                              <div className="border-t border-border pt-2 mt-2">
                                <strong className="text-[10px] uppercase text-primary">AI Summarized Notes:</strong>
                                <p className="mt-1 text-primary whitespace-pre-line font-medium">{m.ai_summary}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isOfficer && !m.minutes && (
                        <div className="shrink-0 flex items-start">
                          <button 
                            onClick={() => setSelectedMeetingId(m.id)}
                            className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1"
                          >
                            <Edit3 size={12} /> Log Minutes
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={Calendar} 
                  title="No scheduled meetings" 
                  description="There are currently no meetings scheduled for this club." 
                />
              )}

              {/* Log Minutes Modal/Section */}
              {selectedMeetingId && (
                <div className="bg-white dark:bg-surface border border-border p-6 rounded-2xl shadow-lg mt-6">
                  <h3 className="font-bold text-sm mb-2 text-primary">Log Minutes for: {clubMeetings.find(m => m.id === selectedMeetingId)?.title}</h3>
                  <form onSubmit={handleLogMinutes} className="space-y-4">
                    <textarea 
                      rows={5}
                      value={meetMinutes}
                      onChange={e => setMeetMinutes(e.target.value)}
                      placeholder="Write main discussions, decisions made, and follow-ups here..."
                      className="w-full text-xs p-3 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                      required
                    />
                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => setSelectedMeetingId(null)}
                        className="text-xs px-4 py-2 border border-border rounded-xl text-text-secondary hover:bg-surface-muted"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="text-xs px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark flex items-center gap-1"
                      >
                        <Play size={12} /> Save & Generate AI Summary
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Schedule form */}
              {isOfficer ? (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="font-semibold text-sm mb-4">Schedule New Meeting</h3>
                  <form onSubmit={handleScheduleMeeting} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
                      <input 
                        type="text" 
                        value={meetTitle}
                        onChange={e => setMeetTitle(e.target.value)}
                        placeholder="Weekly Sync"
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Date</label>
                        <input 
                          type="date" 
                          value={meetDate}
                          onChange={e => setMeetDate(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Time</label>
                        <input 
                          type="text" 
                          value={meetTime}
                          onChange={e => setMeetTime(e.target.value)}
                          placeholder="4:00 PM"
                          className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Location</label>
                      <input 
                        type="text" 
                        value={meetLoc}
                        onChange={e => setMeetLoc(e.target.value)}
                        placeholder="Room 201"
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Agenda / Description</label>
                      <textarea 
                        rows={3}
                        value={meetDesc}
                        onChange={e => setMeetDesc(e.target.value)}
                        placeholder="Agenda details..."
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-primary text-white text-xs py-2 rounded-xl font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Schedule Meeting
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 text-center text-text-secondary">
                  <Shield size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Only club officers can schedule meetings.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ELECTIONS TAB */}
        {activeTab === 'elections' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Active Election */}
              <div>
                <h2 className="font-semibold text-lg mb-4">Active Election</h2>
                {activeElection ? (
                  <div className="bg-white dark:bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-start border-b border-border pb-3">
                      <div>
                        <h3 className="font-bold text-base">{activeElection.title}</h3>
                        <span className="text-xs text-text-secondary">Role: {activeElection.role}</span>
                      </div>
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold animate-pulse">Voting Live</span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs text-text-secondary">Select a candidate below to cast your vote. Votes are recorded securely.</p>
                      <div className="space-y-3">
                        {electionCandidates.filter(c => c.election_id === activeElection.id).map(cand => {
                          const totalVotes = electionCandidates.filter(c => c.election_id === activeElection.id).reduce((sum, c) => sum + c.votes_count, 0)
                          const percentage = totalVotes === 0 ? 0 : Math.round((cand.votes_count / totalVotes) * 100)
                          return (
                            <div key={cand.id} className="border border-border p-4 rounded-xl flex justify-between items-center bg-surface-dim hover:bg-surface-muted transition-colors">
                              <div className="flex-1 mr-4">
                                <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                                  <span>{cand.name}</span>
                                  <span className="text-text-secondary">{cand.votes_count} votes ({percentage}%)</span>
                                </div>
                                <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                </div>
                              </div>
                              <button 
                                onClick={() => handleCastVote(cand.id)}
                                className="bg-primary text-white text-xs px-4 py-2 rounded-xl font-semibold hover:bg-primary-dark shrink-0"
                              >
                                Vote
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary bg-white dark:bg-surface rounded-xl p-6 border border-border text-center">
                    No active elections at the moment.
                  </p>
                )}
              </div>

              {/* Completed Elections */}
              <div>
                <h2 className="font-semibold text-lg mb-4">Past Election Results</h2>
                {completedElections.length > 0 ? (
                  <div className="space-y-3">
                    {completedElections.map(elect => (
                      <div key={elect.id} className="bg-white dark:bg-surface rounded-xl border border-border p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-sm">{elect.title}</h4>
                          <span className="bg-surface-muted text-text-secondary px-2.5 py-0.5 rounded-full text-[10px] font-semibold">Concluded</span>
                        </div>
                        <div className="space-y-2">
                          {electionCandidates.filter(c => c.election_id === elect.id).map(cand => (
                            <div key={cand.id} className="flex justify-between text-xs text-text-secondary border-b border-border pb-1 last:border-0">
                              <span>{cand.name}</span>
                              <span className="font-semibold">{cand.votes_count} votes</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary bg-white dark:bg-surface rounded-xl p-6 border border-border text-center">
                    No historical elections found.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Create Election Form */}
              {isOfficer ? (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="font-semibold text-sm mb-4">Start New Election</h3>
                  <form onSubmit={handleCreateElection} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Election Title</label>
                      <input 
                        type="text" 
                        value={electTitle}
                        onChange={e => setElectTitle(e.target.value)}
                        placeholder="2026 President Elections"
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Target Role</label>
                      <input 
                        type="text" 
                        value={electRole}
                        onChange={e => setElectRole(e.target.value)}
                        placeholder="President"
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Candidates (comma-separated)</label>
                      <input 
                        type="text" 
                        value={candidatesText}
                        onChange={e => setCandidatesText(e.target.value)}
                        placeholder="Sarah Miller, David Chen, Alex Johnson"
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-primary text-white text-xs py-2 rounded-xl font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} /> Start Election
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 text-center text-text-secondary">
                  <Shield size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Only club officers can start elections.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Folder header / Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
                {folders.map(f => (
                  <button 
                    key={f}
                    onClick={() => setDocFolder(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      docFolder === f ? 'bg-primary text-white' : 'bg-white dark:bg-surface border border-border text-text-secondary hover:bg-surface-muted'
                    }`}
                  >
                    📁 {f === '/' ? 'Root' : f.replace('/', '')}
                  </button>
                ))}
              </div>

              {/* Files Browser */}
              <div className="bg-white dark:bg-surface border border-border rounded-2xl overflow-hidden">
                <div className="p-4 bg-surface-muted text-xs font-bold text-text-secondary border-b border-border flex justify-between">
                  <span>NAME</span>
                  <div className="flex gap-16 mr-12">
                    <span>SIZE</span>
                    <span>UPLOADED BY</span>
                  </div>
                </div>

                {clubDocs.length > 0 ? (
                  <div className="divide-y divide-border">
                    {clubDocs.map(doc => (
                      <div key={doc.id} className="p-4 flex justify-between items-center hover:bg-surface-dim transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📄</span>
                          <span className="text-xs font-medium">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-8 text-[11px] text-text-secondary">
                          <span>{doc.file_size}</span>
                          <span className="w-24 truncate">{doc.uploaded_by}</span>
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-border hover:bg-surface-muted text-primary"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-text-secondary">
                    <FileText size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-xs">No files in folder {docFolder}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Folder Creation */}
              <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-semibold text-sm mb-3">Create Folder</h3>
                <form onSubmit={handleCreateFolder} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="NewFolder"
                    className="flex-1 text-xs p-2 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                    required
                  />
                  <button 
                    type="submit"
                    className="bg-primary/10 text-primary border border-primary/20 px-3 rounded-xl hover:bg-primary/25"
                  >
                    <FolderPlus size={16} />
                  </button>
                </form>
              </div>

              {/* Upload Document Form */}
              {isOfficer ? (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="font-semibold text-sm mb-4">Upload File Metadata</h3>
                  <form onSubmit={handleUploadDoc} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Select File</label>
                      <input 
                        type="file" 
                        onChange={e => setDocFile(e.target.files[0])}
                        className="w-full text-xs p-2 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Target Folder</label>
                      <select 
                        value={docFolder}
                        onChange={e => setDocFolder(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                      >
                        {folders.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit"
                      disabled={isUploading}
                      className="w-full bg-primary text-white text-xs py-2 rounded-xl font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Upload size={14} /> {isUploading ? 'Uploading...' : 'Upload File'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 text-center text-text-secondary">
                  <Shield size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Only club officers can upload documents.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="grid lg:grid-cols-4 gap-4 items-start">
            {/* Kanban Columns */}
            {['todo', 'in_progress', 'done'].map(status => {
              const list = clubTasks.filter(t => t.status === status)
              return (
                <div key={status} className="bg-surface-dim rounded-2xl p-4 border border-border space-y-3 lg:col-span-1 min-h-[400px]">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-text-secondary uppercase">
                      {status.replace('_', ' ')}
                    </span>
                    <span className="bg-surface-muted text-text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {list.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {list.map(t => (
                      <div key={t.id} className="bg-white dark:bg-surface rounded-xl border border-border p-4 shadow-sm space-y-2">
                        <div className="font-semibold text-xs">{t.title}</div>
                        <p className="text-[10px] text-text-secondary">{t.description}</p>
                        
                        <div className="flex justify-between items-center border-t border-border pt-2 text-[9px] text-text-secondary">
                          <span>👤 {t.assignee_name}</span>
                          <span>📅 {t.due_date}</span>
                        </div>

                        {/* Column Switcher */}
                        <div className="flex justify-end gap-1 pt-1">
                          {status !== 'todo' && (
                            <button 
                              onClick={() => updateTaskStatus(t.id, status === 'done' ? 'in_progress' : 'todo')}
                              className="text-[9px] text-primary hover:underline"
                            >
                              ← Move Back
                            </button>
                          )}
                          {status !== 'done' && (
                            <button 
                              onClick={() => updateTaskStatus(t.id, status === 'todo' ? 'in_progress' : 'done')}
                              className="text-[9px] text-primary hover:underline font-bold"
                            >
                              Move Next →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {list.length === 0 && (
                      <div className="text-center py-8 text-text-secondary text-[10px]">No tasks</div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Task Creation Form (Admin Sidebar) */}
            <div className="lg:col-span-1 space-y-4">
              {isOfficer ? (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="font-semibold text-sm mb-4">Create New Task</h3>
                  <form onSubmit={handleAddTask} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Task Title</label>
                      <input 
                        type="text" 
                        value={taskTitle}
                        onChange={e => setTaskTitle(e.target.value)}
                        placeholder="Setup sound system"
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
                      <textarea 
                        rows={2}
                        value={taskDesc}
                        onChange={e => setTaskDesc(e.target.value)}
                        placeholder="Details..."
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Assignee</label>
                      <select 
                        value={taskAssigneeId}
                        onChange={e => setTaskAssigneeId(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                      >
                        {clubRealMembers.map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Due Date</label>
                      <input 
                        type="date" 
                        value={taskDueDate}
                        onChange={e => setTaskDueDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-primary text-white text-xs py-2 rounded-xl font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Assign Task
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 text-center text-text-secondary">
                  <Shield size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Only club officers can assign tasks.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LAB INVENTORY & EQUIPMENT TAB */}
        {activeTab === 'inventory' && (
          <ClubInventoryTab club={club} isOfficer={isOfficer} currentUser={currentUser} />
        )}

        {/* CORPORATE SPONSORSHIP & CRM TAB */}
        {activeTab === 'sponsorships' && isOfficer && (
          <ClubSponsorshipTab clubId={club.id} clubEvents={clubEvents} isOfficer={isOfficer} />
        )}

        {/* DISCORD & TELEGRAM WEBHOOK BRIDGE TAB */}
        {activeTab === 'webhooks' && isOfficer && (
          <ClubWebhookTab clubId={club.id} isOfficer={isOfficer} />
        )}

        {/* PEER MENTORSHIP & PROJECT PAIRING TAB */}
        {activeTab === 'mentorship' && (
          <ClubMentorshipTab clubId={club.id} currentUser={currentUser} isOfficer={isOfficer} />
        )}

        {/* TREASURY TAB */}
        {activeTab === 'treasury' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-text">Club Treasury & Finance</h2>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                    <Sparkles size={12} /> YouPI Zero-Fee UPI
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">Track collegiate budget, verify UPI UTR transactions, and collect dues.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportFinancialCSV}
                  className="px-3.5 py-2.5 rounded-xl border border-border bg-surface-dim hover:bg-surface-muted text-text font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  title="Export Annual Statement for College Audit"
                >
                  <Download size={14} className="text-emerald-600" />
                  <span>Export Financial Audit (CSV)</span>
                </button>
                <button
                  onClick={() => setIsDuesPaymentModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <IndianRupee size={15} />
                  <span>Pay Member Dues (UPI)</span>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Balance Card & UPI Details */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-indigo-600 via-primary to-blue-700 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-medium text-white/80 mb-1 uppercase tracking-wider">Total Available Balance</div>
                      <div className="text-3xl font-black tracking-tight">
                        ₹{(transactions.filter(t => t.club_id === club.id).reduce((sum, tx) => sum + (tx.type === 'income' || tx.type === 'dues' ? Number(tx.amount) : -Number(tx.amount)), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
                      <span>Annual Budget FY26</span>
                      <span className="font-semibold text-emerald-300">Healthy Surplus</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode size={18} className="text-emerald-600" />
                        <span className="text-xs font-bold text-text uppercase">Official Receiving UPI VPA</span>
                      </div>
                      <div className="p-3 bg-surface-dim rounded-xl border border-border">
                        <span className="text-xs text-text-secondary block">Direct Account VPA:</span>
                        <span className="font-mono font-bold text-sm text-text select-all">{club.upi_vpa || 'vedant1442@fam'}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] text-text-secondary flex items-center gap-1">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Zero aggregator cuts. Direct settlement to club bank.</span>
                    </div>
                  </div>
                </div>

                {/* UPI Online Payments & UTR Audit Log */}
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-sm text-text">UPI Payments & UTR Reconciliation</h3>
                      <p className="text-[11px] text-text-secondary">Recent digital UPI payments via YouPI Gateway</p>
                    </div>
                    <span className="text-xs text-primary font-medium">
                      {(payments || []).filter(p => p.club_id === club.id).length} recorded
                    </span>
                  </div>

                  {(payments || []).filter(p => p.club_id === club.id).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border text-text-secondary text-[11px]">
                            <th className="pb-2 font-medium">Payer / Ref</th>
                            <th className="pb-2 font-medium">Type</th>
                            <th className="pb-2 font-medium">12-Digit UTR</th>
                            <th className="pb-2 font-medium">Amount</th>
                            <th className="pb-2 font-medium">Status</th>
                            {isOfficer && <th className="pb-2 font-medium text-right">Action</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(payments || []).filter(p => p.club_id === club.id).map(p => (
                            <tr key={p.id} className="hover:bg-surface-dim transition-colors">
                              <td className="py-2.5">
                                <div className="font-semibold text-text">{p.user_name || 'Student Member'}</div>
                                <div className="text-[10px] text-text-secondary font-mono">{p.ref_id}</div>
                              </td>
                              <td className="py-2.5">
                                <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-surface-muted text-text-secondary">
                                  {p.type ? p.type.replace('_', ' ') : 'Payment'}
                                </span>
                              </td>
                              <td className="py-2.5 font-mono text-[11px] text-primary font-bold">
                                {p.utr || <span className="text-text-secondary italic">Pending</span>}
                              </td>
                              <td className="py-2.5 font-bold text-text">
                                ₹{Number(p.amount).toFixed(2)}
                              </td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  p.status === 'verified'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : p.status === 'rejected'
                                    ? 'bg-red-500/10 text-red-600'
                                    : 'bg-amber-500/10 text-amber-600 animate-pulse'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              {isOfficer && (
                                <td className="py-2.5 text-right">
                                  {p.status === 'pending' && (
                                    <div className="flex gap-1 justify-end">
                                      <button
                                        onClick={async () => {
                                          try {
                                            await updatePaymentStatus(p.id, 'verified');
                                            toast.success('Payment verified & credited!');
                                          } catch(err) {
                                            toast.error(err.message);
                                          }
                                        }}
                                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                                      >
                                        Verify
                                      </button>
                                    </div>
                                  )}
                                  {p.status === 'verified' && (
                                    <button
                                      onClick={() => setSelectedReceiptPayment(p)}
                                      className="px-2 py-1 bg-surface-muted hover:bg-surface-dim border border-border text-emerald-600 rounded text-[10px] font-semibold flex items-center gap-1 ml-auto"
                                    >
                                      <ReceiptIcon size={12} />
                                      <span>Receipt</span>
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-text-secondary text-xs">
                      No UPI digital transactions yet. Members can pay dues via the button above.
                    </div>
                  )}
                </div>

                {/* Full Ledger Transaction History */}
                <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="font-semibold text-sm mb-4 text-text">Collegiate Ledger History</h3>
                  {transactions.filter(t => t.club_id === club.id).length > 0 ? (
                    <div className="space-y-2">
                      {transactions.filter(t => t.club_id === club.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(tx => {
                        const isIncome = tx.type === 'income' || tx.type === 'dues';
                        return (
                          <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-surface-dim transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                {isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-text">{tx.description}</div>
                                <div className="text-[10px] text-text-secondary">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                              </div>
                            </div>
                            <div className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isIncome ? '+₹' : '-₹'}{(Number(tx.amount)).toFixed(2)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary text-center py-8">No ledger entries logged yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {isOfficer && (
                  <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="font-semibold text-sm mb-4 text-text">Log Manual Transaction</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const amount = e.target.amount.value;
                      const desc = e.target.desc.value;
                      const type = e.target.type.value;
                      await addTransaction(club.id, { amount, description: desc, type });
                      toast.success('Transaction saved!');
                      e.target.reset();
                    }} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
                        <select name="type" required className="w-full text-xs p-2.5 rounded-xl border border-border bg-surface-dim text-text focus:outline-none">
                          <option value="income">Income / Grant</option>
                          <option value="expense">Procurement / Expense</option>
                          <option value="dues">Member Dues</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Amount (₹ INR)</label>
                        <input name="amount" type="number" step="1" required placeholder="500" className="w-full text-xs p-2.5 rounded-xl border border-border bg-surface-dim text-text focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Description / Bill Reference</label>
                        <input name="desc" type="text" required placeholder="e.g. Laser cutting at Bhosari MIDC" className="w-full text-xs p-2.5 rounded-xl border border-border bg-surface-dim text-text focus:outline-none" />
                      </div>
                      <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm">
                        Record Transaction
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Official E-Receipt Modal */}
            <PaymentReceiptModal
              isOpen={!!selectedReceiptPayment}
              onClose={() => setSelectedReceiptPayment(null)}
              payment={selectedReceiptPayment}
              club={club}
              user={currentUser}
            />

            {/* Dues UPI Payment Modal */}
            <UPIPaymentModal
              isOpen={isDuesPaymentModalOpen}
              onClose={() => setIsDuesPaymentModalOpen(false)}
              club={club}
              type="membership_dues"
              amount={500}
              onSuccess={() => setIsDuesPaymentModalOpen(false)}
            />
          </div>
        )}

        {/* GROUP CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-surface border border-border rounded-2xl shadow-sm flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-border bg-surface-dim flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle size={20} className="text-primary" />
                <div>
                  <h3 className="font-semibold">Club Group Chat</h3>
                  <p className="text-xs text-text-secondary">Talk with other members in real-time</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col-reverse">
              {messages.filter(m => m.club_id === club.id).length === 0 && (
                <div className="text-center py-10 text-text-secondary text-sm">
                  No messages yet. Say hi! 👋
                </div>
              )}
              {messages.filter(m => m.club_id === club.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(msg => {
                const isMe = msg.user_id === currentUser?.id;
                const author = allClubMembers.find(m => m.user_id === msg.user_id)?.full_name || 'Unknown User';
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-text-secondary">{isMe ? 'You' : author}</span>
                      <span className="text-[9px] text-text-secondary">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-surface-muted text-text rounded-bl-none border border-border'}`}>
                      {msg.content}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-surface-dim">
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const input = e.target.elements.message;
                  if (!input.value.trim()) return;
                  const val = input.value;
                  input.value = '';
                  await addMessage(club.id, val);
                }}
                className="flex gap-2"
              >
                <input 
                  type="text" 
                  name="message"
                  placeholder="Message the club..." 
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* AI ASSISTANT TAB */}
        {activeTab === 'assistant' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-surface border border-border rounded-2xl shadow-sm flex flex-col h-[560px]">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface-dim/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-text">{club.name} Knowledge AI</h3>
                  <p className="text-[10px] text-text-secondary">Trained on club constitution, officer roster, events & meeting archives</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                ● Live Data Sync
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      AI
                    </div>
                  )}
                  <div className={`p-3.5 rounded-2xl text-xs max-w-lg leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-surface-muted text-text dark:text-zinc-200 border border-border/50 rounded-tl-none shadow-sm'
                  }`}>
                    <FormattedMessage content={msg.content} isUser={msg.role === 'user'} />
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    <Sparkles size={14} className="animate-spin text-primary" />
                  </div>
                  <div className="p-3.5 rounded-2xl text-xs bg-surface-muted border border-border/50 text-text-secondary rounded-tl-none flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                    <span className="ml-1 text-[11px] font-medium text-text-secondary">Synthesizing club records...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Prompt Suggestion Chips */}
            <div className="px-4 py-2 border-t border-border/50 bg-surface-dim/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-text-secondary shrink-0 font-medium">Suggestions:</span>
              {[
                { label: '👑 Officers', prompt: 'Who are the club officers and executive committee?' },
                { label: '📅 Events', prompt: 'What events, hackathons, and workshops are scheduled?' },
                { label: '🤝 Sponsors', prompt: 'Who are the corporate sponsors and brand partners?' },
                { label: '🧑‍🏫 Mentors', prompt: 'Who are the senior project mentors available?' },
                { label: '📜 By-Laws', prompt: 'Tell me about the club constitution and by-laws.' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleSendChat(null, chip.prompt)}
                  disabled={isChatLoading}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-surface border border-border/80 text-text-secondary hover:text-primary hover:border-primary/50 transition-colors shrink-0 disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-border flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about leadership, events, sponsors, constitution, or meetings..."
                disabled={isChatLoading}
                className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="bg-primary text-white px-4 rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* SETTINGS / MEMBER MANAGEMENT TAB */}
        {activeTab === 'settings' && isOfficer && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="font-semibold text-lg mb-4">Member Roles</h2>
              <div className="bg-white dark:bg-surface border border-border rounded-2xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="bg-surface-muted text-text-secondary font-bold uppercase border-b border-border">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      {isOfficer && <th className="p-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clubRealMembers.map(member => {
                      const role = member.role || 'Member'
                      return (
                        <tr key={member.user_id} className="hover:bg-surface-dim transition-colors">
                          <td className="p-4 font-semibold">{member.full_name || 'User'}</td>
                          <td className="p-4 text-text-secondary">{member.email || 'No email'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              role === 'President' ? 'bg-red-500/10 text-red-600' :
                              role === 'Secretary' ? 'bg-orange-500/10 text-orange-600' :
                              role === 'Vice President' ? 'bg-blue-500/10 text-blue-600' : 'bg-surface-muted text-text-secondary'
                            }`}>
                              {role}
                            </span>
                          </td>
                          {isOfficer && (
                            <td className="p-4 text-right">
                              {role !== 'President' && ( 
                                <select 
                                  value={role}
                                  onChange={e => updateMemberRole(clubId, member.user_id, e.target.value)}
                                  className="p-1 rounded border border-border text-[10px] bg-white dark:bg-surface text-text focus:outline-none"
                                >
                                  <option value="Member">Member</option>
                                  <option value="Secretary">Secretary</option>
                                  <option value="Vice President">Vice President</option>
                                </select>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5">
                <h3 className="font-semibold text-sm mb-3">Your Club Permissions</h3>
                <div className="space-y-2.5 text-xs text-text-secondary">
                  <div className="flex justify-between border-b border-border pb-1.5">
                    <span>Vote in Elections</span>
                    <span className="text-green-500 font-semibold">Enabled</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-1.5">
                    <span>Upload Documents</span>
                    <span className={isOfficer ? 'text-green-500 font-semibold' : 'text-text-secondary'}>{isOfficer ? 'Enabled' : 'Officers Only'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-1.5">
                    <span>Edit Constitution</span>
                    <span className={isOfficer ? 'text-green-500 font-semibold' : 'text-text-secondary'}>{isOfficer ? 'Enabled' : 'Officers Only'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-1.5">
                    <span>Manage Member Roles</span>
                    <span className={myRole === 'President' ? 'text-green-500 font-semibold' : 'text-text-secondary'}>{myRole === 'President' ? 'Enabled' : 'President Only'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        preselectedClubId={clubId}
      />

      {/* EDIT CLUB DETAILS MODAL (OFFICER ACTION) */}
      {isEditClubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Edit3 className="text-primary" size={20} />
                  Edit Club Information
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Update meeting details, official UPI handle, and club description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditClubModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClubDetails} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Club Description
                </label>
                <textarea
                  rows={3}
                  value={editClubData.description}
                  onChange={(e) => setEditClubData({ ...editClubData, description: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Meeting Schedule
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Every Wed 5:30 PM"
                    value={editClubData.meetingSchedule}
                    onChange={(e) => setEditClubData({ ...editClubData, meetingSchedule: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Campus Location / Lab
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Center CC-3"
                    value={editClubData.location}
                    onChange={(e) => setEditClubData({ ...editClubData, location: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Official Club UPI VPA (for dues)
                </label>
                <input
                  type="text"
                  placeholder="e.g. acm.pict@upi"
                  value={editClubData.upi_vpa}
                  onChange={(e) => setEditClubData({ ...editClubData, upi_vpa: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditClubModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-dim hover:bg-surface-muted text-text text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
