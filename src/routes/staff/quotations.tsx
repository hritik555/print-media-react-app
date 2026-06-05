import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet, apiPost } from '../../lib/api'

export const Route = createFileRoute('/staff/quotations')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // if (!user.roles?.includes('admin')) throw redirect({ to: '/' })
    // return { user }
  },
  component: AdminQuotationsPage,
})

interface AdminQuotation {
  id: string
  quoteNo: string
  date: string
  rawDate: Date
  products: string
  amount: number
  status: 'APPROVED' | 'SENT' | 'DRAFT' | 'PENDING'
}

interface LineItem {
  id: string
  product: string
  itemId?: string
  qty: number
  unit: string
  price: number
  printSide: string
  additionalServices: {
    cutting: boolean
    lamination: boolean
    halfCut: boolean
    roundCorner: boolean
    spiralWiro: boolean
  }
  showProductSuggestions?: boolean
}

const MOCK: AdminQuotation[] = [
  { id: '1', quoteNo: 'QT-2026-001', date: '15 Apr 2026', rawDate: new Date('2026-04-15'), products: 'A4 Letterhead, Gumming', amount: 8200, status: 'APPROVED' },
  { id: '2', quoteNo: 'QT-2026-002', date: '10 Apr 2026', rawDate: new Date('2026-04-10'), products: '250 GSM Color Print', amount: 5750, status: 'SENT' },
]

