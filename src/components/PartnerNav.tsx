import { Link, useNavigate } from '@tanstack/react-router'
import { useIdentity } from '../lib/identity-context'

interface PartnerNavProps {
  activeTab: 'home' | 'quotations' | 'orders' | 'invoices'
}

export function PartnerNav({ activeTab }: PartnerNavProps) {
  const { user, logout } = useIdentity()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  const tabs = [
    { id: 'home', label: '🏠 Home', to: '/partner' },
    { id: 'quotations', label: '📋 Quotations', to: '/partner/quotations' },
    { id: 'orders', label: '📦 Orders', to: '/partner/orders' },
    { id: 'invoices', label: '🧾 Invoices', to: '/partner/invoices' },
  ] as const

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap max-w-[50vw] sm:max-w-none">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 hidden sm:block">
            Welcome, <span className="text-gray-900 font-semibold">{user?.username || user?.email}</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
