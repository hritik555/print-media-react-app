import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet } from '../../lib/api'

export const Route = createFileRoute('/admin/')({
  beforeLoad: async () => {
    // Auth guards verified client-side in start-identity
  },
  component: AdminDashboard,
})

interface QuoteItem {
  id: string
  ref: string
  partner: string
  date: string // YYYY-MM-DD
  amount: number
  status: string
}

interface OrderItem {
  id: string
  ref: string
  partner: string
  date: string // YYYY-MM-DD
  amount: number
  status: string
}

interface PaymentItem {
  id: string
  ref: string
  partner: string
  date: string // YYYY-MM-DD
  amount: number
  method: string
}

interface PendingItem {
  id: string
  partner: string
  dueDate: string // YYYY-MM-DD
  amount: number
}

// Rich default datasets spanning multiple time ranges (Today is 2026-06-03)
const MOCK_QUOTES: QuoteItem[] = [
  { id: 'q-1', ref: 'QT-2026-021', partner: 'Sharma Enterprises', date: '2026-06-03', amount: 15000, status: 'PENDING' },
  { id: 'q-2', ref: 'QT-2026-020', partner: 'Apex Publications', date: '2026-06-02', amount: 22000, status: 'APPROVED' },
  { id: 'q-3', ref: 'QT-2026-019', partner: 'Metro Print Solutions', date: '2026-05-15', amount: 35000, status: 'APPROVED' },
  { id: 'q-4', ref: 'QT-2026-018', partner: 'Creative Studios', date: '2026-05-10', amount: 12000, status: 'DRAFT' },
  { id: 'q-5', ref: 'QT-2026-017', partner: 'Spectrum Media', date: '2026-04-20', amount: 45000, status: 'APPROVED' },
]

const MOCK_ORDERS: OrderItem[] = [
  { id: 'o-1', ref: 'ORD-2026-089', partner: 'Metro Print Solutions', date: '2026-06-03', amount: 28500, status: 'PROCESSING' },
  { id: 'o-2', ref: 'ORD-2026-088', partner: 'Spectrum Media', date: '2026-06-01', amount: 45000, status: 'DELIVERED' },
  { id: 'o-3', ref: 'ORD-2026-087', partner: 'Sharma Enterprises', date: '2026-05-20', amount: 18000, status: 'DELIVERED' },
  { id: 'o-4', ref: 'ORD-2026-086', partner: 'Apex Publications', date: '2026-05-12', amount: 24000, status: 'PROCESSING' },
  { id: 'o-5', ref: 'ORD-2026-085', partner: 'Creative Studios', date: '2026-04-15', amount: 9800, status: 'DELIVERED' },
]

const MOCK_PAYMENTS: PaymentItem[] = [
  { id: 'p-1', ref: 'PAY-2026-045', partner: 'Sharma Enterprises', date: '2026-06-03', amount: 12000, method: 'UPI' },
  { id: 'p-2', ref: 'PAY-2026-044', partner: 'Creative Studios', date: '2026-06-02', amount: 9800, method: 'Bank Transfer' },
  { id: 'p-3', ref: 'PAY-2026-043', partner: 'Metro Print Solutions', date: '2026-05-25', amount: 30000, method: 'UPI' },
  { id: 'p-4', ref: 'PAY-2026-042', partner: 'Apex Publications', date: '2026-05-18', amount: 15000, method: 'Cash' },
  { id: 'p-5', ref: 'PAY-2026-041', partner: 'Spectrum Media', date: '2026-04-25', amount: 40000, method: 'UPI' },
]

const MOCK_PENDING: PendingItem[] = [
  { id: 'd-1', partner: 'Sharma Enterprises', dueDate: '2026-06-03', amount: 28000 },
  { id: 'd-2', partner: 'Apex Publications', dueDate: '2026-06-02', amount: 11200 },
  { id: 'd-3', partner: 'Creative Studios', dueDate: '2026-05-28', amount: 9800 },
  { id: 'd-4', partner: 'National Paper Mills', dueDate: '2026-05-14', amount: 145000 },
  { id: 'd-5', partner: 'Spectrum Media', dueDate: '2026-04-10', amount: 67000 },
]

type FilterPreset = 'day' | 'month' | 'last_month' | 'range'