function statusColor(status: string) {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-700'
    case 'SENT': return 'bg-blue-100 text-blue-600'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700'
    case 'DRAFT': return 'bg-gray-100 text-gray-500'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function AdminQuotationsPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<AdminQuotation[]>(MOCK)
  const [loading, setLoading] = useState(true)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // API Data
  const [itemsList, setItemsList] = useState<any[]>([])
  const [partiesList, setPartiesList] = useState<any[]>([])

  // LIST PAGE STATE
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    quoteNo: '',
    date: '',
    products: '',
    amount: '',
    status: 'ALL',
  })
  const [sortField, setSortField] = useState<'quoteNo' | 'rawDate' | 'products' | 'amount' | 'status'>('rawDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // FULL PAGE CREATOR STATE
  const [partySearch, setPartySearch] = useState('')
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const [showPartySuggestions, setShowPartySuggestions] = useState(false)
  const [quoteDate, setQuoteDate] = useState('')
  const [description, setDescription] = useState('')

  // Line items state
  const defaultServices = { cutting: false, lamination: false, halfCut: false, roundCorner: false, spiralWiro: false }
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', product: '', qty: 1, unit: 'Sheets', price: 0, printSide: 'SINGLE_SIDE', additionalServices: { ...defaultServices } }
  ])

  const [useReferralPoints, setUseReferralPoints] = useState(false)
  const [activeServiceModalLineId, setActiveServiceModalLineId] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }
    apiGet<AdminQuotation[]>('/api/admin/quotations')
      .then((data) => {
        const formatted = data.map((q) => ({
          ...q,
          rawDate: q.rawDate ? new Date(q.rawDate) : new Date(q.date),
        }))
        setQuotes(formatted.length > 0 ? formatted : MOCK)
      })
      .catch(() => setQuotes(MOCK))
      .finally(() => setLoading(false))

    // Fetch lists
    apiGet<any[]>('/api/admin/items').then(res => setItemsList(res || [])).catch(() => {})
    apiGet<any[]>('/api/admin/parties').then(res => setPartiesList(res || [])).catch(() => {})
  }, [ready, user, navigate])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const copyLink = (quoteNo: string) => {
    const shareUrl = `${window.location.origin}/share/quote/${quoteNo}`
    navigator.clipboard.writeText(shareUrl)
      .then(() => triggerToast(`Copied share link for ${quoteNo}!`))
      .catch(() => triggerToast('Failed to copy link.'))
  }

  const downloadPDF = (quoteNo: string) => {
    triggerToast(`PDF downloaded for ${quoteNo}!`)
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const openCreator = () => {
    setPartySearch('')
    setSelectedPartyId(null)
    setShowPartySuggestions(false)
    setQuoteDate(todayStr)
    setDescription('')
    setLineItems([{ id: '1', product: '', qty: 1, unit: 'Sheets', price: 0, printSide: 'SINGLE_SIDE', additionalServices: { ...defaultServices } }])
    setUseReferralPoints(false)
    setIsCreating(true)
  }

  const handleDateChange = (val: string) => {
    if (!val) {
      setQuoteDate('')
      return
    }
    const selectedDate = new Date(val)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (selectedDate > today) {
      triggerToast('Future dates are not allowed! Resetting to today.')
      setQuoteDate(todayStr)
    } else {
      setQuoteDate(val)
    }
  }

  const addLineItem = () => {
    const nextId = String(Date.now())
    setLineItems([...lineItems, { id: nextId, product: '', qty: 1, unit: 'Sheets', price: 0, printSide: 'SINGLE_SIDE', additionalServices: { ...defaultServices } }])
  }

  const deleteLineItem = (id: string) => {
    if (lineItems.length === 1) {
      triggerToast('At least one line item is required!')
      return
    }
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, val: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: val }
        if (field === 'product') {
          const matched = itemsList.find(p => p.name?.toLowerCase() === String(val).toLowerCase())
          if (matched) {
            updated.price = matched.salePrice || 0
            updated.unit = matched.unit || 'Nos'
            updated.itemId = matched.id
            updated.showProductSuggestions = false
          }
        }
        return updated
      }
      return item
    }))
  }
  
  const updateLineItemServices = (id: string, services: any) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, additionalServices: services } : item))
  }

  const handleCreateParty = async (name: string) => {
    try {
      const res = await apiPost<any>('/api/admin/parties', { listingName: name })
      setPartiesList([...partiesList, res])
      setPartySearch(res.listingName)
      setSelectedPartyId(res.id)
      setShowPartySuggestions(false)
      triggerToast(`Party '${name}' created successfully!`)
    } catch (e) {
      triggerToast('Failed to create party.')
    }
  }

  // Cost Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0)
  
  let additionalTotal = 0
  lineItems.forEach(item => {
      let lineAdd = 0
      if (item.additionalServices.cutting) lineAdd += 50
      if (item.additionalServices.lamination) lineAdd += 100
      if (item.additionalServices.halfCut) lineAdd += 100
      if (item.additionalServices.roundCorner) lineAdd += 100
      if (item.additionalServices.spiralWiro) lineAdd += 100
      additionalTotal += lineAdd
  })

  const gst = 0.18 * (subtotal + additionalTotal)
  const grandTotal = subtotal + additionalTotal + gst
  const pointsDeduction = useReferralPoints ? Math.min(320, grandTotal) : 0
  const amountToPay = grandTotal - pointsDeduction

  const saveQuotationObj = () => {
    if (!partySearch.trim()) {
      alert('Party Name is required.')
      return
    }
    if (lineItems.some(item => !item.product.trim())) {
      alert('Line items must have valid product names.')
      return
    }

    const nextQuoteNum = `QT-2026-00${quotes.length + 1}`
    const dateObj = quoteDate ? new Date(quoteDate) : new Date()
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, ' ')

    const productsSummary = lineItems.map(item => item.product).join(', ')

    const newQ: AdminQuotation = {
      id: String(quotes.length + 1),
      quoteNo: nextQuoteNum,
      date: formattedDate,
      rawDate: dateObj,
      products: productsSummary.length > 30 ? productsSummary.substring(0, 27) + '...' : productsSummary,
      amount: amountToPay,
      status: 'APPROVED',
    }

    setQuotes((prev) => [newQ, ...prev])
    setIsCreating(false)
    triggerToast(`Successfully saved Quotation ${nextQuoteNum}!`)
  }

  const filteredQuotes = quotes
    .filter((q) => {
      const matchQuoteNo = q.quoteNo.toLowerCase().includes(filters.quoteNo.toLowerCase())
      const matchProducts = q.products.toLowerCase().includes(filters.products.toLowerCase())
      const matchDate = q.date.toLowerCase().includes(filters.date.toLowerCase())
      const matchStatus = filters.status === 'ALL' || q.status === filters.status
      const matchAmount = filters.amount === '' || String(q.amount).includes(filters.amount)
      return matchQuoteNo && matchProducts && matchDate && matchStatus && matchAmount
    })
    .sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]
      if (sortField === 'rawDate') {
        valA = a.rawDate.getTime()
        valB = b.rawDate.getTime()
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      } else {
        const numA = (valA as number) || 0
        const numB = (valB as number) || 0
        return sortOrder === 'asc' ? numA - numB : numB - numA
      }
    })

  const renderTableHeader = (
    label: string,
    field: typeof sortField,
    filterKey: keyof typeof filters,
    type: 'text' | 'select' = 'text'
  ) => {
    const isSorted = sortField === field
    const isOpen = activeFilterDropdown === filterKey

    return (
      <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider relative">
        <div className="flex items-center gap-1.5 select-none">
          <span
            onClick={() => handleSort(field)}
            className="cursor-pointer hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            {label}
            {isSorted ? (
              sortOrder === 'asc' ? '▲' : '▼'
            ) : (
              <span className="text-gray-300">↕</span>
            )}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setActiveFilterDropdown(isOpen ? null : filterKey)
            }}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              filters[filterKey] && filters[filterKey] !== 'ALL' ? 'text-purple-700 bg-purple-50' : 'text-gray-400'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591l.004.005v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
          </button>
        </div>

        {isOpen && (
          <div
            className="absolute top-10 left-5 bg-white border border-gray-100 rounded-xl shadow-xl p-4 z-30 min-w-56 text-left normal-case tracking-normal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500">Filter {label}</span>
              <button
                type="button"
                onClick={() => {
                  setFilters({ ...filters, [filterKey]: filterKey === 'status' ? 'ALL' : '' })
                  setActiveFilterDropdown(null)
                }}
                className="text-[10px] text-purple-700 font-semibold hover:underline"
              >
                Clear
              </button>
            </div>
            {type === 'text' ? (
              <input
                type="text"
                placeholder={`Search ${label}...`}
                value={filters[filterKey]}
                onChange={(e) => setFilters({ ...filters, [filterKey]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                autoFocus
              />
            ) : (
              <select
                value={filters[filterKey]}
                onChange={(e) => setFilters({ ...filters, [filterKey]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="SENT">SENT</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING">PENDING</option>
              </select>
            )}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveFilterDropdown(null)}
                className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-[10px] rounded-md transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </th>
    )
  }

  if (!ready || loading) return <LoadingScreen />

  const matchedParties = partiesList.filter(p => p.listingName?.toLowerCase().includes(partySearch.toLowerCase()))
  const isExactPartyMatch = matchedParties.some(p => p.listingName?.toLowerCase() === partySearch.toLowerCase())

  return (
    <div className="min-h-screen bg-gray-50" onClick={() => { setActiveFilterDropdown(null); setShowPartySuggestions(false) }}>
      <AdminNav activeTab="quotations" role="staff" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="sidebar-content">
        
        {!isCreating ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">My Quotations</h1>
                  <p className="text-gray-500 text-sm mt-1">Generate, track, and share product quotations</p>
                </div>
              </div>
              <button
                onClick={openCreator}
                className="px-4 py-2.5 bg-[#8b5cf6] hover:bg-purple-800 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors focus:outline-none"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Create Quotation</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/50">
                    {renderTableHeader('QUOTE #', 'quoteNo', 'quoteNo')}
                    {renderTableHeader('DATE', 'rawDate', 'date')}
                    {renderTableHeader('PRODUCTS', 'products', 'products')}
                    {renderTableHeader('AMOUNT', 'amount', 'amount')}
                    {renderTableHeader('STATUS', 'status', 'status', 'select')}
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">QUOTE PDF</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">QUOTE LINK</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((q) => (
                    <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">{q.quoteNo}</td>
                      <td className="px-5 py-4 text-gray-500">{q.date}</td>
                      <td className="px-5 py-4 text-gray-700 font-medium">{q.products}</td>
                      <td className="px-5 py-4 font-extrabold text-purple-900">
                        ₹{q.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${statusColor(q.status)}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => downloadPDF(q.quoteNo)}
                          type="button"
                          className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors focus:outline-none"
                        >
                          📄 PDF
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => copyLink(q.quoteNo)}
                          type="button"
                          className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors focus:outline-none"
                        >
                          🔗 Link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredQuotes.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">No quotations found</div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Quotation</h1>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                ← Back
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-8 space-y-8">
              
              <div className="space-y-4">
                <span className="block text-xs font-extrabold text-purple-700 uppercase tracking-widest border-b border-gray-100 pb-2">Details</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 mb-1">PARTY NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="Type to search or create party..."
                      value={partySearch}
                      onClick={(e) => { e.stopPropagation(); setShowPartySuggestions(true) }}
                      onChange={(e) => { setPartySearch(e.target.value); setShowPartySuggestions(true) }}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 font-medium"
                    />
                    
                    {showPartySuggestions && partySearch && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-40 max-h-48 overflow-y-auto">
                        {matchedParties.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setPartySearch(p.listingName)
                              setSelectedPartyId(p.id)
                              setShowPartySuggestions(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium border-b border-gray-50 last:border-0"
                          >
                            {p.listingName}
                          </button>
                        ))}
                        {!isExactPartyMatch && (
                          <button
                            type="button"
                            onClick={() => handleCreateParty(partySearch)}
                            className="w-full text-left px-4 py-2.5 text-xs text-purple-700 hover:bg-purple-100 transition-colors font-bold border-b border-gray-50"
                          >
                            + Create Party "{partySearch}"
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">QUOTE DATE *</label>
                    <input
                      type="date"
                      required
                      max={todayStr}
                      value={quoteDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 font-medium"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    placeholder="General description or notes for the quotation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <span className="block text-xs font-extrabold text-purple-700 uppercase tracking-widest border-b border-gray-100 pb-2">Line Items</span>
                
                <div className="border border-gray-200/80 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">PRODUCT</th>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-28">PRINT SIDE</th>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">QTY</th>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">UNIT</th>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">PRICE (₹)</th>
                        <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">SERVICES</th>
                        <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-12">DEL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => {
                        const matchedProductsList = itemsList.filter(p =>
                          p.name?.toLowerCase().includes(item.product.toLowerCase())
                        )

                        return (
                          <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/20">
                            <td className="px-4 py-3 relative">
                              <input
                                type="text"
                                placeholder="Search product..."
                                value={item.product}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateLineItem(item.id, 'showProductSuggestions', true)
                                }}
                                onChange={(e) => {
                                  updateLineItem(item.id, 'product', e.target.value)
                                  updateLineItem(item.id, 'showProductSuggestions', true)
                                }}
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                              />
                              {item.showProductSuggestions && item.product && matchedProductsList.length > 0 && (
                                <div className="absolute left-4 right-4 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-40 max-h-40 overflow-y-auto">
                                  {matchedProductsList.map((pr) => (
                                    <button
                                      key={pr.id}
                                      type="button"
                                      onClick={() => {
                                        updateLineItem(item.id, 'product', pr.name)
                                        updateLineItem(item.id, 'price', pr.salePrice || 0)
                                        updateLineItem(item.id, 'unit', pr.unit || 'Nos')
                                        updateLineItem(item.id, 'itemId', pr.id)
                                        updateLineItem(item.id, 'showProductSuggestions', false)
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium border-b border-gray-50 last:border-0"
                                    >
                                      {pr.name} (₹{pr.salePrice} / {pr.unit})
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <select
                                value={item.printSide}
                                onChange={(e) => updateLineItem(item.id, 'printSide', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                              >
                                <option value="SINGLE_SIDE">Single</option>
                                <option value="DOUBLE_SIDE">Double</option>
                              </select>
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={item.qty}
                                min={1}
                                onChange={(e) => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 font-medium"
                              />
                            </td>

                            <td className="px-4 py-3">
                              <select
                                value={item.unit}
                                onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                              >
                                <option value="Sheets">Sheets</option>
                                <option value="Nos">Nos</option>
                                <option value="Boxes">Boxes</option>
                                <option value="Packets">Packets</option>
                                <option value="Meters">Meters</option>
                              </select>
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 font-medium"
                              />
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => setActiveServiceModalLineId(item.id)}
                                className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-lg text-xs transition-colors"
                              >
                                Services
                              </button>
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteLineItem(item.id)}
                                className="p-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-4 py-2 border border-dashed border-purple-300 text-purple-700 font-bold hover:bg-purple-50 hover:border-purple-400 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors focus:outline-none"
                >
                  + Add Line Item
                </button>
              </div>

              <div className="space-y-4">
                <span className="block text-xs font-extrabold text-purple-700 uppercase tracking-widest border-b border-gray-100 pb-2">Attach Files</span>
                <div className="border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-purple-300 transition-colors select-none">
                  <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0A7 7 0 115.636 18.364l7.072-7.072a3.5 3.5 0 114.95 4.95l-2.5 2.5m-6.364-7.07a3.5 3.5 0 114.95-4.95l1.25-1.25" />
                  </svg>
                  <span className="text-xs font-bold text-slate-500">Attach print files — PDF, JPG, AI, PSD</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-start justify-between gap-8">
                
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => triggerToast('Opening payment portal...')}
                    type="button"
                    className="px-6 py-3 bg-[#702d8f] hover:bg-[#5a2273] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors focus:outline-none"
                  >
                    💳 Pay Now
                  </button>
                  <button
                    onClick={() => triggerToast('Downloading preview...')}
                    type="button"
                    className="px-5 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors focus:outline-none"
                  >
                    📄 Download PDF
                  </button>
                  <button
                    onClick={saveQuotationObj}
                    type="button"
                    className="px-5 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors focus:outline-none"
                  >
                    💾 Save Quotation
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 w-full md:max-w-sm space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Additional Services</span>
                    <span>₹{additionalTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>GST (18%)</span>
                    <span>₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200/80 my-2" />
                  <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-2">
                    <label className="inline-flex items-start gap-2.5 text-[10px] font-semibold text-slate-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useReferralPoints}
                        onChange={(e) => setUseReferralPoints(e.target.checked)}
                        className="rounded text-purple-700 focus:ring-purple-500 h-3.5 w-3.5 mt-0.5"
                      />
                      <span>
                        Use Referral Points<br />
                        <span className="text-purple-600 font-bold">(320 pts = ₹320 deduction)</span>
                      </span>
                    </label>
                  </div>

                  <div className="border-t border-slate-200/80 my-2" />
                  <div className="flex items-center justify-between text-base font-extrabold text-purple-950">
                    <span>Amount to Pay</span>
                    <span>₹{amountToPay.toFixed(2)}</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {activeServiceModalLineId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Additional Services</h3>
              <button onClick={() => setActiveServiceModalLineId(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {(() => {
                const activeItem = lineItems.find(i => i.id === activeServiceModalLineId);
                if (!activeItem) return null;
                const svcs = activeItem.additionalServices;
                
                return [
                  { key: 'cutting' as const, label: 'Cutting (₹50)' },
                  { key: 'lamination' as const, label: 'Lamination (₹100)' },
                  { key: 'halfCut' as const, label: 'Half Cut (₹100)' },
                  { key: 'roundCorner' as const, label: 'Round Corner (₹100)' },
                  { key: 'spiralWiro' as const, label: 'Spiral / Wiro (₹100)' },
                ].map((s) => (
                  <label key={s.key} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-purple-50/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={svcs[s.key]}
                      onChange={(e) => {
                        updateLineItemServices(activeItem.id, { ...svcs, [s.key]: e.target.checked })
                      }}
                      className="rounded text-purple-700 focus:ring-purple-500 h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-gray-700">{s.label}</span>
                  </label>
                ))
              })()}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveServiceModalLineId(null)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-slate-800/80 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading…</div>
    </div>
  )
}
