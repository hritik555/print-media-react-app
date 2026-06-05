import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet, apiPost } from '../../lib/api'

export const Route = createFileRoute('/admin/invoices')({
  component: AdminInvoicesPage,
})

interface AdminInvoice {
  id: string
  invoiceNo: string
  partner: string
  date: string
  orderRef: string
  amount: number
  gst: number
  total: number
  status: string
}

interface AdminOrderDto {
  id: string
  orderNo: string
  partner: string
  date: string
  products: string
  qty: number
  amount: number
  status: string
}

function statusColor(s: string) {
  switch (s) {
    case 'PAID': return 'bg-green-100 text-green-700'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700'
    case 'OVERDUE': return 'bg-red-100 text-red-600'
    case 'UNPAID': return 'bg-orange-100 text-orange-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function AdminInvoicesPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Pagination & Filtering
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uninvoicedOrders, setUninvoicedOrders] = useState<AdminOrderDto[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  
  // Date Range inside Modal
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }
    fetchInvoices()
  }, [ready, user, navigate, page, statusFilter])

  const fetchInvoices = () => {
    setLoading(true)
    let url = `/api/admin/invoices?page=${page}&size=10`
    if (statusFilter) url += `&status=${statusFilter}`
    
    apiGet<any>(url)
      .then(res => {
        if (res.content) {
          setInvoices(res.content)
          setTotalPages(res.totalPages || 1)
        } else if (Array.isArray(res)) {
          setInvoices(res)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const openModal = () => {
    setIsModalOpen(true)
    setLoadingOrders(true)
    setSelectedOrderIds([])
    setStartDate('')
    setEndDate('')
    apiGet<AdminOrderDto[]>('/api/admin/orders/uninvoiced')
      .then(res => setUninvoicedOrders(res || []))
      .catch(() => {})
      .finally(() => setLoadingOrders(false))
  }

  const handleGenerateInvoice = async () => {
    if (selectedOrderIds.length === 0) {
      alert('Please select at least one order.')
      return
    }
    try {
      const orderIdsNum = selectedOrderIds.map(id => parseInt(id))
      await apiPost('/api/admin/invoices', orderIdsNum)
      triggerToast('Consolidated Invoice generated successfully!')
      setIsModalOpen(false)
      fetchInvoices()
    } catch (e) {
      triggerToast('Failed to generate invoice.')
    }
  }

  const handleExport = () => {
    // Because it's a file download, we can't easily use apiGet (which assumes JSON usually). 
    // We can just open the URL. If auth is required, we might need a fetch with blob, but standard practice in this app is cookie based.
    // If Netlify Identity requires Bearer token, we need a fetch with blob.
    
    // We'll use a fetch blob approach to attach the auth header if needed.
    const token = user?.token?.access_token
    fetch('/api/admin/invoices/export', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'invoices.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    })
    .catch(() => triggerToast('Failed to export invoices.'))
  }

  // Filter uninvoiced orders by date range
  const filteredOrders = uninvoicedOrders.filter(o => {
    if (!startDate && !endDate) return true;
    const oDate = new Date(o.date);
    if (startDate && new Date(startDate) > oDate) return false;
    if (endDate && new Date(endDate) < oDate) return false;
    return true;
  })

  if (!ready || (loading && invoices.length === 0)) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading…</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="invoices" role="admin" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">All Invoices</h1>
                <p className="text-gray-500 text-sm mt-1">Manage and export billing records</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                📥 Export Excel
              </button>
              <button
                onClick={openModal}
                className="px-4 py-2 bg-[#8b5cf6] hover:bg-purple-800 text-white font-bold rounded-lg shadow-sm text-sm transition-colors flex items-center gap-2"
              >
                + Create Consolidated Invoice
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/50">
                    {['INVOICE #', 'PARTNER', 'DATE', 'ORDER REF', 'AMOUNT', 'GST', 'TOTAL', 'STATUS'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">No invoices found.</td></tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-700">{inv.invoiceNo}</td>
                      <td className="px-5 py-4 text-gray-700">{inv.partner}</td>
                      <td className="px-5 py-4 text-gray-500">{inv.date}</td>
                      <td className="px-5 py-4 text-gray-500">{inv.orderRef}</td>
                      <td className="px-5 py-4 text-gray-700">₹{inv.amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-gray-700">₹{inv.gst.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 font-semibold text-purple-700">₹{inv.total.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(inv.status)}`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500 font-medium">Page {page + 1} of {totalPages}</span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONSOLIDATED INVOICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Create Consolidated Invoice</h2>
                <p className="text-xs text-gray-500 mt-1">Select uninvoiced orders to generate a single invoice.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-200 rounded text-sm px-3 py-1.5 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-200 rounded text-sm px-3 py-1.5 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="ml-auto flex items-end">
                  <span className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                    {filteredOrders.length} Orders Available
                  </span>
                </div>
              </div>

              {loadingOrders ? (
                <div className="text-center py-10 text-gray-400 text-sm">Fetching orders...</div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left w-12">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedOrderIds(filteredOrders.map(o => o.id))
                              else setSelectedOrderIds([])
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Order #</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Partner</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Products</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400">No uninvoiced orders found.</td></tr>
                      ) : filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(o.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedOrderIds([...selectedOrderIds, o.id])
                                else setSelectedOrderIds(selectedOrderIds.filter(id => id !== o.id))
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{o.orderNo}</td>
                          <td className="px-4 py-3 text-gray-700">{o.partner}</td>
                          <td className="px-4 py-3 text-gray-500">{o.date}</td>
                          <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]" title={o.products}>{o.products}</td>
                          <td className="px-4 py-3 font-bold text-purple-700">₹{o.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="text-sm font-bold text-gray-600">{selectedOrderIds.length} Selected</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateInvoice}
                  disabled={selectedOrderIds.length === 0}
                  className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-slate-800/80 animate-fadeIn">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
