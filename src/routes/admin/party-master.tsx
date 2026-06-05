import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet, apiPostMultipart } from '../../lib/api'
import { getServerUser } from '../../lib/auth'

export const Route = createFileRoute('/admin/party-master')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // if (!user.roles?.includes('admin')) throw redirect({ to: '/' })
    // return { user }
  },
  component: PartyMasterPage,
})

interface Party {
  id: string
  name: string // This will represent the Listing Name
  tradeName?: string // Trade Name
  type: 'customer' | 'supplier' | 'both'
  phone: string
  gstin: string
  email: string
  city: string
  state: string
  balance: number
  balanceType: 'receivable' | 'payable' | 'settled'
  billingAddress?: string
  shippingAddress?: string
  gstType?: string
  creditLimit?: number
  remarks?: string
  referenceNo?: string
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 
  'Ladakh', 'Lakshadweep', 'Puducherry'
]

const MOCK_PARTIES: Party[] = [
  { id: '1', name: 'Sharma Enterprises', tradeName: 'Sharma Prints', type: 'customer', phone: '+91 98765 43210', gstin: '27AABCS1234B1Z5', email: 'rajesh@sharma.com', city: 'Mumbai', state: 'Maharashtra', balance: 28000, balanceType: 'receivable' },
  { id: '2', name: 'Metro Print Solutions', tradeName: 'Metro Media', type: 'customer', phone: '+91 98123 45678', gstin: '07AABCM5678D1Z2', email: 'priya@metroprint.com', city: 'Delhi', state: 'Delhi', balance: 0, balanceType: 'settled' },
  { id: '3', name: 'National Paper Mills', tradeName: 'NPM Paper Co', type: 'supplier', phone: '+91 99887 65432', gstin: '24AABCN9012F1Z8', email: 'sales@nationalpaper.in', city: 'Ahmedabad', state: 'Gujarat', balance: 145000, balanceType: 'payable' },
  { id: '4', name: 'Apex Publications', tradeName: 'Apex Prints', type: 'customer', phone: '+91 99001 23456', gstin: '33AABCA3456H1Z1', email: 'sunita@apex.in', city: 'Chennai', state: 'Tamil Nadu', balance: 11200, balanceType: 'receivable' },
  { id: '5', name: 'Surya Ink Industries', tradeName: 'Surya Colors', type: 'supplier', phone: '+91 97654 32100', gstin: '29AABCS7890J1Z4', email: 'info@suryaink.com', city: 'Bangalore', state: 'Karnataka', balance: 67000, balanceType: 'payable' },
  { id: '6', name: 'Creative Studios', tradeName: 'Creative Designs', type: 'both', phone: '+91 98888 77766', gstin: '36AABCC1234L1Z7', email: 'anil@creative.com', city: 'Hyderabad', state: 'Telangana', balance: 9800, balanceType: 'receivable' },
  { id: '7', name: 'PrintTech Suppliers', tradeName: 'PrintTech Co', type: 'supplier', phone: '+91 91234 56789', gstin: '19AABCP5678N1Z3', email: 'supply@printtech.in', city: 'Kolkata', state: 'West Bengal', balance: 0, balanceType: 'settled' },
  { id: '8', name: 'Spectrum Media', tradeName: 'Spectrum Publications', type: 'customer', phone: '+91 95555 44433', gstin: '36AABCS9012P1Z6', email: 'vikram@spectrum.com', city: 'Hyderabad', state: 'Telangana', balance: 0, balanceType: 'settled' },
]

type FilterType = 'all' | 'customer' | 'supplier'

