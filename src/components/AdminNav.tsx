import { Link, useNavigate } from '@tanstack/react-router'
import { useIdentity } from '../lib/identity-context'
import { useState } from 'react'

export const SIDEBAR_WIDTH = 256

interface AdminNavProps {
  activeTab: string
  role: 'admin' | 'staff'
  isOpen?: boolean
  onToggle?: () => void
}

/* ── SVG Icon Components ─────────────────────────────────── */

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  )
}

function PartiesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function ItemsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function SaleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function InventoryIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7l4-4h8l4 4M4 7h16M10 11h4" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}


function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

/* ── Sidebar Menu Data ───────────────────────────────────── */

interface NavItem {
  id: string
  label: string
  to: string
}

interface NavGroup {
  id: string
  label: string
  icon: React.ReactNode
  items: NavItem[]
  adminOnly?: boolean
}

function buildNavGroups(prefix: string): NavGroup[] {
  return [
    {
      id: 'parties',
      label: 'Parties',
      icon: <PartiesIcon />,
      items: [
        { id: 'partners', label: 'Partners', to: `${prefix}/partners` },
        { id: 'party-master', label: 'Party Master', to: `${prefix}/party-master` },
      ],
    },
    {
      id: 'items-group',
      label: 'Items',
      icon: <ItemsIcon />,
      items: [
        { id: 'items', label: 'Item Master', to: `${prefix}/items` },
      ],
    },
    {
      id: 'sale',
      label: 'Sale',
      icon: <SaleIcon />,
      items: [
        { id: 'quotations', label: 'Quotations', to: `${prefix}/quotations` },
        { id: 'orders', label: 'Orders', to: `${prefix}/orders` },
        { id: 'invoices', label: 'Invoices', to: `${prefix}/invoices` },
      ],
    },
    {
      id: 'inventory-group',
      label: 'Inventory',
      icon: <InventoryIcon />,
      items: [
        { id: 'inventory', label: 'Inventory Manager', to: `${prefix}/inventory` },
      ],
    },
    {
      id: 'users-group',
      label: 'Users',
      icon: <UsersIcon />,
      adminOnly: true,
      items: [
        { id: 'users', label: 'User Management', to: `${prefix}/users` },
      ],
    },
    {
      id: 'system-group',
      label: 'System',
      icon: <SettingsIcon />,
      adminOnly: true,
      items: [
        { id: 'settings', label: 'Settings', to: `${prefix}/settings` },
        { id: 'recycle-bin', label: 'Recycle Bin', to: `${prefix}/recycle-bin` },
      ],
    },
  ]
}

/* ── Sidebar Component ───────────────────────────────────── */

export function AdminNav({ activeTab, role, isOpen, onToggle }: AdminNavProps) {
  const { user, logout } = useIdentity()
  const navigate = useNavigate()

  const prefix = role === 'staff' ? '/staff' : '/admin'
  const navGroups = buildNavGroups(prefix)

  // Determine which groups should be open by default based on activeTab
  const findActiveGroup = (): string[] => {
    const activeGroups: string[] = []
    for (const group of navGroups) {
      if (group.items.some((item) => item.id === activeTab)) {
        activeGroups.push(group.id)
      }
    }
    return activeGroups
  }

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(findActiveGroup())
  )

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <>
      {/* ── Mobile Overlay ────────────────────────────── */}
      {isOpen && (
        <div
          className="sidebar-overlay sidebar-overlay-visible"
          onClick={onToggle}
        />
      )}

      <aside
        className={`admin-sidebar ${isOpen ? 'sidebar-open' : ''}`}
        style={{ width: SIDEBAR_WIDTH }}
        id="admin-sidebar"
      >
        {/* ── Brand Header ─────────────────────────────── */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <span className="sidebar-logo-text">PP</span>
          </div>
          <div className="sidebar-brand-info">
            <span className="sidebar-brand-name">PrintPro</span>
            <span className="sidebar-brand-role">
              {role === 'admin' ? 'Admin Portal' : 'Staff Portal'}
            </span>
          </div>
          {onToggle && (
            <button
              className="sidebar-close-btn"
              onClick={onToggle}
              type="button"
              title="Close menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

      {/* ── Scrollable Nav Area ──────────────────────── */}
      <nav className="sidebar-nav">
        {/* Home — standalone item, no group */}
        <Link
          to={prefix}
          className={`sidebar-item sidebar-item-standalone ${
            activeTab === 'dashboard' ? 'sidebar-item-active' : ''
          }`}
          id="nav-home"
        >
          <HomeIcon />
          <span>Home</span>
        </Link>

        {/* Grouped nav sections */}
        {navGroups
          .filter((g) => !(g.adminOnly && role === 'staff'))
          .map((group) => {
            const isOpen = openGroups.has(group.id)
            const hasActiveChild = group.items.some((item) => item.id === activeTab)

            return (
              <div key={group.id} className="sidebar-group">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`sidebar-group-header ${hasActiveChild ? 'sidebar-group-header-active' : ''}`}
                  id={`nav-group-${group.id}`}
                  type="button"
                >
                  <div className="sidebar-group-label">
                    {group.icon}
                    <span>{group.label}</span>
                  </div>
                  <ChevronIcon open={isOpen} />
                </button>

                <div
                  className={`sidebar-group-items ${isOpen ? 'sidebar-group-items-open' : ''}`}
                >
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      to={item.to}
                      className={`sidebar-item sidebar-sub-item ${
                        activeTab === item.id ? 'sidebar-item-active' : ''
                      }`}
                      id={`nav-${item.id}`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
      </nav>

      {/* ── User Info + Logout (pinned bottom) ───────── */}
      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">
            {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-details">
            <span className="sidebar-user-name">
              {user?.username || user?.email || 'User'}
            </span>
            <span className="sidebar-user-role">{role}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
          id="nav-logout"
          type="button"
          title="Logout"
        >
          <LogoutIcon />
        </button>
      </div>
      </aside>
    </>
  )
}