function statusColor(status: string) {
  switch (status) {
    case 'APPROVED': case 'PAID': case 'DELIVERED': return 'bg-green-100 text-green-700'
    case 'PROCESSING': case 'SENT': return 'bg-blue-100 text-blue-600'
    case 'PENDING': case 'DRAFT': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function AdminDashboard() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()

  // State Management
  const [quotes, setQuotes] = useState<QuoteItem[]>(MOCK_QUOTES)
  const [orders, setOrders] = useState<OrderItem[]>(MOCK_ORDERS)
  const [payments, setPayments] = useState<PaymentItem[]>(MOCK_PAYMENTS)
  const [pending, setPending] = useState<PendingItem[]>(MOCK_PENDING)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filters State (Defaulting to 'month')
  const [timeFilter, setTimeFilter] = useState<FilterPreset>('month')
  const [startDate, setStartDate] = useState('2026-06-01')
  const [endDate, setEndDate] = useState('2026-06-03')

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }

    // Attempt backend sync, otherwise stick with mock fallbacks
    Promise.all([
      apiGet<QuoteItem[]>('/api/admin/dashboard/quotes'),
      apiGet<OrderItem[]>('/api/admin/dashboard/orders'),
      apiGet<PaymentItem[]>('/api/admin/dashboard/payments'),
      apiGet<PendingItem[]>('/api/admin/dashboard/pending'),
    ])
      .then(([q, o, p, d]) => {
        setQuotes(q)
        setOrders(o)
        setPayments(p)
        setPending(d)
      })
      .catch(() => {
        // Fallback to localstorage values if present
        const sq = localStorage.getItem('printpro_quotes')
        const so = localStorage.getItem('printpro_orders')
        if (sq) setQuotes(JSON.parse(sq))
        if (so) setOrders(JSON.parse(so))
      })
      .finally(() => setLoading(false))
  }, [ready, user, navigate])

  // Client-side date filter engine (Today is June 3, 2026)
  const isDateInFilter = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date('2026-06-03') // Aligned current date context
    
    if (timeFilter === 'day') {
      return date.toDateString() === today.toDateString()
    }
    if (timeFilter === 'month') {
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
    }
    if (timeFilter === 'last_month') {
      let targetMonth = today.getMonth() - 1
      let targetYear = today.getFullYear()
      if (targetMonth < 0) {
        targetMonth = 11
        targetYear -= 1
      }
      return date.getMonth() === targetMonth && date.getFullYear() === targetYear
    }
    if (timeFilter === 'range' && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return date >= start && date <= end
    }
    return true
  }

  // Filtered Datasets
  const filteredQuotes = quotes.filter(q => isDateInFilter(q.date))
  const filteredOrders = orders.filter(o => isDateInFilter(o.date))
  const filteredPayments = payments.filter(p => isDateInFilter(p.date))
  const filteredPending = pending.filter(d => isDateInFilter(d.dueDate))

  // Calculated Metrics
  const quotesCount = filteredQuotes.length
  const quotesTotal = filteredQuotes.reduce((sum, q) => sum + q.amount, 0)
  
  const ordersCount = filteredOrders.length
  const ordersTotal = filteredOrders.reduce((sum, o) => sum + o.amount, 0)

  const totalPaymentsIn = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPendingAmount = filteredPending.reduce((sum, d) => sum + d.amount, 0)

  // Combined activity feed featuring only Orders & Quotations sorted by date desc
  const orderAndQuoteActivity = [
    ...filteredQuotes.map(q => ({ type: 'Quote', ref: q.ref, partner: q.partner, date: q.date, amount: q.amount, status: q.status })),
    ...filteredOrders.map(o => ({ type: 'Order', ref: o.ref, partner: o.partner, date: o.date, amount: o.amount, status: o.status }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading admin dashboard…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="dashboard" role="admin" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm mt-0.5">Real-time metrics, order ledgers & fast workspaces</p>
              </div>
            </div>
            
            {/* Range Filters Controls */}
            <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-1">
              {(['day', 'month', 'last_month', 'range'] as FilterPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTimeFilter(preset)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg tracking-wide transition-all ${
                    timeFilter === preset
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {preset === 'day' && 'Today'}
                  {preset === 'month' && 'This Month'}
                  {preset === 'last_month' && 'Last Month'}
                  {preset === 'range' && 'Date Range'}
                </button>
              ))}
            </div>
          </div>

          {/* Date range pickers reveal */}
          {timeFilter === 'range' && (
            <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl mb-6 flex flex-wrap items-center gap-4 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-900 uppercase">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-900 uppercase">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <span className="text-xs text-purple-500 font-medium">Filtering records between {startDate} and {endDate}</span>
            </div>
          )}

          {/* Dynamic Calculated KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              title="Quotations"
              value={String(quotesCount)}
              sub={`₹ ${quotesTotal.toLocaleString('en-IN')} total`}
              icon="📋"
            />
            <StatCard
              title="Orders Placed"
              value={String(ordersCount)}
              sub={`₹ ${ordersTotal.toLocaleString('en-IN')} value`}
              icon="📦"
            />
            <StatCard
              title="Payments In"
              value={`₹ ${totalPaymentsIn.toLocaleString('en-IN')}`}
              sub="Total collected cash"
              icon="💰"
              accent
            />
            <StatCard
              title="Pending Amount"
              value={`₹ ${totalPendingAmount.toLocaleString('en-IN')}`}
              sub="Outstanding due"
              icon="⏳"
              warning
            />
          </div>

          {/* Common Navigation Tabs Shortcuts */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Workspaces</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <QuickLink to="/admin/quotations" title="Quotes" desc="Create & manage quotes" icon="📋" />
              <QuickLink to="/admin/orders" title="Orders" desc="Trace active orders" icon="📦" />
              <QuickLink to="/admin/invoices" title="Invoices" desc="Audit client bills" icon="💰" />
              <QuickLink to="/admin/items" title="Item Master" desc="Modify catalogs" icon="🛠️" />
              <QuickLink to="/admin/partners" title="Partners" desc="Partners directory" icon="🤝" />
              <QuickLink to="/admin/party-master" title="Party Master" desc="Customers/Suppliers" icon="👥" />
            </div>
          </div>

          {/* Activity timeline grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Orders & Quotations Ledger */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-gray-900">Recent Activity (Orders & Quotes)</h2>
                <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                  {orderAndQuoteActivity.length} events
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['TYPE', 'REF #', 'PARTNER', 'DATE', 'AMOUNT', 'STATUS'].map((h) => (
                        <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orderAndQuoteActivity.map((row) => (
                      <tr key={row.ref} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                            row.type === 'Order' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {row.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-gray-700 text-xs">{row.ref}</td>
                        <td className="px-5 py-4 text-gray-600 text-xs font-semibold">{row.partner}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-900 text-xs">₹ {row.amount.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${statusColor(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orderAndQuoteActivity.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No activity recorded for this period</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Metrics Analytics */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Operational Summary</h2>
              
              <div className="space-y-3">
                <MetricProgress label="Payments In Rate" value={totalPaymentsIn} total={ordersTotal || 1} color="bg-green-600" />
                <MetricProgress label="Outstanding Receivables" value={totalPendingAmount} total={totalPendingAmount + totalPaymentsIn || 1} color="bg-red-500" />
              </div>

              <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
                Metrics are calculated from the catalog matching the time period selected above. Today is assumed to be <strong>June 3, 2026</strong>.
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, sub, icon, accent, warning }: { title: string; value: string; sub: string; icon: string; accent?: boolean; warning?: boolean }) {
  let cardClass = 'bg-white border-gray-200'
  let textClass = 'text-gray-900'
  let subClass = 'text-gray-400'
  let titleClass = 'text-gray-400'

  if (accent) {
    cardClass = 'bg-purple-700 border-purple-600 shadow-purple-200 shadow-md'
    textClass = 'text-white'
    subClass = 'text-purple-200 font-medium'
    titleClass = 'text-purple-200'
  } else if (warning) {
    cardClass = 'bg-red-50/50 border-red-100'
    textClass = 'text-red-700'
    subClass = 'text-red-500 font-medium'
    titleClass = 'text-red-500/80'
  }

  return (
    <div className={`rounded-xl border p-6 transition-all hover:shadow-sm ${cardClass}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${titleClass}`}>{title}</p>
      <p className={`text-2xl font-extrabold mb-1 tracking-tight ${textClass}`}>{value}</p>
      <p className={`text-xs ${subClass}`}>{sub}</p>
    </div>
  )
}

function QuickLink({ to, title, desc, icon }: { to: string; title: string; desc: string; icon: string }) {
  return (
    <Link
      to={to}
      className="p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition-all group flex flex-col items-start gap-1"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-bold text-gray-800 group-hover:text-purple-700 transition-colors mt-2">{title}</span>
      <span className="text-[10px] text-gray-400 leading-snug">{desc}</span>
    </Link>
  )
}

function MetricProgress({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / total) * 100)))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-gray-700">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-[10px] text-gray-400">₹ {value.toLocaleString('en-IN')} of ₹ {total.toLocaleString('en-IN')}</div>
    </div>
  )
}

