import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet } from '../../lib/api'
import { getServerUser } from '../../lib/auth'

export const Route = createFileRoute('/admin/inventory')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // if (!user.roles?.includes('admin')) throw redirect({ to: '/' })
    // return { user }
  },
  component: InventoryPage,
})

interface InventoryItem {
  id: string
  name: string
  category: string
  stockQty: number
  unit: string
  reorderLevel: number
  stockValue: number
  lastUpdated: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'A4 White Paper 75 GSM', category: 'Paper', stockQty: 12500, unit: 'Sheets', reorderLevel: 5000, stockValue: 37500, lastUpdated: '30 May 2026', status: 'in-stock' },
  { id: '2', name: 'A3 Art Card 300 GSM', category: 'Card Stock', stockQty: 3200, unit: 'Sheets', reorderLevel: 2000, stockValue: 64000, lastUpdated: '29 May 2026', status: 'in-stock' },
  { id: '3', name: 'CMYK Offset Ink Set', category: 'Ink', stockQty: 8, unit: 'Sets', reorderLevel: 10, stockValue: 48000, lastUpdated: '28 May 2026', status: 'low-stock' },
  { id: '4', name: 'Metallic Gold Foil Roll', category: 'Foil', stockQty: 0, unit: 'Rolls', reorderLevel: 5, stockValue: 0, lastUpdated: '25 May 2026', status: 'out-of-stock' },
  { id: '5', name: 'Hard Lamination Film 12"', category: 'Lamination', stockQty: 45, unit: 'Rolls', reorderLevel: 20, stockValue: 67500, lastUpdated: '30 May 2026', status: 'in-stock' },
  { id: '6', name: 'Thermal CTP Plates', category: 'Plates', stockQty: 150, unit: 'Plates', reorderLevel: 100, stockValue: 75000, lastUpdated: '27 May 2026', status: 'in-stock' },
  { id: '7', name: 'Gumming Adhesive 5L', category: 'Adhesive', stockQty: 3, unit: 'Cans', reorderLevel: 5, stockValue: 4500, lastUpdated: '26 May 2026', status: 'low-stock' },
  { id: '8', name: 'UV Varnish Coating', category: 'Coating', stockQty: 12, unit: 'Litres', reorderLevel: 8, stockValue: 18000, lastUpdated: '29 May 2026', status: 'in-stock' },
]

function statusColor(status: string) {
  switch (status) {
    case 'in-stock': return 'bg-green-100 text-green-700'
    case 'low-stock': return 'bg-yellow-100 text-yellow-700'
    case 'out-of-stock': return 'bg-red-100 text-red-600'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'in-stock': return 'IN STOCK'
    case 'low-stock': return 'LOW STOCK'
    case 'out-of-stock': return 'OUT OF STOCK'
    default: return status.toUpperCase()
  }
}

function InventoryPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all')

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }
    apiGet<InventoryItem[]>('/api/admin/inventory')
      .then(setInventory)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ready, user, navigate])

  const filtered = filter === 'all' ? inventory : inventory.filter((i) => i.status === filter)

  const totalValue = inventory.reduce((sum, i) => sum + i.stockValue, 0)
  const lowStockCount = inventory.filter((i) => i.status === 'low-stock').length
  const outOfStockCount = inventory.filter((i) => i.status === 'out-of-stock').length

  if (!ready || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading…</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="inventory" role="admin" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Inventory Manager</h1>
                <p className="text-gray-500 text-sm mt-1">Track stock levels and manage inventory</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="rounded-xl border bg-white border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Items</p>
              <p className="text-2xl font-extrabold text-gray-900">{inventory.length}</p>
            </div>
            <div className="rounded-xl border bg-white border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Stock Value</p>
              <p className="text-2xl font-extrabold text-purple-700">₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-xl border bg-yellow-50 border-yellow-100 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Low Stock</p>
              <p className="text-2xl font-extrabold text-yellow-600">{lowStockCount}</p>
            </div>
            <div className="rounded-xl border bg-red-50 border-red-100 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Out of Stock</p>
              <p className="text-2xl font-extrabold text-red-600">{outOfStockCount}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all', 'in-stock', 'low-stock', 'out-of-stock'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                type="button"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-purple-700 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'All' : statusLabel(f)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['ITEM', 'CATEGORY', 'STOCK QTY', 'UNIT', 'REORDER LEVEL', 'STOCK VALUE', 'LAST UPDATED', 'STATUS'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-5 py-4 text-gray-600">{item.category}</td>
                    <td className="px-5 py-4 text-gray-700 font-semibold">{item.stockQty.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-gray-500">{item.unit}</td>
                    <td className="px-5 py-4 text-gray-500">{item.reorderLevel.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 font-semibold text-purple-700">₹{item.stockValue.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-gray-500">{item.lastUpdated}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
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
