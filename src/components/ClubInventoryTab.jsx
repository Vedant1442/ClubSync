import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Cpu, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  MapPin, 
  User, 
  ShieldCheck, 
  Send, 
  Filter, 
  Sparkles,
  ArrowRight,
  RotateCcw,
  X
} from 'lucide-react'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ClubInventoryTab({ club, isOfficer, currentUser }) {
  const [items, setItems] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [requestQuantity, setRequestQuantity] = useState(1)
  const [requestPurpose, setRequestPurpose] = useState('')
  const [requestReturnDate, setRequestReturnDate] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // Add Item Modal (Officers)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Microcontroller',
    serial_number: '',
    total_quantity: 1,
    storage_location: '',
    condition: 'Good'
  })
  const [submittingItem, setSubmittingItem] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [itemsRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/api/inventory/clubs/${club.id}/items`),
        fetch(`${API_URL}/api/inventory/clubs/${club.id}/requests`, { headers })
      ])

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        setItems(itemsData)
      }
      if (requestsRes.ok) {
        const reqData = await requestsRes.json()
        setRequests(reqData)
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (club?.id) {
      fetchData()
    }
  }, [club?.id])

  const handleOpenRequest = (item) => {
    setSelectedItem(item)
    setRequestQuantity(1)
    setRequestPurpose('')
    // Default return date: 5 days from now
    const d = new Date()
    d.setDate(d.getDate() + 5)
    setRequestReturnDate(d.toISOString().split('T')[0])
    setShowRequestModal(true)
  }

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    if (!selectedItem) return
    setSubmittingRequest(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/inventory/clubs/${club.id}/items/${selectedItem.id}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: requestQuantity,
          purpose: requestPurpose.trim(),
          return_date: requestReturnDate
        })
      })

      if (res.ok) {
        toast.success(`Checkout requested for ${selectedItem.name}! Officers will review.`)
        setShowRequestModal(false)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to submit checkout request')
      }
    } catch (err) {
      toast.error('Network error submitting request')
    } finally {
      setSubmittingRequest(false)
    }
  }

  const handleUpdateStatus = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/inventory/clubs/${club.id}/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        const actionLabel = status === 'approved' ? 'Loan approved' : status === 'returned' ? 'Item marked as returned' : 'Request rejected'
        toast.success(actionLabel)
        fetchData()
      } else {
        toast.error('Failed to update status')
      }
    } catch (err) {
      toast.error('Network error updating loan status')
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!newItem.name.trim()) return
    setSubmittingItem(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/inventory/clubs/${club.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newItem)
      })

      if (res.ok) {
        toast.success('Equipment cataloged successfully!')
        setShowAddModal(false)
        setNewItem({
          name: '',
          category: 'Microcontroller',
          serial_number: '',
          total_quantity: 1,
          storage_location: '',
          condition: 'Good'
        })
        fetchData()
      } else {
        toast.error('Failed to add item')
      }
    } catch (err) {
      toast.error('Network error adding item')
    } finally {
      setSubmittingItem(false)
    }
  }

  const categories = ['All', ...new Set(items.map(i => i.category || 'Hardware'))]

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.serial_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.storage_location || '').toLowerCase().includes(search.toLowerCase())

    if (categoryFilter !== 'All') {
      return matchesSearch && item.category === categoryFilter
    }
    return matchesSearch
  })

  // KPI stats
  const totalUnits = items.reduce((acc, i) => acc + (i.total_quantity || 0), 0)
  const availableUnits = items.reduce((acc, i) => acc + (i.available_quantity || 0), 0)
  const onLoanUnits = totalUnits - availableUnits
  const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'approved')

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-500/10 via-surface to-surface border border-border rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Lab & Makerspace Inventory
            </span>
            <span className="text-xs text-text-secondary">Official Hardware & Equipment Tracker</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-text mt-1 flex items-center gap-2">
            <Package className="text-emerald-500" size={24} />
            {club.name} • Equipment Repository
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-xl">
            Borrow sensors, microcontrollers, drones, camera optics, and fabrication tools for student projects and hackathons.
          </p>
        </div>

        {isOfficer && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <Plus size={16} />
              <span>Catalog New Gear</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-text-secondary flex items-center justify-between mb-1">
            <span>Total Units Cataloged</span>
            <Layers size={14} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-text">{totalUnits}</div>
          <div className="text-[11px] text-text-secondary mt-1">{items.length} distinct item types</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-text-secondary flex items-center justify-between mb-1">
            <span>Available for Loan</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{availableUnits}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Ready for checkout</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-text-secondary flex items-center justify-between mb-1">
            <span>Currently on Loan</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">{onLoanUnits}</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">In active research / testing</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-text-secondary flex items-center justify-between mb-1">
            <span>Pending Approvals</span>
            <AlertTriangle size={14} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600">
            {requests.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-[11px] text-text-secondary mt-1">Officer review required</div>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-text-secondary flex items-center gap-1 mr-1">
            <Filter size={13} /> Filter:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-surface border border-border text-text-secondary hover:text-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search equipment, serial, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Equipment Catalog Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-2" />
          <p className="text-xs text-text-secondary">Syncing equipment repository...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-3xl bg-surface border border-border border-dashed">
          <Package size={36} className="mx-auto text-text-secondary/40 mb-2" />
          <h4 className="font-bold text-sm text-text">No equipment found matching criteria</h4>
          <p className="text-xs text-text-secondary mt-1">Try another category or search keyword.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const isAvailable = item.available_quantity > 0
            return (
              <div 
                key={item.id}
                className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-surface-dim border border-border text-text-secondary truncate">
                      {item.category || 'Hardware'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.condition === 'Mint' 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                        : item.condition === 'Good'
                        ? 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {item.condition}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-text line-clamp-1">{item.name}</h3>

                  <div className="space-y-1.5 mt-3 text-xs text-text-secondary">
                    {item.serial_number && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-text-secondary/80">S/N:</span>
                        <span className="font-semibold text-text">{item.serial_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <MapPin size={12} className="text-primary shrink-0" />
                      <span className="truncate">{item.storage_location || 'Club Workshop'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-text-secondary uppercase font-semibold">Available</div>
                    <div className="text-sm font-black text-text">
                      <span className={isAvailable ? 'text-emerald-600' : 'text-red-500'}>
                        {item.available_quantity}
                      </span>
                      <span className="text-text-secondary text-xs font-normal"> / {item.total_quantity}</span>
                    </div>
                  </div>

                  {isAvailable ? (
                    <button
                      onClick={() => handleOpenRequest(item)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Checkout</span>
                      <ArrowRight size={13} />
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-surface-dim border border-border text-[11px] font-medium text-text-secondary">
                      All on Loan
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Active Loans & Requests Management Board */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-text flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Active Hardware Loans & Checkout Requests
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Audit student equipment custody, return schedules, and approve loans</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-dim border border-border text-text-secondary">
            {requests.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-surface-dim border-b border-border z-10 text-text-secondary uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">Equipment Item</th>
                <th className="py-3 px-4 font-bold">Borrower (Student)</th>
                <th className="py-3 px-4 font-bold">PICT PRN & Branch</th>
                <th className="py-3 px-4 font-bold">Qty</th>
                <th className="py-3 px-4 font-bold">Purpose / Project</th>
                <th className="py-3 px-4 font-bold">Return Due</th>
                <th className="py-3 px-4 font-bold">Status</th>
                {isOfficer && <th className="py-3 px-4 font-bold text-right">Officer Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={isOfficer ? 8 : 7} className="py-8 text-center text-text-secondary text-xs">
                    No active loans or requests recorded yet.
                  </td>
                </tr>
              ) : (
                requests.map(req => {
                  const isPending = req.status === 'pending'
                  const isApproved = req.status === 'approved'
                  const isReturned = req.status === 'returned'
                  const isRejected = req.status === 'rejected'

                  return (
                    <tr key={req.id} className="hover:bg-surface-dim/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-text whitespace-nowrap">
                        {req.item_name}
                      </td>
                      <td className="py-3 px-4 font-medium text-text whitespace-nowrap">
                        {req.user_name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-text-secondary">
                        <span className="font-mono text-primary font-semibold">{req.college_id}</span>
                        <span className="block text-[10px]">{req.branch}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-text whitespace-nowrap">
                        {req.quantity}
                      </td>
                      <td className="py-3 px-4 text-text-secondary max-w-xs truncate">
                        {req.purpose}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-text font-medium">
                        {new Date(req.return_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px] border border-emerald-500/20">
                            Active Loan
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold text-[10px] border border-amber-500/20">
                            Pending Review
                          </span>
                        )}
                        {isReturned && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary font-medium text-[10px]">
                            Returned ✓
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-medium text-[10px]">
                            Rejected
                          </span>
                        )}
                      </td>

                      {isOfficer && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isPending && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(req.id, 'approved')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                className="px-2 py-1 rounded-lg bg-surface-dim hover:bg-red-500/10 text-text-secondary hover:text-red-500 font-medium text-[11px] transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {isApproved && (
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'returned')}
                              className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] transition-colors flex items-center gap-1 ml-auto"
                            >
                              <RotateCcw size={12} />
                              <span>Mark Returned</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Checkout Modal */}
      {showRequestModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-text">Request Equipment Checkout</h3>
                <p className="text-xs text-text-secondary">{selectedItem.name}</p>
              </div>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="w-7 h-7 rounded-full bg-surface-dim flex items-center justify-center text-text-secondary hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-text mb-1">Borrower Information</label>
                <div className="p-2.5 rounded-xl bg-surface-dim border border-border text-text-secondary">
                  <span className="font-semibold text-text">{currentUser?.name || 'Student'}</span> • {currentUser?.college_id || 'PRN Verified'}
                  <span className="block text-[11px] text-text-secondary mt-0.5">{currentUser?.branch || 'Engineering Student'}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-text mb-1">Quantity to Borrow (Max: {selectedItem.available_quantity})</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.available_quantity}
                  value={requestQuantity}
                  onChange={e => setRequestQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-text mb-1">Project Purpose / Reason for Loan *</label>
                <textarea
                  rows={2}
                  value={requestPurpose}
                  onChange={e => setRequestPurpose(e.target.value)}
                  placeholder="e.g. RoboRave arena obstacle detection prototyping in F-301 lab"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-text mb-1">Expected Return Date *</label>
                <input
                  type="date"
                  value={requestReturnDate}
                  onChange={e => setRequestReturnDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-text-secondary font-semibold hover:bg-surface-dim"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Checkout Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Equipment Modal (Officers) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-text">Catalog New Lab Equipment</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-surface-dim flex items-center justify-center text-text-secondary hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-text mb-1">Equipment Name *</label>
                <input
                  type="text"
                  placeholder="e.g. ESP32-CAM AI Camera Module"
                  value={newItem.name}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-text mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none"
                  >
                    <option value="Microcontroller">Microcontroller</option>
                    <option value="Single Board Computer">Single Board Computer</option>
                    <option value="IoT & Wireless">IoT & Wireless</option>
                    <option value="Motors & ESC">Motors & ESC</option>
                    <option value="Optics & Imaging">Optics & Imaging</option>
                    <option value="Audio Gear">Audio Gear</option>
                    <option value="Lab Instrumentation">Lab Instrumentation</option>
                    <option value="Power Systems">Power Systems</option>
                    <option value="Fabrication Consumables">Fabrication Consumables</option>
                    <option value="Hardware">Hardware</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-text mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.total_quantity}
                    onChange={e => setNewItem(prev => ({ ...prev, total_quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-text mb-1">Serial / Asset Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. PICT-ROBO-ESP-01"
                    value={newItem.serial_number}
                    onChange={e => setNewItem(prev => ({ ...prev, serial_number: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-text mb-1">Condition</label>
                  <select
                    value={newItem.condition}
                    onChange={e => setNewItem(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none"
                  >
                    <option value="Mint">Mint</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Maintenance">Needs Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-text mb-1">Storage Location / Bay</label>
                <input
                  type="text"
                  placeholder="e.g. Mech Workshop Locker 3B"
                  value={newItem.storage_location}
                  onChange={e => setNewItem(prev => ({ ...prev, storage_location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-text-secondary font-semibold hover:bg-surface-dim"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingItem}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  {submittingItem ? 'Cataloging...' : 'Catalog Gear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
