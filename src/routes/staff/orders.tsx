import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet } from '../../lib/api'
import { getServerUser } from '../../lib/auth'

export const Route = createFileRoute('/staff/orders')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // if (!user.roles?.includes('admin')) throw redirect({ to: '/' })
    // return { user }
  },
  component: AdminOrdersPage,
})

interface AdminOrder {
  id: string
  orderNo: string
  partner: string
  date: string
  products: string
  qty: number
  amount: number
  status: string
}

const MOCK: AdminOrder[] = [
  { id: '1', orderNo: 'ORD-2026-089', partner: 'Metro Print Solutions', date: '30 May 2026', products: 'A4 Letterhead', qty: 5000, amount: 28500, status: 'PROCESSING' },
  { id: '2', orderNo: 'ORD-2026-088', partner: 'Spectrum Media', date: '28 May 2026', products: 'Magazine 48pp', qty: 2000, amount: 45000, status: 'DELIVERED' },
  { id: '3', orderNo: 'ORD-2026-087', partner: 'Sharma Enterprises', date: '27 May 2026', products: '350 GSM Cards', qty: 1500, amount: 12000, status: 'PROCESSING' },
  { id: '4', orderNo: 'ORD-2026-086', partner: 'Apex Publications', date: '25 May 2026', products: 'Hard Lamination', qty: 800, amount: 9500, status: 'DELIVERED' },
  { id: '5', orderNo: 'ORD-2026-085', partner: 'Creative Studios', date: '24 May 2026', products: 'Metallic Sheet Print', qty: 300, amount: 18000, status: 'SHIPPED' },
]

function statusColor(s: string) {
  switch (s) {
    case 'DELIVERED': return 'bg-green-100 text-green-700'
    case 'SHIPPED': return 'bg-blue-100 text-blue-600'
    case 'PROCESSING': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function AdminOrdersPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<AdminOrder[]>(MOCK)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }
    apiGet<AdminOrder[]>('/api/admin/orders')
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ready, user, navigate])

  if (!ready || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading…</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="orders" role="staff" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-2xl font-extrabold text-gray-900">All Orders</h1>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['ORDER #', 'PARTNER', 'DATE', 'PRODUCTS', 'QTY', 'AMOUNT', 'STATUS'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-700">{o.orderNo}</td>
                    <td className="px-5 py-4 text-gray-700">{o.partner}</td>
                    <td className="px-5 py-4 text-gray-500">{o.date}</td>
                    <td className="px-5 py-4 text-gray-700">{o.products}</td>
                    <td className="px-5 py-4 text-gray-700">{o.qty.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 font-semibold text-purple-700">₹{o.amount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(o.status)}`}>{o.status}</span>
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
