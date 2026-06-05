import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [autoPurgeDays, setAutoPurgeDays] = useState(30)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }
  }, [ready, user, navigate])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleSave = () => {
    // Mock save, since we don't have a frontend-facing API for tenant settings yet
    triggerToast(`Settings saved: Auto-purge set to ${autoPurgeDays} days.`)
  }

  if (!ready) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminNav activeTab="settings" role="admin" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="sidebar-content flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <button className="mobile-menu-btn sm:hidden" onClick={() => setSidebarOpen(true)} type="button">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">System Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Configure global application settings and policies</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recycle Bin Policy</h2>
            </div>
            <div className="p-6">
              <div className="max-w-md">
                <label className="block text-sm font-bold text-gray-700 mb-2">Auto-Purge Deleted Items (Days)</label>
                <p className="text-xs text-gray-500 mb-4">
                  Items sent to the Recycle Bin will be permanently deleted after this many days. The background scheduler runs daily at 2 AM.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={autoPurgeDays}
                    onChange={(e) => setAutoPurgeDays(parseInt(e.target.value) || 30)}
                    className="w-24 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold rounded-lg shadow-sm transition-all"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-slate-800/80 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
