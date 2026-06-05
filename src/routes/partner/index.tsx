import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { PartnerNav } from '../../components/PartnerNav'
import { apiGet } from '../../lib/api'
import { getServerUser } from '../../lib/auth'

export const Route = createFileRoute('/partner/')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // const roles: string[] = user.roles ?? []
    // if (!roles.includes('partner') && !roles.includes('admin') && !roles.includes('staff')) {
    //   throw redirect({ to: '/' })
    // }
    // return { user }
  },
  component: PartnerHome,
})

interface DashboardStats {
  totalQuotes: number
  approvedQuotes: number
  activeOrders: number
  processingOrders: number
  totalInvoiced: number
  referralPoints: number
}

interface RecentActivity {
  type: string
  ref: string
  date: string
  amount: number
  status: string
}

const MOCK_STATS: DashboardStats = {
  totalQuotes: 6,
  approvedQuotes: 3,
  activeOrders: 4,
  processingOrders: 2,
  totalInvoiced: 42800,
  referralPoints: 320,
}

const MOCK_ACTIVITY: RecentActivity[] = [
  { type: 'Quote', ref: 'QT-2026-001', date: '15 Apr 2026', amount: 8200, status: 'APPROVED' },
  { type: 'Order', ref: 'ORD-2026-003', date: '14 Apr 2026', amount: 5400, status: 'PROCESSING' },
  { type: 'Invoice', ref: 'INV-2026-002', date: '12 Apr 2026', amount: 12750, status: 'PAID' },
]

function statusColor(status: string) {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-700'
    case 'PAID': return 'bg-green-100 text-green-700'
    case 'PROCESSING': return 'bg-gray-100 text-gray-600'
    case 'SENT': return 'bg-blue-100 text-blue-600'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function PartnerHome() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
  const [activity, setActivity] = useState<RecentActivity[]>(MOCK_ACTIVITY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }

    async function fetchData() {
      try {
        const [s, a] = await Promise.all([
          apiGet<DashboardStats>('/api/partner/dashboard/stats'),
          apiGet<RecentActivity[]>('/api/partner/dashboard/activity'),
        ])
        setStats(s)
        setActivity(a)
      } catch {
        // Fallback to mock data if API unavailable
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [ready, user, navigate])

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading dashboard…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerNav activeTab="home" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
          Dashboard <span className="text-purple-700">Overview</span>
        </h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="TOTAL QUOTES" value={String(stats.totalQuotes)} sub={`${stats.approvedQuotes} approved`} />
          <StatCard title="ACTIVE ORDERS" value={String(stats.activeOrders)} sub={`${stats.processingOrders} processing`} />
          <StatCard title="TOTAL INVOICED" value={`₹${(stats.totalInvoiced / 1000).toFixed(1)}K`} sub="this month" highlight />
          <StatCard title="REFERRAL POINTS" value={`${stats.referralPoints} pts`} sub={`≈ ₹${stats.referralPoints} credit`} />
        </div>

        {/* Recent Activity */}
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">
          Recent <span className="text-purple-700">Activity</span>
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['TYPE', 'REF #', 'DATE', 'AMOUNT', 'STATUS'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activity.map((row) => (
                <tr key={row.ref} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-700">{row.type}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{row.ref}</td>
                  <td className="px-6 py-4 text-gray-500">{row.date}</td>
                  <td className="px-6 py-4 font-semibold text-purple-700">₹{row.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, sub, highlight }: { title: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      <p className={`text-3xl font-extrabold mb-1 ${highlight ? 'text-purple-700' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
