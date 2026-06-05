import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { PartnerNav } from '../../components/PartnerNav'
import { apiGet, apiPost } from '../../lib/api'
import { getServerUser } from '../../lib/auth'

export const Route = createFileRoute('/partner/quotations')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // return { user }
  },
  component: QuotationsPage,
})

interface Quotation {
  id: string
  quoteNo: string
  date: string
  products: string
  amount: number
  status: string
  pdfUrl?: string
  quoteLink?: string
}

const MOCK_QUOTES: Quotation[] = [
  { id: '1', quoteNo: 'QT-2026-001', date: '15 Apr 2026', products: 'A4 Letterhead, Gumming', amount: 8200, status: 'APPROVED' },
  { id: '2', quoteNo: 'QT-2026-002', date: '10 Apr 2026', products: '250 GSM Color Print', amount: 5750, status: 'SENT' },
  { id: '3', quoteNo: 'QT-2026-003', date: '05 Apr 2026', products: 'Metallic Sheet + Spiral', amount: 3600, status: 'DRAFT' },
  { id: '4', quoteNo: 'QT-2026-004', date: '02 Apr 2026', products: 'Hard Lamination', amount: 4200, status: 'APPROVED' },
  { id: '5', quoteNo: 'QT-2026-005', date: '28 Mar 2026', products: '350 GSM Cards', amount: 9000, status: 'APPROVED' },
  { id: '6', quoteNo: 'QT-2026-006', date: '20 Mar 2026', products: 'Party Paper Batch', amount: 2800, status: 'SENT' },
]

function statusColor(status: string) {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-700'
    case 'SENT': return 'bg-blue-100 text-blue-600'
    case 'DRAFT': return 'bg-gray-100 text-gray-500'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function QuotationsPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<Quotation[]>(MOCK_QUOTES)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newQuote, setNewQuote] = useState({ products: '', quantity: '', notes: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }

    apiGet<Quotation[]>('/api/partner/quotations')
      .then(setQuotes)
      .catch(() => {}) // fallback to mock
      .finally(() => setLoading(false))
  }, [ready, user, navigate])

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await apiPost('/api/partner/quotations', newQuote)
      const updated = await apiGet<Quotation[]>('/api/partner/quotations')
      setQuotes(updated)
    } catch {
      // In dev, just close modal
    } finally {
      setCreating(false)
      setShowCreateModal(false)
      setNewQuote({ products: '', quantity: '', notes: '' })
    }
  }

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading quotations…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerNav activeTab="quotations" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">
            My <span className="text-purple-700">Quotations</span>
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-700 text-white text-sm font-semibold rounded-lg hover:bg-purple-800 transition-colors"
          >
            + Create Quotation
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['QUOTE #', 'DATE', 'PRODUCTS', 'AMOUNT', 'STATUS', 'QUOTE PDF', 'QUOTE LINK'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-700">{q.quoteNo}</td>
                  <td className="px-5 py-4 text-gray-500">{q.date}</td>
                  <td className="px-5 py-4 text-gray-700">{q.products}</td>
                  <td className="px-5 py-4 font-semibold text-purple-700">₹{q.amount.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(q.status)}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={q.pdfUrl || '#'}
                      className="flex items-center gap-1 text-gray-600 hover:text-purple-700 text-xs font-medium"
                    >
                      📄 PDF
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={q.quoteLink || '#'}
                      className="flex items-center gap-1 text-gray-600 hover:text-purple-700 text-xs font-medium"
                    >
                      🔗 Link
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Quotation</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Products / Services *</label>
                <input
                  required
                  value={newQuote.products}
                  onChange={(e) => setNewQuote({ ...newQuote, products: e.target.value })}
                  placeholder="e.g. A4 Letterhead, Gumming"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  required
                  type="number"
                  value={newQuote.quantity}
                  onChange={(e) => setNewQuote({ ...newQuote, quantity: e.target.value })}
                  placeholder="e.g. 1000"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={newQuote.notes}
                  onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                  placeholder="Special instructions, paper type, finishing requirements…"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-purple-700 text-white rounded-lg text-sm font-semibold hover:bg-purple-800 disabled:opacity-60"
                >
                  {creating ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
