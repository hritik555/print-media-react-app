import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { PartnerNav } from '../../components/PartnerNav'
import { apiGet } from '../../lib/api'
import { getServerUser } from '../../lib/auth'

export const Route = createFileRoute('/partner/orders')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // return { user }
  },
  component: OrdersPage,
})

interface Order {
  id: string
  orderNo: string
  date: string
  products: string
  qty: number
  amount: number
  status: string
  orderLink?: string
}

const MOCK_ORDERS: Order[] = [
  { id: '1', orderNo: 'ORD-2026-001', date: '16 Apr 2026', products: 'A4 Letterhead, Gumming', qty: 2100, amount: 8200, status: 'PROCESSING' },
  { id: '2', orderNo: 'ORD-2026-002', date: '12 Apr 2026', products: '250 GSM Color Print', qty: 500, amount: 5750, status: 'DELIVERED' },
  { id: '3', orderNo: 'ORD-2026-003', date: '08 Apr 2026', products: '350 GSM Cards', qty: 1000, amount: 9000, status: 'PROCESSING' },
  { id: '4', orderNo: 'ORD-2026-004', date: '03 Apr 2026', products: 'Hard Lamination', qty: 280, amount: 4200, status: 'DELIVERED' },
]

function statusColor(status: string) {
  switch (status) {
    case 'DELIVERED': return 'bg-green-100 text-green-700'
    case 'PROCESSING': return 'bg-gray-100 text-gray-600'
    case 'SHIPPED': return 'bg-blue-100 text-blue-600'
    case 'CANCELLED': return 'bg-red-100 text-red-600'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function OrdersPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }

    apiGet<Order[]>('/api/partner/orders')
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ready, user, navigate])

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading orders…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerNav activeTab="orders" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-8">
          My <span className="text-purple-700">Orders</span>
        </h1>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['ORDER #', 'DATE', 'PRODUCTS', 'QTY', 'AMOUNT', 'STATUS', 'ORDER LINK'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-700">{o.orderNo}</td>
                  <td className="px-5 py-4 text-gray-500">{o.date}</td>
                  <td className="px-5 py-4 text-gray-700">{o.products}</td>
                  <td className="px-5 py-4 text-gray-700">{o.qty.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 font-semibold text-purple-700">₹{o.amount.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={o.orderLink || '#'}
                      className="flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-lg text-xs font-medium text-gray-600 hover:border-purple-300 hover:text-purple-700 transition-colors w-fit"
                    >
                      🔗 Order Link
                    </a>
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
