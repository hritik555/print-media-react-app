import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { PartnerNav } from '../../components/PartnerNav'
import { apiGet } from '../../lib/api'
import { getServerUser } from '../../lib/auth'

export const Route = createFileRoute('/partner/invoices')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // return { user }
  },
  component: InvoicesPage,
})

interface Invoice {
  id: string
  invoiceNo: string
  date: string
  orderRef: string
  amount: number
  gst: number
  total: number
  status: string
  pdfUrl?: string
}

const MOCK_INVOICES: Invoice[] = [
  { id: '1', invoiceNo: 'INV-2026-001', date: '16 Apr 2026', orderRef: 'ORD-2026-001', amount: 8200, gst: 1476, total: 9676, status: 'PENDING' },
  { id: '2', invoiceNo: 'INV-2026-002', date: '12 Apr 2026', orderRef: 'ORD-2026-002', amount: 5750, gst: 1035, total: 6785, status: 'PAID' },
  { id: '3', invoiceNo: 'INV-2026-003', date: '08 Apr 2026', orderRef: 'ORD-2026-003', amount: 9000, gst: 1620, total: 10620, status: 'PAID' },
  { id: '4', invoiceNo: 'INV-2026-004', date: '03 Apr 2026', orderRef: 'ORD-2026-004', amount: 4200, gst: 756, total: 4956, status: 'PAID' },
]

function statusColor(status: string) {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-700'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700'
    case 'OVERDUE': return 'bg-red-100 text-red-600'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function InvoicesPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }

    apiGet<Invoice[]>('/api/partner/invoices')
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ready, user, navigate])

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading invoices…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerNav activeTab="invoices" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-8">
          My <span className="text-purple-700">Invoices</span>
        </h1>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['INVOICE #', 'DATE', 'ORDER REF', 'AMOUNT', 'GST', 'TOTAL', 'STATUS', 'INVOICE PDF'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-700">{inv.invoiceNo}</td>
                  <td className="px-5 py-4 text-gray-500">{inv.date}</td>
                  <td className="px-5 py-4 text-gray-500">{inv.orderRef}</td>
                  <td className="px-5 py-4 text-gray-700">₹{inv.amount.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 text-gray-700">₹{inv.gst.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 font-semibold text-purple-700">₹{inv.total.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={inv.pdfUrl || '#'}
                      className="flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-lg text-xs font-medium text-gray-600 hover:border-purple-300 hover:text-purple-700 transition-colors w-fit"
                    >
                      🧾 Invoice PDF
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
