import React, { useState, useEffect } from 'react'
import { 
  Building2, Plus, Filter, Search, Download, CheckCircle2, Circle, 
  Clock, IndianRupee, Handshake, ChevronRight, ChevronLeft, ArrowRight, 
  ExternalLink, Trash2, Edit3, X, Sparkles, FileText, Phone, Mail, 
  ShieldCheck, AlertCircle, Award, CheckSquare, Layers
} from 'lucide-react'
import { toast } from 'sonner'

const STAGES = [
  { id: 'LEAD', label: 'Leads & Outreach', icon: Filter, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', icon: Clock, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  { id: 'IN_NEGOTIATION', label: 'In Negotiation', icon: Handshake, color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' },
  { id: 'MOU_SIGNED', label: 'MOU Signed', icon: FileText, color: 'text-teal-600 bg-teal-500/10 border-teal-500/20' },
  { id: 'FUNDS_RECEIVED', label: 'Funds Realized', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' }
]

const TIERS = {
  TITLE: { label: 'Title Sponsor', badge: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-sm' },
  POWERED_BY: { label: 'Powered By', badge: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm' },
  ASSOCIATE: { label: 'Associate Sponsor', badge: 'bg-blue-600 text-white' },
  IN_KIND: { label: 'In-Kind / Product', badge: 'bg-emerald-600 text-white' },
  GOODIES_PARTNER: { label: 'Goodies Partner', badge: 'bg-pink-600 text-white' }
}

const DEFAULT_DELIVERABLES_BY_TIER = {
  TITLE: [
    { title: 'Main Stage Flex Banner Logo (Top Center)', completed: false },
    { title: '5-Minute Keynote Address in PICT Auditorium', completed: false },
    { title: 'Exclusive Standee Placement at F-Building Foyer Entrance', completed: false },
    { title: 'Logo on Verified Digital Certificates & Gate Passes', completed: false },
    { title: 'Curated Resume Book of Top 25 Finalists', completed: false }
  ],
  POWERED_BY: [
    { title: 'Co-Branded Hackathon Track / Coding Round Platform', completed: false },
    { title: 'Logo on Event T-Shirts & Volunteer Badges', completed: false },
    { title: 'Dedicated Workshop Slot in Computer Center Labs', completed: false },
    { title: 'Featured Logo on ClubSync Public Showcase Page', completed: false }
  ],
  ASSOCIATE: [
    { title: 'Logo on Partner Wall & Event Standees', completed: false },
    { title: 'Swag & Promotional Brochure Distribution', completed: false },
    { title: 'Social Media Shoutout (Instagram Reel + LinkedIn Post)', completed: false }
  ],
  IN_KIND: [
    { title: 'Product Sampling / Refreshment Station on Campus', completed: false },
    { title: 'Logo on Event Collateral & Announcements', completed: false },
    { title: 'Social Media Appreciation Post', completed: false }
  ],
  GOODIES_PARTNER: [
    { title: 'Branded Goodies & Swag Kit Inclusion', completed: false },
    { title: 'Logo on Presentation Slides during Valedictory', completed: false }
  ]
}

export default function ClubSponsorshipTab({ clubId, clubEvents = [], isOfficer = false }) {
  const [deals, setDeals] = useState([])
  const [stats, setStats] = useState({
    total_pipeline_value: 0,
    funds_received: 0,
    active_deals_count: 0,
    mou_signed_count: 0,
    total_deals_count: 0
  })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'table'
  const [filterEvent, setFilterEvent] = useState('ALL')
  const [filterTier, setFilterTier] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [newDeliverableText, setNewDeliverableText] = useState('')

  // New Deal Form State
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    stage: 'LEAD',
    tier: 'ASSOCIATE',
    committed_amount: 25000,
    event_id: '',
    notes: ''
  })

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/sponsorships/clubs/${clubId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setDeals(data.deals || [])
        setStats(data.stats || {})
      } else {
        // Fallback for non-officer view or error
        setDeals([])
      }
    } catch (err) {
      console.error('Failed to fetch sponsorships:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clubId) fetchDeals()
  }, [clubId])

  // Handle stage change
  const handleUpdateStage = async (dealId, nextStage) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/sponsorships/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: nextStage })
      })

      if (!res.ok) throw new Error('Failed to update stage')
      toast.success(`Deal moved to ${STAGES.find(s => s.id === nextStage)?.label || nextStage}`)
      fetchDeals()
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal(prev => ({ ...prev, stage: nextStage }))
      }
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Handle toggle deliverable
  const handleToggleDeliverable = async (dealId, toggleIndex) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/sponsorships/${dealId}/deliverables`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toggleIndex })
      })

      if (!res.ok) throw new Error('Failed to toggle deliverable')
      const updated = await res.json()
      toast.success('Deliverable progress updated')
      fetchDeals()
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal(prev => ({ ...prev, deliverables: updated.deliverables }))
      }
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Handle add custom deliverable
  const handleAddDeliverable = async () => {
    if (!newDeliverableText.trim() || !selectedDeal) return
    const current = Array.isArray(selectedDeal.deliverables) ? [...selectedDeal.deliverables] : []
    current.push({ title: newDeliverableText.trim(), completed: false })

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/sponsorships/${selectedDeal.id}/deliverables`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deliverables: current })
      })

      if (!res.ok) throw new Error('Failed to add deliverable')
      const updated = await res.json()
      toast.success('Custom deliverable added')
      setNewDeliverableText('')
      fetchDeals()
      setSelectedDeal(prev => ({ ...prev, deliverables: updated.deliverables }))
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Handle Delete Deal
  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm('Are you sure you want to delete this sponsorship deal?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/sponsorships/${dealId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete deal')
      toast.success('Sponsorship deal deleted')
      setSelectedDeal(null)
      fetchDeals()
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Handle Create Deal
  const handleCreateDeal = async (e) => {
    e.preventDefault()
    if (!formData.company_name.trim()) {
      toast.error('Company Name is required')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/sponsorships/clubs/${clubId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          event_id: formData.event_id || null,
          committed_amount: parseFloat(formData.committed_amount) || 0
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create deal')
      }

      toast.success('New sponsor deal added to pipeline!')
      setIsAddModalOpen(false)
      setFormData({
        company_name: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        stage: 'LEAD',
        tier: 'ASSOCIATE',
        committed_amount: 25000,
        event_id: '',
        notes: ''
      })
      fetchDeals()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Export CSV Dossier
  const handleExportCSV = () => {
    if (deals.length === 0) {
      toast.error('No sponsorship deals to export')
      return
    }

    const headers = ['Company Name', 'Tier', 'Stage', 'Amount (INR)', 'Target Event', 'Contact Person', 'Email', 'Phone', 'Deliverables Fulfilled', 'Notes']
    const rows = deals.map(d => {
      const deliverables = Array.isArray(d.deliverables) ? d.deliverables : []
      const doneCount = deliverables.filter(x => x.completed).length
      return [
        `"${d.company_name || ''}"`,
        `"${TIERS[d.tier]?.label || d.tier}"`,
        `"${STAGES.find(s => s.id === d.stage)?.label || d.stage}"`,
        d.committed_amount || 0,
        `"${d.event_title || 'General Club Sponsorship'}"`,
        `"${d.contact_person || ''}"`,
        `"${d.contact_email || ''}"`,
        `"${d.contact_phone || ''}"`,
        `"${doneCount}/${deliverables.length}"`,
        `"${(d.notes || '').replace(/"/g, '""')}"`
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ClubSync_Sponsorship_Dossier_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Sponsorship CSV exported!')
  }

  // Filtered deals
  const filteredDeals = deals.filter(d => {
    const matchEvent = filterEvent === 'ALL' || String(d.event_id) === String(filterEvent)
    const matchTier = filterTier === 'ALL' || d.tier === filterTier
    const matchSearch = !searchQuery.trim() || 
      d.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchEvent && matchTier && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <Handshake className="text-primary" size={22} />
              Corporate Sponsorship & Brand Outreach CRM
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Officer Hub
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Manage symposium corporate partners, track MoU signing milestones, monitor tier deliverables, and verify inbound funds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-border hover:bg-surface-muted text-xs font-semibold text-text flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {isOfficer && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>New Sponsor Deal</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Financial Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Funds Realized</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{(stats.funds_received || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Deposited in PICT Gymkhana account
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Total Pipeline Value</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Award size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-text mt-2">
            ₹{(stats.total_pipeline_value || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Across {stats.total_deals_count || 0} active & pledged deals
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Signed MOUs</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-2">
            {stats.mou_signed_count || 0} Deals
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Awaiting cheque / bank dispatch
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">In Negotiation / Outreach</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Handshake size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {stats.active_deals_count || 0} Leads
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Active brand proposals in-flight
          </span>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-surface p-3.5 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
            <input
              type="text"
              placeholder="Search companies, leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-dim border border-border text-xs text-text placeholder-text-secondary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Event Filter */}
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-surface-dim border border-border text-xs font-medium text-text focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Target Events</option>
            {clubEvents.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-surface-dim border border-border text-xs font-medium text-text focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Tiers</option>
            <option value="TITLE">Title Sponsor</option>
            <option value="POWERED_BY">Powered By</option>
            <option value="ASSOCIATE">Associate Sponsor</option>
            <option value="IN_KIND">In-Kind / Product</option>
            <option value="GOODIES_PARTNER">Goodies Partner</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-surface-dim p-1 rounded-xl border border-border self-end sm:self-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'kanban' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'
            }`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-text-secondary text-sm font-semibold animate-pulse">
          Loading sponsorship pipeline from ClubSync registry...
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-surface rounded-2xl border border-dashed border-border space-y-3">
          <Handshake size={36} className="mx-auto text-text-secondary/50" />
          <h3 className="text-base font-bold text-text">No Sponsorship Deals Found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {searchQuery || filterEvent !== 'ALL' || filterTier !== 'ALL'
              ? 'No deals match your filter criteria. Try clearing search filters.'
              : 'Start your corporate outreach for upcoming flagship events by clicking "New Sponsor Deal" above.'}
          </p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id)
            const stageTotal = stageDeals.reduce((sum, d) => sum + (parseFloat(d.committed_amount) || 0), 0)
            const StageIcon = stage.icon

            return (
              <div 
                key={stage.id} 
                className="bg-surface-dim/60 dark:bg-surface/40 rounded-2xl border border-border p-3 space-y-3 flex flex-col min-h-[450px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <StageIcon size={14} className={stage.color.split(' ')[0]} />
                    <span className="text-xs font-bold text-text">{stage.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-surface border border-border font-bold text-text-secondary">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{stageTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {stageDeals.length === 0 ? (
                    <div className="h-28 flex items-center justify-center border border-dashed border-border/70 rounded-xl text-[11px] text-text-secondary">
                      No deals in {stage.label}
                    </div>
                  ) : (
                    stageDeals.map(deal => {
                      const deliverables = Array.isArray(deal.deliverables) ? deal.deliverables : []
                      const completedCount = deliverables.filter(x => x.completed).length
                      const progressPct = deliverables.length > 0 ? Math.round((completedCount / deliverables.length) * 100) : 0
                      const tierBadge = TIERS[deal.tier] || TIERS.ASSOCIATE
                      const stageIdx = STAGES.findIndex(s => s.id === deal.stage)

                      return (
                        <div
                          key={deal.id}
                          className="p-3.5 bg-white dark:bg-surface rounded-xl border border-border hover:border-primary/40 transition-all shadow-sm space-y-2.5 cursor-pointer group"
                          onClick={() => setSelectedDeal(deal)}
                        >
                          {/* Top: Tier badge & Amount */}
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${tierBadge.badge}`}>
                              {tierBadge.label}
                            </span>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              ₹{(parseFloat(deal.committed_amount) || 0).toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Company Name */}
                          <div>
                            <h4 className="text-sm font-bold text-text group-hover:text-primary transition-colors leading-snug">
                              {deal.company_name}
                            </h4>
                            {deal.event_title && (
                              <span className="text-[10px] text-text-secondary line-clamp-1 mt-0.5">
                                Target: <strong className="text-text font-medium">{deal.event_title}</strong>
                              </span>
                            )}
                          </div>

                          {/* Contact Person */}
                          {deal.contact_person && (
                            <div className="text-[11px] text-text-secondary flex items-center gap-1.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                              <span className="truncate">{deal.contact_person}</span>
                            </div>
                          )}

                          {/* Deliverables Progress */}
                          {deliverables.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-border/50">
                              <div className="flex items-center justify-between text-[10px] text-text-secondary">
                                <span className="flex items-center gap-1">
                                  <CheckSquare size={11} className="text-primary" /> Deliverables
                                </span>
                                <span className="font-mono font-semibold">{completedCount}/{deliverables.length} ({progressPct}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-dim rounded-full overflow-hidden border border-border/50">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    progressPct === 100 ? 'bg-emerald-500' : 'bg-primary'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Stage Transition Quick Arrows */}
                          {isOfficer && (
                            <div className="flex items-center justify-between pt-1 text-[11px] text-text-secondary" onClick={(e) => e.stopPropagation()}>
                              <button
                                disabled={stageIdx === 0}
                                onClick={() => handleUpdateStage(deal.id, STAGES[stageIdx - 1].id)}
                                className={`p-1 rounded hover:bg-surface-muted transition-colors ${
                                  stageIdx === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:text-text'
                                }`}
                                title="Move back"
                              >
                                <ChevronLeft size={14} />
                              </button>

                              <span className="text-[10px] font-semibold text-text-secondary/70">
                                Step {stageIdx + 1} of 5
                              </span>

                              <button
                                disabled={stageIdx === STAGES.length - 1}
                                onClick={() => handleUpdateStage(deal.id, STAGES[stageIdx + 1].id)}
                                className={`p-1 rounded hover:bg-surface-muted transition-colors ${
                                  stageIdx === STAGES.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:text-primary font-bold'
                                }`}
                                title="Advance stage"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-dim border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                <tr>
                  <th className="py-3 px-4">Company / Partner</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Committed (INR)</th>
                  <th className="py-3 px-4">Target Event</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Deliverables</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDeals.map(d => {
                  const deliverables = Array.isArray(d.deliverables) ? d.deliverables : []
                  const doneCount = deliverables.filter(x => x.completed).length
                  const stageObj = STAGES.find(s => s.id === d.stage) || STAGES[0]

                  return (
                    <tr key={d.id} className="hover:bg-surface-dim/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-text">
                        {d.company_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${TIERS[d.tier]?.badge || ''}`}>
                          {TIERS[d.tier]?.label || d.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${stageObj.color}`}>
                          {stageObj.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(parseFloat(d.committed_amount) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {d.event_title || 'General Club'}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {d.contact_person || '—'}
                        {d.contact_phone && <span className="block text-[10px] font-mono">{d.contact_phone}</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {doneCount}/{deliverables.length} ({deliverables.length > 0 ? Math.round((doneCount/deliverables.length)*100) : 0}%)
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedDeal(d)}
                          className="px-2.5 py-1 rounded-lg bg-surface-dim hover:bg-surface-muted text-primary font-semibold text-[11px] transition-colors"
                        >
                          View / Manage
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEAL DETAIL & DELIVERABLES DRAWER / MODAL */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${TIERS[selectedDeal.tier]?.badge || ''}`}>
                    {TIERS[selectedDeal.tier]?.label || selectedDeal.tier}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{(parseFloat(selectedDeal.committed_amount) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <h3 className="text-xl font-black text-text mt-1">{selectedDeal.company_name}</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Target: {selectedDeal.event_title || 'General Collegiate Grant'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stage Selector Bar */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">Pipeline Stage</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {STAGES.map(s => {
                  const isCurrent = selectedDeal.stage === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleUpdateStage(selectedDeal.id, s.id)}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all text-center ${
                        isCurrent 
                          ? `${s.color} ring-2 ring-primary/40 font-extrabold`
                          : 'bg-surface-dim border-border text-text-secondary hover:text-text'
                      }`}
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Contact Dossier */}
            <div className="p-3.5 bg-surface-dim rounded-2xl border border-border space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                Primary Sponsor Contact
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-text">
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-primary" />
                  <span className="font-semibold">{selectedDeal.contact_person || 'Not specified'}</span>
                </div>
                {selectedDeal.contact_email && (
                  <div className="flex items-center gap-2 font-mono">
                    <Mail size={13} className="text-primary" />
                    <a href={`mailto:${selectedDeal.contact_email}`} className="text-primary hover:underline truncate">
                      {selectedDeal.contact_email}
                    </a>
                  </div>
                )}
                {selectedDeal.contact_phone && (
                  <div className="flex items-center gap-2 font-mono">
                    <Phone size={13} className="text-primary" />
                    <a href={`tel:${selectedDeal.contact_phone}`} className="text-text hover:underline">
                      {selectedDeal.contact_phone}
                    </a>
                  </div>
                )}
              </div>
              {selectedDeal.notes && (
                <div className="pt-2 border-t border-border/60 text-text-secondary text-[11px] leading-relaxed">
                  <strong>Notes:</strong> {selectedDeal.notes}
                </div>
              )}
            </div>

            {/* DELIVERABLES CHECKLIST */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-primary" />
                    Agreed Deliverables Checklist
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Click items to toggle completion as event day milestones are executed.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                  {(selectedDeal.deliverables || []).filter(x => x.completed).length} / {(selectedDeal.deliverables || []).length}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {(selectedDeal.deliverables || []).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleDeliverable(selectedDeal.id, idx)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      item.completed 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200' 
                        : 'bg-surface-dim hover:bg-surface-muted border-border text-text'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle size={16} className="text-text-secondary/50" />
                      )}
                    </div>
                    <span className={`text-xs flex-1 ${item.completed ? 'line-through opacity-80' : 'font-medium'}`}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Custom Deliverable Input */}
              {isOfficer && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom milestone (e.g. VIP Dinner Seat)..."
                    value={newDeliverableText}
                    onChange={(e) => setNewDeliverableText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDeliverable()}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text placeholder-text-secondary focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleAddDeliverable}
                    className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              {isOfficer ? (
                <button
                  onClick={() => handleDeleteDeal(selectedDeal.id)}
                  className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={14} />
                  <span>Delete Deal</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setSelectedDeal(null)}
                className="px-5 py-2 rounded-xl bg-surface-dim hover:bg-surface-muted border border-border text-text text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SPONSOR DEAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Handshake className="text-primary" size={20} />
                  New Corporate Sponsorship Deal
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Record an inbound sponsor lead or active symposium partnership.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Persistent Systems, Red Bull, GitHub"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full py-2 px-3.5 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Sponsorship Tier
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="TITLE">Title Sponsor</option>
                    <option value="POWERED_BY">Powered By</option>
                    <option value="ASSOCIATE">Associate Sponsor</option>
                    <option value="IN_KIND">In-Kind / Product Partner</option>
                    <option value="GOODIES_PARTNER">Goodies Partner</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Committed Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.committed_amount}
                      onChange={(e) => setFormData({ ...formData, committed_amount: e.target.value })}
                      className="w-full py-2 pl-7 pr-3 rounded-xl bg-surface-dim border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Target Event
                  </label>
                  <select
                    value={formData.event_id}
                    onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="">General Club Sponsorship</option>
                    {clubEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary font-medium"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-[11px] font-bold text-text-secondary block">
                  Lead / Contact Person Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                  />
                  <input
                    type="email"
                    placeholder="Work Email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                  />
                  <input
                    type="tel"
                    placeholder="Phone / WhatsApp"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Internal Notes & Discussions
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes from initial meeting, custom deliverables requested, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="p-3 bg-surface-dim rounded-xl border border-border text-[11px] text-text-secondary">
                <Sparkles size={13} className="text-primary inline mr-1" />
                Selecting <strong>{TIERS[formData.tier]?.label}</strong> will automatically generate standard PICT collegiate deliverable milestones.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-dim hover:bg-surface-muted text-text text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save Deal to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
