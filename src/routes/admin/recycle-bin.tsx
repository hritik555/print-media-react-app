import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet, apiPost, apiDelete } from '../../lib/api'

export const Route = createFileRoute('/admin/recycle-bin')({
  component: RecycleBinPage,
})

type EntityType = 'items' | 'parties' | 'quotations' | 'orders' | 'invoices' | 'users'

function RecycleBinPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<EntityType>('items')
  const [data, setData] = useState<any[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const TABS: { label: string, value: EntityType }[] = [
    { label: 'Items', value: 'items' },
    { label: 'Parties', value: 'parties' },
    { label: 'Quotations', value: 'quotations' },
    { label: 'Orders', value: 'orders' },
    { label: 'Invoices', value: 'invoices' },
    { label: 'Users', value: 'users' },
  ]

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }
    fetchDeletedItems(activeTab)
  }, [ready, user, navigate, activeTab])

  const fetchDeletedItems = (entity: EntityType) => {
    setLoading(true)
    apiGet<any[]>(`/api/admin/recycle-bin/${entity}`)
      .then(res => setData(res || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleRestore = async (id: number) => {
    if (!confirm('Are you sure you want to restore this item?')) return
    try {
      await apiPost(`/api/admin/recycle-bin/${activeTab}/${id}/restore`, {})
      triggerToast('Item restored successfully.')
      fetchDeletedItems(activeTab)
    } catch (e) {
      triggerToast('Failed to restore item.')
    }
  }

  const handleHardDelete = async (id: number) => {
    if (!confirm('WARNING: This will permanently delete this item. Continue?')) return
    try {
      await apiDelete(`/api/admin/recycle-bin/${activeTab}/${id}`)
      triggerToast('Item permanently deleted.')
      fetchDeletedItems(activeTab)
    } catch (e) {
      triggerToast('Failed to delete item.')
    }
  }

  const getId = (item: any): number => {
    switch (activeTab) {
      case 'items': return item.item_id
      case 'parties': return item.party_id
      case 'quotations': return item.quotation_id
      case 'orders': return item.order_id
      case 'invoices': return item.invoice_id
      case 'users': return item.user_id
      default: return 0
    }
  }

  const getName = (item: any): string => {
    switch (activeTab) {
      case 'items': return item.item_name || 'Unnamed Item'
      case 'parties': return item.listing_name || 'Unnamed Party'
      case 'quotations': return item.quote_number || 'Unnamed Quotation'
      case 'orders': return `Order #${item.order_id}`
      case 'invoices': return item.invoice_number || 'Unnamed Invoice'
      case 'users': return item.email || 'Unknown User'
      default: return 'Unknown'
    }
  }

  if (!ready) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="recycle-bin" role="admin" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
          
          <div className="flex items-center gap-3 mb-8">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Recycle Bin</h1>
              <p className="text-gray-500 text-sm mt-1">Restore or permanently delete soft-deleted records.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-100 bg-slate-50/50">
              {TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-6 py-4 text-sm font-bold tracking-wide whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.value
                      ? 'border-purple-600 text-purple-700 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">ID</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Identifier / Name</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Deleted At</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-400 text-sm">Loading deleted items...</td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-400 text-sm bg-white">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Recycle Bin is empty for {activeTab}.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors bg-white">
                        <td className="px-6 py-4 font-semibold text-gray-900">{getId(item)}</td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{getName(item)}</td>
                        <td className="px-6 py-4 text-gray-500">{item.deleted_at ? new Date(item.deleted_at).toLocaleString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => handleRestore(getId(item))}
                            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-bold rounded-lg text-xs transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleHardDelete(getId(item))}
                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors"
                          >
                            Delete Forever
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-slate-800/80 animate-fadeIn">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
