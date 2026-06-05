import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet, apiPost, apiPut } from '../../lib/api'

export const Route = createFileRoute('/admin/partners')({
  beforeLoad: async () => {
    // Auth guards verified client-side in start-identity
  },
  component: PartnersPage,
})

interface Partner {
  id: string
  name: string
  email: string
  company: string // Listing Name / Company
  tradeName?: string // Trade Name
  city: string
  state?: string
  totalOrders: number
  totalRevenue: number
  joinedDate: string
  referralPoints: number
  referee?: string
  phone?: string
  gstin?: string
  gstType?: string
  billingAddress?: string
  shippingAddress?: string
  creditLimit?: number
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi'
]

const MOCK_PARTNERS: Partner[] = [
  { id: '1', name: 'Rajesh Sharma', email: 'rajesh@sharma.com', company: 'Sharma Enterprises', tradeName: 'Sharma Prints', city: 'Mumbai', state: 'Maharashtra', totalOrders: 28, totalRevenue: 280000, joinedDate: 'Jan 2025', referralPoints: 450, referee: 'None', phone: '+91 98765 43210', gstin: '27AABCS1234B1Z5', gstType: 'Registered-Regular', billingAddress: '102, Print Plaza, Andheri, Mumbai, Maharashtra', shippingAddress: '102, Print Plaza, Andheri, Mumbai, Maharashtra', creditLimit: 50000 },
  { id: '2', name: 'Priya Mehta', email: 'priya@metroprint.com', company: 'Metro Print Solutions', tradeName: 'Metro Media', city: 'Delhi', state: 'Delhi', totalOrders: 45, totalRevenue: 520000, joinedDate: 'Mar 2024', referralPoints: 1200, referee: 'Rajesh Sharma', phone: '+91 98123 45678', gstin: '07AABCM5678D1Z2', gstType: 'Registered-Regular', billingAddress: 'G-5, Connaught Place, New Delhi, Delhi', creditLimit: 100000 },
  { id: '3', name: 'Anil Kumar', email: 'anil@creative.com', company: 'Creative Studios', tradeName: 'Creative Designs', city: 'Bangalore', state: 'Karnataka', totalOrders: 12, totalRevenue: 98000, joinedDate: 'Jul 2025', referralPoints: 150, referee: 'None', phone: '+91 98888 77766', gstin: '29AABCC1234L1Z7', gstType: 'Unregistered/Consumer', billingAddress: '42, MG Road, Bangalore, Karnataka', creditLimit: 25000 },
  { id: '4', name: 'Sunita Rao', email: 'sunita@apex.in', company: 'Apex Publications', tradeName: 'Apex Prints', city: 'Chennai', state: 'Tamil Nadu', totalOrders: 31, totalRevenue: 345000, joinedDate: 'Nov 2024', referralPoints: 780, referee: 'Priya Mehta', phone: '+91 99001 23456', gstin: '33AABCA3456H1Z1', gstType: 'Registered-Composition', billingAddress: '88, Anna Salai, Chennai, Tamil Nadu', creditLimit: 75000 },
  { id: '5', name: 'Vikram Singh', email: 'vikram@spectrum.com', company: 'Spectrum Media', tradeName: 'Spectrum Publications', city: 'Hyderabad', state: 'Telangana', totalOrders: 8, totalRevenue: 67000, joinedDate: 'Feb 2025', referralPoints: 0, referee: 'Anil Kumar', phone: '+91 95555 44433', gstin: '36AABCS9012P1Z6', gstType: 'Registered-Regular', billingAddress: '15, Madhapur, Hyderabad, Telangana', creditLimit: 15000 },
]

function PartnersPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()

  // State Management
  const [partners, setPartners] = useState<Partner[]>(MOCK_PARTNERS)
  const [loading, setLoading] = useState(true)
  
  // Searching & Sorting Filters
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('All')
  const [selectedReferee, setSelectedReferee] = useState('All')
  
  const [sortField, setSortField] = useState<keyof Partner>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalActiveTab, setModalActiveTab] = useState<'details' | 'address' | 'referrals'>('details')
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Modal Fields State
  const [targetId, setTargetId] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gstin, setGstin] = useState('')
  const [gstType, setGstType] = useState('Registered-Regular')
  const [stateName, setStateName] = useState('Maharashtra')
  const [cityName, setCityName] = useState('Mumbai')
  const [billingAddress, setBillingAddress] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [referralPoints, setReferralPoints] = useState('0')
  const [referee, setReferee] = useState('None')
  const [creditLimit, setCreditLimit] = useState('50000')

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }

    apiGet<Partner[]>('/api/admin/partners')
      .then(setPartners)
      .catch(() => {
        const saved = localStorage.getItem('printpro_partners')
        if (saved) setPartners(JSON.parse(saved))
        else localStorage.setItem('printpro_partners', JSON.stringify(MOCK_PARTNERS))
      })
      .finally(() => setLoading(false))
  }, [ready, user, navigate])

  const syncPartners = (updated: Partner[]) => {
    setPartners(updated)
    localStorage.setItem('printpro_partners', JSON.stringify(updated))
  }

  // Open modal in edit mode
  const openEditModal = (p: Partner) => {
    setIsEditMode(true)
    setTargetId(p.id)
    setPartnerName(p.name)
    setCompanyName(p.company)
    setTradeName(p.tradeName || '')
    setEmail(p.email)
    setPhone(p.phone || '')
    setGstin(p.gstin || '')
    setGstType(p.gstType || 'Registered-Regular')
    setStateName(p.state || 'Maharashtra')
    setCityName(p.city)
    setBillingAddress(p.billingAddress || '')
    setShippingAddress(p.shippingAddress || '')
    setReferralPoints(String(p.referralPoints))
    setReferee(p.referee || 'None')
    setCreditLimit(String(p.creditLimit || '50000'))
    
    setModalActiveTab('details')
    setIsModalOpen(true)
  }

  // Open modal in create mode
  const openCreateModal = () => {
    setIsEditMode(false)
    setTargetId('')
    setPartnerName('')
    setCompanyName('')
    setTradeName('')
    setEmail('')
    setPhone('')
    setGstin('')
    setGstType('Registered-Regular')
    setStateName('Maharashtra')
    setCityName('Mumbai')
    setBillingAddress('')
    setShippingAddress('')
    setReferralPoints('0')
    setReferee('None')
    setCreditLimit('50000')
    
    setModalActiveTab('details')
    setIsModalOpen(true)
  }

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerName.trim() || !companyName.trim()) {
      alert('Name and Company/Listing Name are required.')
      return
    }

    if (isEditMode) {
      // Modify existing
      const updated = partners.map((p) => {
        if (p.id === targetId) {
          return {
            ...p,
            name: partnerName.trim(),
            company: companyName.trim(),
            tradeName: tradeName.trim() || undefined,
            email: email.trim(),
            phone: phone.trim(),
            gstin: gstin.trim().toUpperCase(),
            gstType: gstType,
            state: stateName,
            city: cityName.trim(),
            billingAddress: billingAddress.trim(),
            shippingAddress: shippingAddress.trim(),
            referralPoints: parseInt(referralPoints) || 0,
            referee: referee,
            creditLimit: parseFloat(creditLimit) || 0,
          }
        }
        return p
      })
      syncPartners(updated)
    } else {
      // Add new partner record
      const newPartner: Partner = {
        id: 'p-' + Date.now(),
        name: partnerName.trim(),
        company: companyName.trim(),
        tradeName: tradeName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        gstin: gstin.trim().toUpperCase(),
        gstType: gstType,
        state: stateName,
        city: cityName.trim(),
        billingAddress: billingAddress.trim(),
        shippingAddress: shippingAddress.trim(),
        referralPoints: parseInt(referralPoints) || 0,
        referee: referee,
        creditLimit: parseFloat(creditLimit) || 0,
        totalOrders: 0,
        totalRevenue: 0,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      }
      syncPartners([newPartner, ...partners])
    }

    setIsModalOpen(false)
  }

  // Handle headers sort clicks
  const handleSort = (field: keyof Partner) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const renderSortArrow = (field: keyof Partner) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">⇅</span>
    return sortOrder === 'asc' ? <span className="text-purple-700 ml-1">▲</span> : <span className="text-purple-700 ml-1">▼</span>
  }

  // Filter logic
  const filtered = partners.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      (p.tradeName || '').toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    
    const matchesCity = selectedCity === 'All' || p.city === selectedCity
    const matchesReferee = selectedReferee === 'All' || p.referee === selectedReferee

    return matchesSearch && matchesCity && matchesReferee
  })

  // Sorted list output
  const sorted = [...filtered].sort((a, b) => {
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

  // Unique lists for filtering dropdowns
  const uniqueCities = Array.from(new Set(partners.map(p => p.city)))
  const uniqueReferees = Array.from(new Set(partners.map(p => p.referee || 'None').filter(r => r !== 'None')))

  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading partners directory…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="partners" role="admin" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Partners</h1>
                <p className="text-gray-500 text-sm mt-0.5">Manage partner records, referrals & loyalty points</p>
              </div>
            </div>
            
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              ➕ Add Partner
            </button>
          </div>

          {/* Filters Row */}
          <div className="bg-white p-4 border border-gray-200 rounded-xl mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by name, company, trade name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-gray-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">City:</span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 bg-white"
                >
                  <option value="All">All Cities</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Referee:</span>
                <select
                  value={selectedReferee}
                  onChange={(e) => setSelectedReferee(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 bg-white"
                >
                  <option value="All">All Referees</option>
                  {uniqueReferees.map(ref => (
                    <option key={ref} value={ref}>{ref}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Ledger */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th onClick={() => handleSort('name')} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    Name {renderSortArrow('name')}
                  </th>
                  <th onClick={() => handleSort('company')} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    Company / Trade Name {renderSortArrow('company')}
                  </th>
                  <th onClick={() => handleSort('city')} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    City {renderSortArrow('city')}
                  </th>
                  <th onClick={() => handleSort('totalOrders')} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none text-right">
                    Orders {renderSortArrow('totalOrders')}
                  </th>
                  <th onClick={() => handleSort('totalRevenue')} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none text-right">
                    Revenue {renderSortArrow('totalRevenue')}
                  </th>
                  <th onClick={() => handleSort('referralPoints')} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none text-right">
                    Referral Points {renderSortArrow('referralPoints')}
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                    Referee
                  </th>
                  <th onClick={() => handleSort('joinedDate')} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                    Joined {renderSortArrow('joinedDate')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openEditModal(p)}
                        className="text-left font-bold text-purple-700 hover:text-purple-900 hover:underline focus:outline-none"
                      >
                        {p.name}
                      </button>
                      <div className="text-gray-400 text-xs mt-0.5">{p.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-800">{p.company}</div>
                      {p.tradeName && (
                        <div className="text-[10px] text-gray-400 italic">Trade: {p.tradeName}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs font-medium">{p.city}</td>
                    <td className="px-5 py-4 text-right font-mono text-gray-700 font-bold">{p.totalOrders}</td>
                    <td className="px-5 py-4 text-right font-bold text-purple-700">₹ {p.totalRevenue.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold text-xs">
                        {p.referralPoints} pts
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-gray-600">
                      {p.referee && p.referee !== 'None' ? (
                        <span className="flex items-center gap-1">
                          👤 {p.referee}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal">Direct</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs font-medium">{p.joinedDate}</td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">No partners match the selected filter query</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* ── ADD / EDIT PARTNER MODAL ─────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fadeIn">
          <form onSubmit={handleSavePartner} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-base font-extrabold text-gray-800">
                {isEditMode ? 'Modify Partner Account Details' : 'Provision New Partner Profile'}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 pt-4 border-b border-gray-100 flex gap-6 bg-white">
              {(['details', 'address', 'referrals'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setModalActiveTab(tab)}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                    modalActiveTab === tab
                      ? 'border-purple-700 text-purple-700 font-extrabold'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab === 'details' && '1. Primary Profiles'}
                  {tab === 'address' && '2. Address Registers'}
                  {tab === 'referrals' && '3. Wallet & Loyalty'}
                </button>
              ))}
            </div>

            {/* Form Scrollable Panels */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              
              {/* TAB 1: DETAILS */}
              {modalActiveTab === 'details' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-partner-name">Partner Name *</label>
                    <input
                      id="form-partner-name"
                      type="text"
                      required
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full border border-purple-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-company-name">Company / Listing Name *</label>
                    <input
                      id="form-company-name"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Sharma Enterprises"
                      className="w-full border border-purple-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-trade-name">Trade Name</label>
                    <input
                      id="form-trade-name"
                      type="text"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      placeholder="e.g. Sharma Prints"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-email">Email ID</label>
                    <input
                      id="form-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rajesh@sharma.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-phone">Phone Number</label>
                    <input
                      id="form-phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-gstin">GSTIN (optional)</label>
                    <input
                      id="form-gstin"
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="e.g. 27AABCS1234B1Z5"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-gst-type">GST Type</label>
                    <select
                      id="form-gst-type"
                      value={gstType}
                      onChange={(e) => setGstType(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white text-gray-600 font-bold"
                    >
                      <option value="Registered-Regular">Registered-Regular</option>
                      <option value="Registered-Composition">Registered-Composition</option>
                      <option value="Unregistered/Consumer">Unregistered/Consumer</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: ADDRESSES */}
              {modalActiveTab === 'address' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-state">State</label>
                    <select
                      id="form-state"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white text-gray-600"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-city">City</label>
                    <input
                      id="form-city"
                      type="text"
                      required
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-billing">Billing Address</label>
                    <textarea
                      id="form-billing"
                      rows={3}
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="Billing Address Details"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-shipping">Shipping Address</label>
                    <textarea
                      id="form-shipping"
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Shipping Address Details (Leave blank if same as billing)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: REFERRALS & WALLET */}
              {modalActiveTab === 'referrals' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-points">Referral Points (PTS)</label>
                    <input
                      id="form-points"
                      type="number"
                      value={referralPoints}
                      onChange={(e) => setReferralPoints(e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white font-mono font-bold text-purple-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-referee">Referee (Referred By)</label>
                    <select
                      id="form-referee"
                      value={referee}
                      onChange={(e) => setReferee(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white text-gray-600"
                    >
                      <option value="None">Direct / None</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase" htmlFor="form-credit">Credit Limit (₹)</label>
                    <input
                      id="form-credit"
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="50000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white font-mono"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-gray-600 hover:bg-slate-100 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-md transition-all"
              >
                Save Partner
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  )
}
