import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api'
import { getServerUser } from '../../lib/auth'
import { MoreVertical, Edit2, Trash2, Ban, UserCheck, UserPlus, X, Check } from 'lucide-react'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // if (!user.roles?.includes('admin')) throw redirect({ to: '/' })
    // return { user }
  },
  component: UsersPage,
})

interface AppUser {
  id: string
  name: string
  email: string
  roles: string[]
  lastLogin: string
  status: 'active' | 'invited' | 'blocked'
}

const MOCK_USERS: AppUser[] = [
  { id: '1', name: 'Amit Patel', email: 'amit@printpro.in', roles: ['admin'], lastLogin: '30 May 2026', status: 'active' },
  { id: '2', name: 'Neha Joshi', email: 'neha@printpro.in', roles: ['staff'], lastLogin: '30 May 2026', status: 'active' },
  { id: '3', name: 'Rajesh Sharma', email: 'rajesh@sharma.com', roles: ['partner'], lastLogin: '29 May 2026', status: 'active' },
  { id: '4', name: 'Priya Mehta', email: 'priya@metroprint.com', roles: ['partner'], lastLogin: '28 May 2026', status: 'active' },
  { id: '5', name: 'Vikram Singh', email: 'vikram@spectrum.com', roles: ['partner'], lastLogin: '10 May 2026', status: 'blocked' },
  { id: '6', name: 'Kavita Das', email: 'kavita@printpro.in', roles: ['staff'], lastLogin: 'Never', status: 'invited' },
]

// Mock initial pending requests to populate the list on first load
const INITIAL_PENDING_REQUESTS = [
  {
    id: 'REQ-1780324800000',
    requestId: 'REQ-1780324800000',
    businessName: 'Aggarwal Printing Hub',
    yourName: 'Sunil Aggarwal',
    whatsapp: '9998887776',
    whatsappNo: '9998887776',
    email: 'sunil@aggarwalprint.com',
    country: 'India',
    pinCode: '302001',
    gstNumber: '08AAACA1234B1Z9',
    fullAddress: 'MI Road, Jaipur, Rajasthan',
    submittedAt: '01 Jun 2026',
    createdAt: '2026-06-01T12:00:00Z'
  },
  {
    id: 'REQ-1780324900000',
    requestId: 'REQ-1780324900000',
    businessName: 'Saraswati Offset',
    yourName: 'Mahesh Saraswat',
    whatsapp: '9876598765',
    whatsappNo: '9876598765',
    email: 'mahesh@saraswati.com',
    country: 'India',
    pinCode: '110001',
    gstNumber: '07AAACS5678D1Z2',
    fullAddress: 'Connaught Place, Delhi, NCR',
    submittedAt: '02 Jun 2026',
    createdAt: '2026-06-02T12:00:00Z'
  }
]

