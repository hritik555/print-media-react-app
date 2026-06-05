import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet } from '../../lib/api'
import { getServerUser } from '../../lib/auth'

export const Route = createFileRoute('/staff/')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user) throw redirect({ to: '/' })
    if (!user.roles?.includes('staff') && !user.roles?.includes('admin')) throw redirect({ to: '/' })
    return { user }
  },
  component: StaffDashboard,
})

interface StaffStats {
  pendingQuotes: number
  processingOrders: number
  pendingInvoices: number
  deliveredToday: number
}

interface ActivityItem {
  type: string
  ref: string
  partner: string
  date: string
  amount: number
  status: string
}

const MOCK_STATS: StaffStats = { pendingQuotes: 17, processingOrders: 23, pendingInvoices: 12, deliveredToday: 5 }
const MOCK_ACTIVITY: ActivityItem[] = [
  { type: 'Quote', ref: 'QT-2026-021', partner: 'Sharma Enterprises', date: '30 May 2026', amount: 15000, status: 'PENDING' },
  { type: 'Order', ref: 'ORD-2026-089', partner: 'Metro Print Solutions', date: '30 May 2026', amount: 28500, status: 'PROCESSING' },
  { type: 'Invoice', ref: 'INV-2026-067', partner: 'Creative Studios', date: '29 May 2026', amount: 9800, status: 'PAID' },
]

function statusColor(s: string) {
  switch (s) {
    case 'PAID': case 'DELIVERED': case 'APPROVED': return 'bg-green-100 text-green-700'
    case 'PROCESSING': case 'SENT': return 'bg-blue-100 text-blue-600'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function StaffDashboard() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [stats, setStats] = useState<StaffStats>(MOCK_STATS)
  const [activity, setActivity] = useState<ActivityItem[]>(MOCK_ACTIVITY)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }
    Promise.all([
      apiGet<StaffStats>('/api/admin/dashboard/stats'),
      apiGet<ActivityItem[]>('/api/admin/dashboard/activity'),
    ])
      .then(([s, a]) => { setStats(s as any); setActivity(a) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ready, user, navigate])

  if (!ready || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading…</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="dashboard" role="staff" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-2xl font-extrabold text-gray-900">Staff Dashboard</h1>
          </div>
          <p className="text-gray-500 text-sm mb-8">Operational view — PrintPro Publications</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard label="Pending Quotes" value={stats.pendingQuotes} color="text-yellow-600" bg="bg-yellow-50 border-yellow-100" />
            <StatCard label="Processing Orders" value={stats.processingOrders} color="text-blue-600" bg="bg-blue-50 border-blue-100" />
            <StatCard label="Pending Invoices" value={stats.pendingInvoices} color="text-orange-600" bg="bg-orange-50 border-orange-100" />
            <StatCard label="Delivered Today" value={stats.deliveredToday} color="text-green-600" bg="bg-green-50 border-green-100" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['TYPE', 'REF #', 'PARTNER', 'DATE', 'AMOUNT', 'STATUS'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr key={row.ref} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4 text-gray-700">{row.type}</td>
                    <td className="px-5 py-4 font-medium text-gray-700">{row.ref}</td>
                    <td className="px-5 py-4 text-gray-600">{row.partner}</td>
                    <td className="px-5 py-4 text-gray-500">{row.date}</td>
                    <td className="px-5 py-4 font-semibold text-purple-700">₹{row.amount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(row.status)}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`rounded-xl border p-6 ${bg}`}>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
  )
}