function typeBadge(type: string) {
  switch (type) {
    case 'customer': return 'bg-blue-100 text-blue-700'
    case 'supplier': return 'bg-orange-100 text-orange-700'
    case 'both': return 'bg-purple-100 text-purple-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function balanceBadge(type: string) {
  switch (type) {
    case 'receivable': return 'text-green-700'
    case 'payable': return 'text-red-600'
    default: return 'text-gray-500'
  }
}

function PartyMasterPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [parties, setParties] = useState<Party[]>(MOCK_PARTIES)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sorting State
  const [sortField, setSortField] = useState<keyof Party>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Modal Open/Tabs states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'gst' | 'balance' | 'additional'>('gst')
  
  // Modal Form Fields state
  const [partyName, setPartyName] = useState('')
  const [tradeNameInput, setTradeNameInput] = useState('')
  const [gstin, setGstin] = useState('')
  const [phone, setPhone] = useState('')
  const [gstType, setGstType] = useState('Unregistered/Consumer')
  const [stateName, setStateName] = useState('Maharashtra')
  const [cityName, setCityName] = useState('Mumbai')
  const [emailInput, setEmailInput] = useState('')
  const [balance, setBalance] = useState('0')
  const [balanceType, setBalanceType] = useState<'receivable' | 'payable' | 'settled'>('settled')
  const [billingAddress, setBillingAddress] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [creditLimit, setCreditLimit] = useState('0')
  const [remarks, setRemarks] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [partyType, setPartyType] = useState<'customer' | 'supplier' | 'both'>('customer')
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }
    apiGet<Party[]>('/api/admin/parties')
      .then(setParties)
      .catch(() => {
        const saved = localStorage.getItem('printpro_parties')
        if (saved) setParties(JSON.parse(saved))
        else localStorage.setItem('printpro_parties', JSON.stringify(MOCK_PARTIES))
      })
      .finally(() => setLoading(false))
  }, [ready, user, navigate])

  const syncParties = (newParties: Party[]) => {
    setParties(newParties)
    localStorage.setItem('printpro_parties', JSON.stringify(newParties))
  }

  const resetForm = () => {
    setPartyName('')
    setTradeNameInput('')
    setGstin('')
    setPhone('')
    setGstType('Unregistered/Consumer')
    setStateName('Maharashtra')
    setCityName('Mumbai')
    setEmailInput('')
    setBalance('0')
    setBalanceType('settled')
    setBillingAddress('')
    setShippingAddress('')
    setCreditLimit('0')
    setRemarks('')
    setReferenceNo('')
    setPartyType('customer')
    setEditingPartyId(null)
    setActiveTab('gst')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyName.trim()) return

    if (editingPartyId) {
      const updated = parties.map(p => {
        if (p.id === editingPartyId) {
          return {
            ...p,
            name: partyName.trim(),
            tradeName: tradeNameInput.trim() || undefined,
            gstin: gstin.trim().toUpperCase(),
            phone: phone.trim(),
            gstType,
            state: stateName,
            city: cityName.trim(),
            email: emailInput.trim(),
            balance: parseFloat(balance) || 0,
            balanceType,
            billingAddress: billingAddress.trim(),
            shippingAddress: shippingAddress.trim(),
            creditLimit: parseFloat(creditLimit) || 0,
            remarks: remarks.trim(),
            referenceNo: referenceNo.trim(),
            type: partyType
          }
        }
        return p
      })
      syncParties(updated)
    } else {
      const newParty: Party = {
        id: Date.now().toString(),
        name: partyName.trim(),
        tradeName: tradeNameInput.trim() || undefined,
        gstin: gstin.trim().toUpperCase(),
        phone: phone.trim(),
        gstType,
        state: stateName,
        city: cityName.trim(),
        email: emailInput.trim(),
        balance: parseFloat(balance) || 0,
        balanceType,
        billingAddress: billingAddress.trim(),
        shippingAddress: shippingAddress.trim(),
        creditLimit: parseFloat(creditLimit) || 0,
        remarks: remarks.trim(),
        referenceNo: referenceNo.trim(),
        type: partyType
      }
      syncParties([newParty, ...parties])
    }
    setIsModalOpen(false)
    resetForm()
  }

  const handleSort = (field: keyof Party) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const renderSortArrow = (field: keyof Party) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">⇅</span>
    return sortOrder === 'asc' ? <span className="text-purple-700 ml-1">▲</span> : <span className="text-purple-700 ml-1">▼</span>
  }

  const filtered = parties.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.gstin || '').toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
    if (filter === 'all') return matchesSearch
    return matchesSearch && p.type === filter
  })

  const sortedParties = [...filtered].sort((a, b) => {
    let aVal = a[sortField] ?? ''
    let bVal = b[sortField] ?? ''
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = (bVal as string).toLowerCase()
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const totalReceivable = parties.filter((p) => p.balanceType === 'receivable').reduce((sum, p) => sum + p.balance, 0)
  const totalPayable = parties.filter((p) => p.balanceType === 'payable').reduce((sum, p) => sum + p.balance, 0)

  if (!ready || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading…</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="party-master" role="admin" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Party Master</h1>
                <p className="text-gray-500 text-sm mt-1">Manage customers, suppliers & their balances</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Party</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="rounded-xl border bg-white border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Parties</p>
              <p className="text-2xl font-extrabold text-gray-900">{parties.length}</p>
              <p className="text-xs text-gray-400 mt-1">
                {parties.filter((p) => p.type === 'customer').length} customers · {parties.filter((p) => p.type === 'supplier').length} suppliers
              </p>
            </div>
            <div className="rounded-xl border bg-green-50 border-green-100 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Receivable</p>
              <p className="text-2xl font-extrabold text-green-700">₹{totalReceivable.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-xl border bg-red-50 border-red-100 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Payable</p>
              <p className="text-2xl font-extrabold text-red-600">₹{totalPayable.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Filter + Search Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'all' as FilterType, label: 'All Parties' },
                { id: 'customer' as FilterType, label: 'Customers' },
                { id: 'supplier' as FilterType, label: 'Suppliers' },
              ]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.id
                      ? 'bg-purple-700 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search by name, GSTIN, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-72"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th onClick={() => handleSort('name')} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    Party Name {renderSortArrow('name')}
                  </th>
                  <th onClick={() => handleSort('tradeName')} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    Trade Name {renderSortArrow('tradeName')}
                  </th>
                  <th onClick={() => handleSort('type')} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    Type {renderSortArrow('type')}
                  </th>
                  <th onClick={() => handleSort('phone')} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    Phone {renderSortArrow('phone')}
                  </th>
                  <th onClick={() => handleSort('gstin')} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    GSTIN {renderSortArrow('gstin')}
                  </th>
                  <th onClick={() => handleSort('city')} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    City/State {renderSortArrow('city')}
                  </th>
                  <th onClick={() => handleSort('creditLimit')} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none text-right">
                    Credit Limit {renderSortArrow('creditLimit')}
                  </th>
                  <th onClick={() => handleSort('balance')} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none text-right">
                    Balance {renderSortArrow('balance')}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Payment Due
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedParties.map((p) => {
                  const paymentDue = p.balanceType === 'receivable' ? p.balance : 0
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900">{p.name}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{p.email}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-700 text-xs font-medium">{p.tradeName || '-'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeBadge(p.type)}`}>
                          {p.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600 font-mono text-xs">{p.phone}</td>
                      <td className="px-4 py-4 text-gray-500 font-mono text-xs">{p.gstin || '-'}</td>
                      <td className="px-4 py-4 text-xs font-semibold text-gray-600">
                        {p.city}, {p.state}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-gray-600 font-bold">
                        {p.creditLimit ? `₹ ${p.creditLimit.toLocaleString('en-IN')}` : 'No Limit'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {p.balance > 0 ? (
                          <div>
                            <span className={`font-semibold ${balanceBadge(p.balanceType)}`}>
                              ₹ {p.balance.toLocaleString('en-IN')}
                            </span>
                            <span className="text-gray-400 text-xs ml-1">
                              {p.balanceType === 'receivable' ? '▲' : '▼'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Settled</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {paymentDue > 0 ? (
                          <span className="font-bold text-red-600">
                            ₹ {paymentDue.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">No parties found</div>
            )}
          </div>
        </div>
      </div>

      {/* ── ADD PARTY MODAL ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">Add Party</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => { setIsModalOpen(false); resetForm() }}
                  type="button"
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable Content) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              
              {/* Permanent Fields (Top row) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Party Name / Listing Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Party Name *"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Trade Name</label>
                  <input
                    type="text"
                    placeholder="Trade Name (optional)"
                    value={tradeNameInput}
                    onChange={(e) => setTradeNameInput(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="GSTIN"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Tabs list */}
              <div className="flex border-b border-gray-100 gap-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('gst')}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'gst' ? 'border-purple-700 text-purple-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  GST & Address
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('balance')}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'balance' ? 'border-purple-700 text-purple-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span>Credit & Balance</span>
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('additional')}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'additional' ? 'border-purple-700 text-purple-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Additional Fields
                </button>
              </div>

              {/* Tab Contents */}
              <div className="mt-4">
                
                {/* TAB 1: GST & Address */}
                {activeTab === 'gst' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* GST settings */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">GST Type</label>
                        <select
                          value={gstType}
                          onChange={(e) => setGstType(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                        >
                          <option value="Unregistered/Consumer">Unregistered/Consumer</option>
                          <option value="Registered-Regular">Registered-Regular</option>
                          <option value="Registered-Composition">Registered-Composition</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">State</label>
                        <select
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Email ID</label>
                        <input
                          type="email"
                          placeholder="Email ID"
                          value={emailId}
                          onChange={(e) => setEmailId(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Billing address */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Billing Address</label>
                      <textarea
                        placeholder="Billing Address"
                        rows={5}
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 resize-none h-36"
                      />
                    </div>

                    {/* Shipping address */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Shipping Address</label>
                      {!enableShipping ? (
                        <div className="h-36 border border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50/50">
                          <button
                            type="button"
                            onClick={() => setEnableShipping(true)}
                            className="text-purple-700 text-sm font-bold hover:underline"
                          >
                            + Enable Shipping Address
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            placeholder="Shipping Address"
                            rows={5}
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 resize-none h-28"
                          />
                          <button
                            type="button"
                            onClick={() => { setEnableShipping(false); setShippingAddress('') }}
                            className="text-xs text-red-500 font-bold hover:underline"
                          >
                            ✕ Disable Shipping Address
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Balance & Credit */}
                {activeTab === 'balance' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Opening Balance</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Balance Type</label>
                      <div className="flex gap-6 mt-3">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="balanceType"
                            checked={balanceTypeInput === 'receivable'}
                            onChange={() => setBalanceTypeInput('receivable')}
                            className="text-purple-700 focus:ring-purple-500 h-4 w-4"
                          />
                          Receivable (To Receive)
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="balanceType"
                            checked={balanceTypeInput === 'payable'}
                            onChange={() => setBalanceTypeInput('payable')}
                            className="text-purple-700 focus:ring-purple-500 h-4 w-4"
                          />
                          Payable (To Pay)
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Credit Limit</label>
                      <input
                        type="number"
                        placeholder="No Limit"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: Additional fields */}
                {activeTab === 'additional' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Reference Number</label>
                      <input
                        type="text"
                        placeholder="Reference / HSN Code etc."
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Remarks</label>
                      <input
                        type="text"
                        placeholder="Remarks / Notes"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => handleSave(true)}
                type="button"
                className="px-5 py-2.5 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 text-sm font-bold rounded-lg transition-all shadow-sm focus:outline-none"
              >
                Save &amp; New
              </button>
              <button
                onClick={() => handleSave(false)}
                type="button"
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold rounded-lg transition-all shadow-md focus:outline-none"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: EXCEL IMPORT ──────────────────────────────── */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-sm font-bold text-slate-800">Import Parties</span>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <div className="p-5">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-purple-300 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-3xl mb-2 block">📄</span>
                <span className="text-sm font-bold text-slate-700 block">Click or Drag Excel File</span>
                <span className="text-xs text-slate-400 mt-1 block">.xlsx or .csv up to 5MB</span>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
