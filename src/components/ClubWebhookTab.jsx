import React, { useState, useEffect } from 'react'
import { 
  Radio, Plus, Send, CheckCircle2, XCircle, AlertTriangle, 
  ExternalLink, Trash2, Edit3, RefreshCw, Zap, ShieldCheck, 
  Clock, CheckSquare, Sparkles, MessageSquare, Bell, ArrowRight,
  Eye, EyeOff, Copy, Check
} from 'lucide-react'
import { toast } from 'sonner'

export default function ClubWebhookTab({ clubId, isOfficer = false }) {
  const [webhooks, setWebhooks] = useState([])
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({
    total_bridges: 0,
    active_bridges: 0,
    total_dispatches: 0,
    success_rate_pct: 100,
    last_dispatch_at: null
  })
  const [loading, setLoading] = useState(true)
  const [testingId, setTestingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
  const [selectedHook, setSelectedHook] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    platform: 'DISCORD',
    channel_name: '',
    webhook_url: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    events_enabled: {
      on_event_created: true,
      on_broadcast: true,
      on_recruitment_open: true
    }
  })

  // Broadcast Form
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: ''
  })
  const [broadcasting, setBroadcasting] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const fetchWebhooks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/webhooks/clubs/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWebhooks(data.webhooks || [])
        setLogs(data.logs || [])
        setStats(data.stats || {})
      }
    } catch (err) {
      console.error('Failed to fetch webhooks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clubId) fetchWebhooks()
  }, [clubId])

  // Test Ping Dispatch
  const handleTestPing = async (hookId) => {
    try {
      setTestingId(hookId)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/webhooks/${hookId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Test ping dispatched successfully!')
        fetchWebhooks()
      } else {
        toast.error(data.error || 'Test ping failed')
      }
    } catch (e) {
      toast.error(e.message || 'Failed to dispatch test')
    } finally {
      setTestingId(null)
    }
  }

  // Toggle Active State
  const handleToggleActive = async (hook) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/webhooks/${hook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !hook.is_active })
      })
      if (!res.ok) throw new Error('Failed to toggle status')
      toast.success(hook.is_active ? 'Webhook paused' : 'Webhook activated')
      fetchWebhooks()
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Delete Webhook
  const handleDeleteHook = async (hookId) => {
    if (!window.confirm('Are you sure you want to delete this webhook bridge?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/webhooks/${hookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete webhook')
      toast.success('Webhook bridge deleted')
      fetchWebhooks()
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Create Webhook
  const handleCreateWebhook = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/webhooks/clubs/${clubId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create webhook')
      }

      toast.success(`${formData.platform} channel bridge registered!`)
      setIsAddModalOpen(false)
      setFormData({
        platform: 'DISCORD',
        channel_name: '',
        webhook_url: '',
        telegram_bot_token: '',
        telegram_chat_id: '',
        events_enabled: {
          on_event_created: true,
          on_broadcast: true,
          on_recruitment_open: true
        }
      })
      fetchWebhooks()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Live Broadcast Blast
  const handleBroadcastBlast = async (e) => {
    e.preventDefault()
    if (!broadcastData.title.trim() || !broadcastData.message.trim()) {
      toast.error('Title and message are required')
      return
    }

    try {
      setBroadcasting(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/webhooks/clubs/${clubId}/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(broadcastData)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to dispatch broadcast')
      }

      const data = await res.json()
      toast.success(`Dispatched announcement to ${data.dispatched || 0} active channel bridges!`)
      setIsBroadcastModalOpen(false)
      setBroadcastData({ title: '', message: '' })
      fetchWebhooks()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBroadcasting(false)
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <Radio className="text-primary animate-pulse" size={22} />
              Discord & Telegram Multi-Channel Webhook Bridge
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Auto-Relay
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Automatically syndicate new campus events, emergency venue changes, and recruitment calls directly to your club's official Discord & Telegram groups.
          </p>
        </div>

        {isOfficer && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-border hover:bg-surface-muted text-xs font-semibold text-text flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send size={13} className="text-primary" />
              <span>Instant Broadcast</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>Connect Channel</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Active Bridges</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Radio size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-text mt-2">
            {stats.active_bridges || 0} / {stats.total_bridges || 0}
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Channels listening for dispatches
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Total Relays</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Zap size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.total_dispatches || 0} Sent
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Automated event & broadcast notifications
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Delivery Reliability</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-2">
            {stats.success_rate_pct || 100}%
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Successful HTTP delivery responses
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Last Sync Activity</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-base font-bold text-purple-600 dark:text-purple-400 mt-2 truncate">
            {stats.last_dispatch_at ? new Date(stats.last_dispatch_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5 block">
            Most recent outbound ping
          </span>
        </div>
      </div>

      {/* CONNECTED BRIDGES LIST */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
          <Radio size={15} className="text-primary" />
          Configured Channel Bridges
        </h3>

        {loading ? (
          <div className="p-10 text-center text-text-secondary text-sm font-semibold animate-pulse">
            Fetching webhook bridges...
          </div>
        ) : webhooks.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-surface rounded-2xl border border-dashed border-border space-y-3">
            <Radio size={36} className="mx-auto text-text-secondary/50" />
            <h4 className="text-base font-bold text-text">No External Webhooks Connected</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Connect your club's Discord #announcements channel or Telegram broadcast group to automatically syndicate club updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {webhooks.map(hook => {
              const isDiscord = hook.platform === 'DISCORD'
              const isTelegram = hook.platform === 'TELEGRAM'
              const events = hook.events_enabled || {}

              return (
                <div
                  key={hook.id}
                  className={`p-5 rounded-2xl border transition-all bg-white dark:bg-surface shadow-sm space-y-4 ${
                    hook.is_active ? 'border-border hover:border-primary/40' : 'border-border/60 opacity-60'
                  }`}
                >
                  {/* Top Bar: Platform Badge & Controls */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Platform Icon Avatar */}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                        isDiscord ? 'bg-[#5865F2]' : isTelegram ? 'bg-[#229ED9]' : 'bg-amber-600'
                      }`}>
                        {isDiscord ? '👾' : isTelegram ? '✈️' : '💬'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-text">{hook.channel_name || hook.platform}</h4>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            hook.is_active 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                              : 'bg-surface-dim text-text-secondary'
                          }`}>
                            {hook.is_active ? 'Active Relay' : 'Paused'}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-text-secondary block">
                          {isDiscord ? 'Discord Webhook Embed' : isTelegram ? 'Telegram Bot Channel' : 'Slack Webhook'}
                        </span>
                      </div>
                    </div>

                    {isOfficer && (
                      <div className="flex items-center gap-1.5">
                        {/* Toggle active switch */}
                        <button
                          onClick={() => handleToggleActive(hook)}
                          className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                            hook.is_active ? 'bg-primary' : 'bg-surface-dim border border-border'
                          }`}
                          title={hook.is_active ? 'Pause webhook' : 'Activate webhook'}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            hook.is_active ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>

                        <button
                          onClick={() => handleDeleteHook(hook.id)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-500/10 transition-colors"
                          title="Delete webhook"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Destination / Endpoint Box */}
                  <div className="p-3 bg-surface-dim rounded-xl border border-border text-xs flex items-center justify-between gap-2 font-mono">
                    <span className="truncate text-text-secondary">
                      {isDiscord ? (hook.masked_webhook_url || 'https://discord.com/api/webhooks/...') : (hook.telegram_chat_id || 'Telegram Channel ID')}
                    </span>
                    <button
                      onClick={() => copyToClipboard(isDiscord ? (hook.webhook_url || '') : (hook.telegram_chat_id || ''), hook.id)}
                      className="text-text-secondary hover:text-text p-1 shrink-0"
                      title="Copy endpoint"
                    >
                      {copiedId === hook.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>

                  {/* Event Triggers Badges */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                      Active Event Triggers
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                        events.on_event_created 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-surface-dim text-text-secondary/60 border-border line-through'
                      }`}>
                        🎉 Event Published
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                        events.on_broadcast 
                          ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                          : 'bg-surface-dim text-text-secondary/60 border-border line-through'
                      }`}>
                        🚨 Urgent Broadcast
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                        events.on_recruitment_open 
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' 
                          : 'bg-surface-dim text-text-secondary/60 border-border line-through'
                      }`}>
                        💼 Auditions Open
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Status & Test Ping Button */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      {hook.last_status === 'SUCCESS' ? (
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      ) : hook.last_status === 'FAILED' ? (
                        <XCircle size={14} className="text-red-600 shrink-0" />
                      ) : (
                        <Clock size={14} className="text-text-secondary shrink-0" />
                      )}
                      <span className="text-[11px]">
                        {hook.last_triggered_at ? `Last sent ${new Date(hook.last_triggered_at).toLocaleDateString('en-IN')}` : 'Never dispatched'}
                      </span>
                    </div>

                    {isOfficer && (
                      <button
                        onClick={() => handleTestPing(hook.id)}
                        disabled={testingId === hook.id}
                        className="px-3 py-1.5 rounded-xl border border-border bg-surface-dim hover:bg-surface-muted text-[11px] font-bold text-text flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={testingId === hook.id ? 'animate-spin' : ''} />
                        <span>{testingId === hook.id ? 'Pinging...' : 'Test Ping'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* DELIVERY AUDIT LOG TABLE */}
      {logs.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={15} className="text-primary" />
            Outbound Dispatch Audit Log
          </h3>

          <div className="bg-white dark:bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-dim border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Platform</th>
                    <th className="py-2.5 px-4">Event Type</th>
                    <th className="py-2.5 px-4">Summary</th>
                    <th className="py-2.5 px-4 text-right">HTTP Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-surface-dim/40 transition-colors">
                      <td className="py-2.5 px-4 text-text-secondary font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-text">
                        {log.platform === 'DISCORD' ? '👾 Discord' : '✈️ Telegram'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-surface-dim border border-border text-primary">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-text-secondary truncate max-w-xs">
                        {log.payload_summary || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          log.status === 'SUCCESS' 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'
                        }`}>
                          {log.status === 'SUCCESS' ? `${log.status_code || 200} OK` : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD WEBHOOK MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Radio className="text-primary" size={20} />
                  Connect New Channel Bridge
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Set up automatic event syndicate to Discord or Telegram.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              {/* Platform Selector Tabs */}
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                  Destination Platform *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, platform: 'DISCORD' })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      formData.platform === 'DISCORD'
                        ? 'border-[#5865F2] bg-[#5865F2]/10 ring-2 ring-[#5865F2]/30'
                        : 'border-border bg-surface-dim hover:bg-surface-muted'
                    }`}
                  >
                    <div className="text-2xl mb-1">👾</div>
                    <span className="text-xs font-bold text-text block">Discord Webhook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, platform: 'TELEGRAM' })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      formData.platform === 'TELEGRAM'
                        ? 'border-[#229ED9] bg-[#229ED9]/10 ring-2 ring-[#229ED9]/30'
                        : 'border-border bg-surface-dim hover:bg-surface-muted'
                    }`}
                  >
                    <div className="text-2xl mb-1">✈️</div>
                    <span className="text-xs font-bold text-text block">Telegram Bot</span>
                  </button>
                </div>
              </div>

              {/* Channel Label */}
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Channel Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={formData.platform === 'DISCORD' ? 'e.g. #official-announcements' : 'e.g. @pict_acm_updates'}
                  value={formData.channel_name}
                  onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              {/* Discord Specific Fields */}
              {formData.platform === 'DISCORD' && (
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Discord Webhook URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://discord.com/api/webhooks/..."
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-text-secondary mt-1">
                    Discord: Server Settings ➔ Integrations ➔ Webhooks ➔ Copy Webhook URL.
                  </p>
                </div>
              )}

              {/* Telegram Specific Fields */}
              {formData.platform === 'TELEGRAM' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      Telegram Bot Token *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                      value={formData.telegram_bot_token}
                      onChange={(e) => setFormData({ ...formData, telegram_bot_token: e.target.value })}
                      className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      Telegram Chat ID / Channel Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="@your_club_channel or -100123456789"
                      value={formData.telegram_chat_id}
                      onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                      className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                    />
                    <p className="text-[11px] text-text-secondary mt-1">
                      Ensure your bot is added as an <strong>Administrator</strong> with post messages permission.
                    </p>
                  </div>
                </div>
              )}

              {/* Event Triggers Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-xs font-bold text-text-secondary block">
                  Select Event Triggers
                </span>
                <label className="flex items-center gap-2.5 text-xs text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.events_enabled.on_event_created}
                    onChange={(e) => setFormData({
                      ...formData,
                      events_enabled: { ...formData.events_enabled, on_event_created: e.target.checked }
                    })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Automatically post when new campus event is published</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.events_enabled.on_broadcast}
                    onChange={(e) => setFormData({
                      ...formData,
                      events_enabled: { ...formData.events_enabled, on_broadcast: e.target.checked }
                    })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Automatically post urgent room change / attendee broadcasts</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.events_enabled.on_recruitment_open}
                    onChange={(e) => setFormData({
                      ...formData,
                      events_enabled: { ...formData.events_enabled, on_recruitment_open: e.target.checked }
                    })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Automatically post when audition / recruitment drive opens</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
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
                  Save & Connect Bridge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE INSTANT BROADCAST MODAL */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Send className="text-primary" size={20} />
                  Instant Live Channel Broadcast
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Blast a direct announcement to all {stats.active_bridges || 0} active external channel bridges.
                </p>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-secondary hover:text-text transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastBlast} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Announcement Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workshop Starting in 15 Minutes at F-102 Lab"
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the message body to be formatted and relayed to Discord & Telegram..."
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-dim border border-border text-xs text-text focus:outline-none focus:border-primary resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-surface-dim rounded-2xl border border-border text-xs space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                  Delivery Channels Target
                </span>
                <p className="text-text font-medium text-[11px]">
                  Will be simultaneously formatted and pushed to: <strong>{webhooks.filter(w => w.is_active).map(w => w.channel_name).join(', ') || 'No active channels'}</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-dim hover:bg-surface-muted text-text text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{broadcasting ? 'Broadcasting...' : 'Blast Announcement Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
