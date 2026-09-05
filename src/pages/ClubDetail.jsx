import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  Users, Clock, MapPin, Calendar, ArrowLeft, UserPlus, Mail, 
  BookOpen, FileText, CheckSquare, MessageSquare, Shield, HelpCircle, 
  Upload, FolderPlus, Download, CheckCircle, Play, Plus, Trash2, Edit3, Send
} from 'lucide-react'
import { useClubSync } from '../context/ClubSyncContext'
import { SkeletonPage } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

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
    clubs, events, constitutions, meetings, elections, 
    electionCandidates, electionVotes, documents, tasks, 
    clubMemberships, allClubMembers, isClubOfficer, getUserClubRole, 
    joinClub, leaveClub, updateMemberRole, rsvpEvent, cancelRsvp,
    addConstitutionVersion, addMeeting, updateMeetingMinutes, 
    createElection, castVote, addTask, updateTaskStatus, 
    uploadDocument, askAI, loading, refreshData, currentUser
  } = useClubSync()

  const [activeTab, setActiveTab] = useState('overview')
  const club = clubs.find(c => c.id === clubId)

  // Tab states
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
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi, I am your ClubSync Knowledge Assistant. Ask me anything about the club documents, constitution, or meeting minutes!' }
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

  const isJoined = clubMemberships.some(m => m.club_id === clubId)
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

  const handleSendChat = async (e) => {
    e.preventDefault()
    if (!chatInput) return
    const userMsg = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    
    const response = await askAI(clubId, chatInput)
    const assistantMsg = { role: 'assistant', content: response }
    setChatMessages(prev => [...prev, assistantMsg])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Back Button */}
      <Link to="/clubs" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-6">
        <ArrowLeft size={16} /> Back to clubs
      </Link>

      {/* Club Cover & Header */}
      <div className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden mb-6">
        <div className="h-32 md:h-40 relative" style={{ background: `${clubColor}18` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
        <div className="px-6 pb-6 -mt-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white dark:border-surface"
              style={{ background: clubColor }}
            >
              {club.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                {club.name}
                {isJoined && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {myRole || 'member'}
                  </span>
                )}
              </h1>
              <span className="text-xs font-medium text-text-secondary bg-surface-muted px-2 py-0.5 rounded-full">
                {club.category}
              </span>
            </div>
            <button
              onClick={() => isJoined ? leaveClub(club.id) : joinClub(club.id)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
                isJoined
                  ? 'bg-surface-muted text-text-secondary border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              <UserPlus size={16} /> {isJoined ? 'Leave Club' : 'Join Club'}
            </button>
          </div>
          <p className="text-text-secondary mt-4 leading-relaxed text-sm">{club.description}</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-border scrollbar-hide">
        {[
          { id: 'overview', label: 'Overview', icon: Users },
          { id: 'constitution', label: 'Constitution', icon: BookOpen },
          { id: 'meetings', label: 'Meetings & Minutes', icon: Calendar },
          { id: 'elections', label: 'Elections', icon: CheckCircle },
          { id: 'documents', label: 'Documents', icon: FileText },
          { id: 'tasks', label: 'Tasks (Kanban)', icon: CheckSquare },
          { id: 'assistant', label: 'Knowledge AI', icon: MessageSquare },
          { id: 'settings', label: 'Settings', icon: Shield },
        ].map(t => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
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

        {/* CONSTITUTION TAB */}
        {activeTab === 'constitution' && (
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
                        className="w-full text-xs p-2 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:ring-1 focus:ring-primary focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:ring-1 focus:ring-primary focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:ring-1 focus:ring-primary focus:outline-none"
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

        {/* MEETINGS TAB */}
        {activeTab === 'meetings' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-semibold text-lg">Meeting Schedule</h2>
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
                          <button
                            onClick={() => navigate(`/clubs/${clubId}/meetings/${m.id}/room`)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-semibold transition-colors shadow-sm"
                          >
                            Join Video Call
                          </button>
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
                      className="w-full text-xs p-3 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                          className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                          className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                            <div key={cand.id} className="border border-border p-4 rounded-xl flex justify-between items-center bg-surface-dim hover:bg-white transition-colors">
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                      docFolder === f ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-surface-muted'
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
                            className="p-1.5 rounded-lg border border-border hover:bg-white text-primary"
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
                    className="flex-1 text-xs p-2 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2 rounded-xl border border-border bg-white focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Target Folder</label>
                      <select 
                        value={docFolder}
                        onChange={e => setDocFolder(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Assignee</label>
                      <select 
                        value={taskAssigneeId}
                        onChange={e => setTaskAssigneeId(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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
                        className="w-full text-xs p-2.5 rounded-xl border border-border bg-white focus:outline-none"
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

        {/* AI ASSISTANT TAB */}
        {activeTab === 'assistant' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-surface border border-border rounded-2xl shadow-sm flex flex-col h-[500px]">
            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">AI</div>
                  )}
                  <div className={`p-3.5 rounded-2xl text-xs max-w-lg leading-relaxed ${
                    msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-muted text-text-secondary rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-border flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about the constitution, meeting history, or documents..."
                className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button 
                type="submit"
                className="bg-primary text-white px-4 rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* SETTINGS / MEMBER MANAGEMENT TAB */}
        {activeTab === 'settings' && (
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
                                  className="p-1 rounded border border-border text-[10px] bg-white focus:outline-none"
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
    </div>
  )
}