function roleBadge(role: string) {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-700'
    case 'staff': return 'bg-blue-100 text-blue-600'
    case 'partner': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function statusColor(s: string) {
  switch (s) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'invited': return 'bg-yellow-100 text-yellow-700'
    case 'blocked': return 'bg-red-100 text-red-600'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function UsersPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS)
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Tab State
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active')

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Rejection Dialogue state
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Active User Dropdown/Menu state
  const [activeUserMenuId, setActiveUserMenuId] = useState<string | null>(null)

  // Add User Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addRole, setAddRole] = useState<'admin' | 'staff'>('staff')

  // Edit User Modal State
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<string>('staff')
  const [editPassword, setEditPassword] = useState('')

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }
    
    // Load active users from API
    apiGet<AppUser[]>('/api/admin/users')
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))

    // Load pending requests from API, fallback to localStorage if it fails
    apiGet<any[]>('/api/admin/users/pending')
      .then(setPendingRequests)
      .catch(() => {
        const saved = localStorage.getItem('printpro_pending_requests')
        if (!saved) {
          localStorage.setItem('printpro_pending_requests', JSON.stringify(INITIAL_PENDING_REQUESTS))
          setPendingRequests(INITIAL_PENDING_REQUESTS)
        } else {
          setPendingRequests(JSON.parse(saved))
        }
      })
  }, [ready, user, navigate])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleApprove = (req: any) => {
    const reqId = req.id || req.requestId
    apiPost('/api/admin/users/approve', { requestId: reqId })
      .then(() => {
        setPendingRequests((prev) => prev.filter(item => (item.id !== reqId && item.requestId !== reqId)))
        const newUser: AppUser = {
          id: String(users.length + 1),
          name: req.yourName || req.name || 'Partner',
          email: req.email,
          roles: ['partner'],
          lastLogin: 'Never',
          status: 'active'
        }
        setUsers((prev) => [...prev, newUser])
        triggerToast(`Approved ${req.businessName || 'Request'}! Partner ID activated.`)
      })
      .catch(() => {
        // Fallback simulation
        const updatedPending = pendingRequests.filter(item => item.id !== req.id)
        setPendingRequests(updatedPending)
        localStorage.setItem('printpro_pending_requests', JSON.stringify(updatedPending))
        const newUser: AppUser = {
          id: String(users.length + 1),
          name: req.yourName || req.name || 'Partner',
          email: req.email,
          roles: ['partner'],
          lastLogin: 'Never',
          status: 'active'
        }
        setUsers((prev) => [...prev, newUser])
        triggerToast(`Approved ${req.businessName || 'Request'} (Mock)! Partner ID activated.`)
      })
  }

  const openRejectDialog = (req: any) => {
    setRejectingRequest(req)
    setRejectionReason('')
  }

  const handleReject = () => {
    if (!rejectingRequest) return
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }

    const reqId = rejectingRequest.id || rejectingRequest.requestId
    apiPost('/api/admin/users/reject', { 
      requestId: reqId, 
      reason: rejectionReason 
    })
      .then(() => {
        setPendingRequests((prev) => prev.filter(item => (item.id !== reqId && item.requestId !== reqId)))
        triggerToast(`Rejected application for ${rejectingRequest.businessName}.`)
        setRejectingRequest(null)
      })
      .catch(() => {
        // Fallback simulation
        const updatedPending = pendingRequests.filter(item => item.id !== rejectingRequest.id)
        setPendingRequests(updatedPending)
        localStorage.setItem('printpro_pending_requests', JSON.stringify(updatedPending))
        triggerToast(`Rejected application for ${rejectingRequest.businessName} (Mock).`)
        setRejectingRequest(null)
      })
  }

  const handleDeleteUser = (u: AppUser) => {
    if (!window.confirm(`Are you sure you want to delete ${u.name}?`)) return
    
    apiDelete(`/api/admin/users/${u.id}`)
      .then(() => {
        setUsers(prev => prev.filter(item => item.id !== u.id))
        triggerToast(`Deleted user ${u.name} successfully.`)
      })
      .catch(() => {
        // Fallback
        setUsers(prev => prev.filter(item => item.id !== u.id))
        triggerToast(`Deleted user ${u.name} (Mock).`)
      })
  }

  const handleToggleBlock = (u: AppUser) => {
    const newStatus = u.status === 'blocked' ? 'active' : 'blocked'
    apiPut<AppUser>(`/api/admin/users/${u.id}`, { status: newStatus })
      .then((updated) => {
        setUsers(prev => prev.map(item => item.id === u.id ? { ...item, status: updated.status } : item))
        triggerToast(`${newStatus === 'blocked' ? 'Blocked' : 'Unblocked'} user ${u.name}.`)
      })
      .catch(() => {
        // Fallback
        setUsers(prev => prev.map(item => item.id === u.id ? { ...item, status: newStatus } : item))
        triggerToast(`${newStatus === 'blocked' ? 'Blocked' : 'Unblocked'} user ${u.name} (Mock).`)
      })
  }

  const handleMakeAdmin = (u: AppUser) => {
    apiPut<AppUser>(`/api/admin/users/${u.id}`, { roleName: 'admin' })
      .then((updated) => {
        setUsers(prev => prev.map(item => item.id === u.id ? { ...item, roles: updated.roles } : item))
        triggerToast(`Promoted ${u.name} to Admin.`)
      })
      .catch(() => {
        // Fallback
        setUsers(prev => prev.map(item => item.id === u.id ? { ...item, roles: ['admin'] } : item))
        triggerToast(`Promoted ${u.name} to Admin (Mock).`)
      })
  }

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addName.trim() || !addEmail.trim() || !addPassword || !addRole) return

    apiPost<AppUser>('/api/admin/users', {
      name: addName.trim(),
      email: addEmail.trim().toLowerCase(),
      password: addPassword,
      roleName: addRole
    })
      .then((createdUser) => {
        setUsers((prev) => [...prev, createdUser])
        triggerToast(`Created operator ${createdUser.name} successfully.`)
        setAddModalOpen(false)
      })
      .catch((err) => {
        console.error('Error creating user', err)
        // Fallback simulation
        const mockNew: AppUser = {
          id: String(users.length + 100),
          name: addName.trim(),
          email: addEmail.trim().toLowerCase(),
          roles: [addRole],
          lastLogin: 'Never',
          status: 'active'
        }
        setUsers((prev) => [...prev, mockNew])
        triggerToast(`Created operator ${addName} (Mock).`)
        setAddModalOpen(false)
      })
  }

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser || !editName.trim() || !editEmail.trim() || !editRole) return

    apiPut<AppUser>(`/api/admin/users/${editUser.id}`, {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      roleName: editRole,
      password: editPassword.trim() || undefined
    })
      .then((updatedUser) => {
        setUsers((prev) => prev.map(u => u.id === editUser.id ? updatedUser : u))
        triggerToast(`Updated user details successfully.`)
        setEditUser(null)
      })
      .catch((err) => {
        console.error('Error updating user', err)
        // Fallback simulation
        setUsers((prev) => prev.map(u => u.id === editUser.id ? {
          ...u,
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          roles: [editRole]
        } : u))
        triggerToast(`Updated user details (Mock).`)
        setEditUser(null)
      })
  }

  if (!ready || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading…</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="users" role="admin" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">User Management</h1>
                <p className="text-gray-500 text-sm mt-1">Manage system operators and verify B2B printer signups</p>
              </div>
            </div>
            {activeTab === 'active' && (
              <button
                onClick={() => {
                  setAddName('')
                  setAddEmail('')
                  setAddPassword('')
                  setAddRole('staff')
                  setAddModalOpen(true)
                }}
                className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 mb-6 gap-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'active' ? 'border-purple-700 text-purple-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Active Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'pending' ? 'border-purple-700 text-purple-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span>Pending Requests</span>
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: ACTIVE USERS */}
          {activeTab === 'active' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm animate-fadeIn min-h-[350px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/50">
                    {['USER', 'ROLE', 'LAST LOGIN', 'STATUS'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-gray-400 text-xs">{u.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span key={r} className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${roleBadge(r)}`}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{u.lastLogin}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${statusColor(u.status)}`}>{u.status.toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-4 text-right relative">
                        <button
                          onClick={() => setActiveUserMenuId(activeUserMenuId === u.id ? null : u.id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 focus:outline-none inline-flex items-center justify-center"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeUserMenuId === u.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveUserMenuId(null)} />
                            <div className="absolute right-5 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1.5 animate-fadeIn text-left">
                              <button
                                onClick={() => {
                                  setActiveUserMenuId(null)
                                  setEditUser(u)
                                  setEditName(u.name)
                                  setEditEmail(u.email)
                                  setEditRole(u.roles[0] || 'staff')
                                  setEditPassword('')
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-semibold transition-colors flex items-center gap-2"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                View/Edit Details
                              </button>
                              
                              {u.roles.includes('staff') && (
                                <button
                                  onClick={() => {
                                    setActiveUserMenuId(null)
                                    handleMakeAdmin(u)
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs text-purple-700 hover:bg-purple-50 font-bold transition-colors flex items-center gap-2"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Make Admin
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setActiveUserMenuId(null)
                                  handleToggleBlock(u)
                                }}
                                className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-2 ${
                                  u.status === 'blocked' ? 'text-green-700 hover:bg-green-50' : 'text-amber-700 hover:bg-amber-50'
                                }`}
                              >
                                <Ban className="w-3.5 h-3.5" />
                                {u.status === 'blocked' ? 'Unblock User' : 'Block User'}
                              </button>

                              <button
                                onClick={() => {
                                  setActiveUserMenuId(null)
                                  handleDeleteUser(u)
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors flex items-center gap-2 border-t border-gray-50 mt-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: PENDING APPROVALS */}
          {activeTab === 'pending' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm animate-fadeIn">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/50">
                    {['BUSINESS NAME', 'APPLICANT', 'WHATSAPP', 'EMAIL', 'LOCATION', 'SUBMITTED', 'ACTIONS'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((r) => {
                    const reqId = r.requestId || r.id
                    const whatsappValue = r.whatsappNo || r.whatsapp
                    let dateStr = r.submittedAt || '02 Jun 2026'
                    if (r.createdAt) {
                      try {
                        dateStr = new Date(r.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      } catch (e) {}
                    }
                    return (
                      <tr key={reqId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          <div className="max-w-[150px] truncate" title={r.businessName}>
                            {r.businessName}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-700 font-medium">
                          <div className="max-w-[120px] truncate" title={r.yourName}>
                            {r.yourName}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-600">{whatsappValue}</td>
                        <td className="px-5 py-4 text-gray-500 text-xs">
                          <div className="max-w-[150px] truncate" title={r.email}>
                            {r.email}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-xs">
                          <div className="max-w-[180px] truncate" title={`${r.fullAddress}, ${r.pinCode}, ${r.country}`}>
                            {r.fullAddress}, {r.pinCode}, {r.country}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{dateStr}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(r)}
                              className="p-1.5 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 hover:border-green-600 rounded-lg transition-all focus:outline-none flex items-center justify-center cursor-pointer"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectDialog(r)}
                              className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg transition-all focus:outline-none flex items-center justify-center cursor-pointer"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {pendingRequests.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">No pending signup requests found</div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── REJECTION REASON MODAL ───────────────────────────── */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Decline Application</span>
              <button onClick={() => setRejectingRequest(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500">
                Provide a reason for declining the B2B registration of <strong>{rejectingRequest.businessName}</strong>. 
                This message will be sent to the applicant.
              </p>
              <textarea
                rows={3}
                placeholder="e.g. Invalid GST number or unable to verify offset press credentials."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 resize-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD USER MODAL ───────────────────────────── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-700" />
                Add System Operator
              </span>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@printpro.in"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">System Role</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                    addRole === 'staff' ? 'border-purple-600 bg-purple-50/50 text-purple-700 font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}>
                    <span className="text-xs font-medium">Staff Operator</span>
                    <input
                      type="radio"
                      name="addRole"
                      checked={addRole === 'staff'}
                      onChange={() => setAddRole('staff')}
                      className="text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                    />
                  </label>
                  <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                    addRole === 'admin' ? 'border-purple-600 bg-purple-50/50 text-purple-700 font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}>
                    <span className="text-xs font-medium">Admin Operator</span>
                    <input
                      type="radio"
                      name="addRole"
                      checked={addRole === 'admin'}
                      onChange={() => setAddRole('admin')}
                      className="text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ───────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-700" />
                Edit User Details
              </span>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
                {editUser.roles.includes('partner') ? (
                  <input
                    type="text"
                    disabled
                    value="Partner"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 transition-all"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </select>
                )}
              </div>

              {!editUser.roles.includes('partner') && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="•••••••• (leave blank to keep unchanged)"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 transition-all"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
