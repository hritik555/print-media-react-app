import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '../../lib/identity-context'
import { AdminNav } from '../../components/AdminNav'
import { apiGet, apiPost, apiPut, apiPostMultipart } from '../../lib/api'
import { getServerUser } from '../../lib/auth'

export const Route = createFileRoute('/admin/items')({
  beforeLoad: async () => {
    // const user = await getServerUser()
    // if (!user) throw redirect({ to: '/' })
    // if (!user.roles?.includes('admin')) throw redirect({ to: '/' })
    // return { user }
  },
  component: ItemMasterPage,
})

interface Item {
  id: string
  name: string
  hsnSac: string
  category: string
  salePrice: number
  purchasePrice: number
  unit: string
  type: 'product' | 'service'
  currentStock: number
  code?: string
  taxRate?: string
  minStock?: number
}

interface Category {
  id: string
  name: string
  description: string
}

interface Unit {
  id: string
  name: string
  description: string
}

interface InventoryTransaction {
  id: string
  itemId: string
  type: 'INWARDS' | 'OUTWARDS' | 'ADJUSTMENT'
  notes: string
  invoiceNo?: string
  name?: string
  quantity: number
  pricePerUnit?: number
  status?: string
  createdAt: string
}

// Seed datasets matching the references
const MOCK_ITEMS: Item[] = [
  { id: '1', name: '11GSM Paper', hsnSac: '4802', category: 'Paper', salePrice: 1.80, purchasePrice: 0.90, unit: 'Sheets', type: 'product', currentStock: 0, code: 'ITM-001' },
  { id: '2', name: 'A4 Letterhead', hsnSac: '4817', category: 'Stationery', salePrice: 5.50, purchasePrice: 3.20, unit: 'Pcs', type: 'product', currentStock: 450, code: 'ITM-002' },
  { id: '3', name: '350 GSM Business Cards', hsnSac: '4911', category: 'Cards', salePrice: 3.00, purchasePrice: 1.50, unit: 'Pcs', type: 'product', currentStock: 1000, code: 'ITM-003' },
  { id: '4', name: 'Hard Lamination A4', hsnSac: '3920', category: 'Lamination', salePrice: 12.00, purchasePrice: 7.00, unit: 'Sheets', type: 'product', currentStock: 300, code: 'ITM-004' },
  { id: '5', name: 'Metallic Sheet Print', hsnSac: '4911', category: 'Specialty', salePrice: 60.00, purchasePrice: 35.00, unit: 'Sheets', type: 'product', currentStock: 250, code: 'ITM-005' },
  { id: '6', name: 'Magazine 48pp (Full Color)', hsnSac: '4901', category: 'Publications', salePrice: 22.50, purchasePrice: 14.00, unit: 'Copies', type: 'product', currentStock: 150, code: 'ITM-006' },
  { id: '7', name: 'UV Coating', hsnSac: '9989', category: '', salePrice: 8.00, purchasePrice: 4.50, unit: 'Sheets', type: 'service', currentStock: 0, code: 'ITM-007' },
  { id: '8', name: 'Die Cutting', hsnSac: '9989', category: '', salePrice: 15.00, purchasePrice: 9.00, unit: 'Pcs', type: 'service', currentStock: 0, code: 'ITM-008' },
]

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-0', name: 'Items not in any Category', description: 'Default fallback category' },
  { id: 'cat-1', name: 'Paper', description: 'Different paper qualities and sizes' },
  { id: 'cat-2', name: 'Stationery', description: 'Office letterheads, envelopes, pads' },
  { id: 'cat-3', name: 'Cards', description: 'Business cards, invitation cards' },
  { id: 'cat-4', name: 'Lamination', description: 'Gloss, matt, soft touch' },
  { id: 'cat-5', name: 'Specialty', description: 'Specialty sheet print, texture print' },
  { id: 'cat-6', name: 'Publications', description: 'Books, brochures, magazines' },
]

const MOCK_UNITS: Unit[] = [
  { id: 'unit-1', name: 'Pcs', description: 'Pieces count' },
  { id: 'unit-2', name: 'Sheets', description: 'Printable sheets' },
  { id: 'unit-3', name: 'Copies', description: 'Full publication copies' },
  { id: 'unit-4', name: 'Boxes', description: 'Packaging boxes' },
  { id: 'unit-5', name: 'Rolls', description: 'Paper banner rolls' },
]

const INITIAL_TRANSACTIONS: InventoryTransaction[] = [
  { id: 't-1', itemId: '2', type: 'INWARDS', notes: 'Opening stock entry', invoiceNo: 'INV-001', name: 'Vendor A', quantity: 500, pricePerUnit: 3.20, status: 'Completed', createdAt: '2026-06-01T10:00:00Z' },
  { id: 't-2', itemId: '2', type: 'OUTWARDS', notes: 'Deducted for Order #1043', invoiceNo: 'INV-1043', name: 'Client B', quantity: 50, pricePerUnit: 5.50, status: 'Completed', createdAt: '2026-06-02T08:30:00Z' },
]

type ActiveTabId = 'PRODUCTS' | 'SERVICES' | 'CATEGORY' | 'UNITS'

function ItemMasterPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()

  // State Management
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS)
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES)
  const [units, setUnits] = useState<Unit[]>(MOCK_UNITS)
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(INITIAL_TRANSACTIONS)
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [rightPanelSearch, setRightPanelSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Layout View Tabs
  const [activeTab, setActiveTab] = useState<ActiveTabId>('PRODUCTS')
  const [viewMode, setViewMode] = useState<'list' | 'bulk-edit'>('list')

  // Selected item hooks for right-side detail panels
  const [selectedProductId, setSelectedProductId] = useState<string>('1')
  const [selectedServiceId, setSelectedServiceId] = useState<string>('7')
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Items not in any Category')
  const [selectedUnitName, setSelectedUnitName] = useState<string>('Pcs')

  // Modals Visibility
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Modal tab: 'Pricing' | 'Stock'
  const [modalActiveTab, setModalActiveTab] = useState<'Pricing' | 'Stock'>('Pricing')

  // Form states: Item
  const [itemName, setItemName] = useState('')
  const [itemType, setItemType] = useState<'product' | 'service'>('product')
  const [itemHsn, setItemHsn] = useState('')
  const [itemUnit, setItemUnit] = useState('Pcs')
  const [itemCategory, setItemCategory] = useState('Items not in any Category')
  const [itemCode, setItemCode] = useState('')
  const [itemSalePrice, setItemSalePrice] = useState('')
  const [itemPurchasePrice, setItemPurchasePrice] = useState('')
  const [itemTaxRate, setItemTaxRate] = useState('None')
  const [itemOpeningStock, setItemOpeningStock] = useState('0')
  const [itemMinStock, setItemMinStock] = useState('0')

  // Form states: Category
  const [catName, setCatName] = useState('')

  // Form states: Unit
  const [unitCode, setUnitCode] = useState('')
  const [unitDescription, setUnitDescription] = useState('')

  // Form states: Adjustment
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustType, setAdjustType] = useState<'INWARDS' | 'OUTWARDS' | 'ADJUSTMENT'>('INWARDS')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [adjustInvoice, setAdjustInvoice] = useState('')
  const [adjustName, setAdjustName] = useState('')

  // Bulk Edit rows state
  const [bulkRows, setBulkRows] = useState<Item[]>([])

  // Toast Trigger helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load from API or fallback
  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to: '/' }); return }

    apiGet<Item[]>('/api/admin/items')
      .then((data) => {
        setItems(data)
        setLoading(false)
      })
      .catch(() => {
        const savedItems = localStorage.getItem('printpro_items')
        if (savedItems) setItems(JSON.parse(savedItems))
        else localStorage.setItem('printpro_items', JSON.stringify(MOCK_ITEMS))

        const savedCats = localStorage.getItem('printpro_categories')
        if (savedCats) setCategories(JSON.parse(savedCats))
        else localStorage.setItem('printpro_categories', JSON.stringify(MOCK_CATEGORIES))

        const savedUnits = localStorage.getItem('printpro_units')
        if (savedUnits) setUnits(JSON.parse(savedUnits))
        else localStorage.setItem('printpro_units', JSON.stringify(MOCK_UNITS))

        const savedTx = localStorage.getItem('printpro_transactions')
        if (savedTx) setTransactions(JSON.parse(savedTx))
        else localStorage.setItem('printpro_transactions', JSON.stringify(INITIAL_TRANSACTIONS))

        setLoading(false)
      })
  }, [ready, user, navigate])

  // Sync utilities
  const syncItems = (updated: Item[]) => {
    setItems(updated)
    localStorage.setItem('printpro_items', JSON.stringify(updated))
  }
  const syncCategories = (updated: Category[]) => {
    setCategories(updated)
    localStorage.setItem('printpro_categories', JSON.stringify(updated))
  }
  const syncUnits = (updated: Unit[]) => {
    setUnits(updated)
    localStorage.setItem('printpro_units', JSON.stringify(updated))
  }
  const syncTransactions = (updated: InventoryTransaction[]) => {
    setTransactions(updated)
    localStorage.setItem('printpro_transactions', JSON.stringify(updated))
  }

  // Find Active Selections
  const activeProduct = items.find(it => it.id === selectedProductId && it.type === 'product') || items.find(it => it.type === 'product')
  const activeService = items.find(it => it.id === selectedServiceId && it.type === 'service') || items.find(it => it.type === 'service')

  // Auto assign random Item Code
  const assignCode = () => {
    setItemCode('ITM-' + Math.floor(1000 + Math.random() * 9000))
  }

  // Handle Add Item
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim()) return

    const newItem: Item = {
      id: 'item-' + Date.now(),
      name: itemName.trim(),
      hsnSac: itemHsn.trim() || 'N/A',
      category: itemCategory || 'Items not in any Category',
      salePrice: parseFloat(itemSalePrice) || 0,
      purchasePrice: parseFloat(itemPurchasePrice) || 0,
      unit: itemUnit || 'Pcs',
      type: itemType,
      currentStock: parseFloat(itemOpeningStock) || 0,
      code: itemCode.trim() || ('ITM-' + Math.floor(1000 + Math.random() * 9000)),
      taxRate: itemTaxRate,
      minStock: parseFloat(itemMinStock) || 0,
    }

    apiPost<Item>('/api/admin/items', newItem)
      .then((res) => {
        syncItems([...items, res])
        triggerToast(`Added item ${res.name} successfully!`)
      })
      .catch(() => {
        syncItems([...items, newItem])
        // Log transaction if stock > 0
        const stockQty = parseFloat(itemOpeningStock) || 0
        if (stockQty > 0 && itemType === 'product') {
          const tx: InventoryTransaction = {
            id: 't-' + Date.now(),
            itemId: newItem.id,
            type: 'INWARDS',
            notes: 'Opening stock entry',
            quantity: stockQty,
            pricePerUnit: parseFloat(itemPurchasePrice) || 0,
            status: 'Completed',
            createdAt: new Date().toISOString(),
          }
          syncTransactions([...transactions, tx])
        }
        triggerToast(`Added item ${newItem.name} (Mock) successfully!`)
      })

    setIsAddItemOpen(false)
    setItemName('')
    setItemHsn('')
    setItemCode('')
    setItemSalePrice('')
    setItemPurchasePrice('')
    setItemOpeningStock('0')
    setItemMinStock('0')
    setModalActiveTab('Pricing')
  }

  // Handle Add Category
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) return

    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: catName.trim(),
      description: 'Custom B2B Printing category',
    }

    apiPost<Category>('/api/admin/categories', newCat)
      .then((res) => {
        syncCategories([...categories, res])
        triggerToast(`Created category ${res.name}!`)
      })
      .catch(() => {
        syncCategories([...categories, newCat])
        triggerToast(`Created category ${newCat.name} (Mock)!`)
      })

    setIsAddCategoryOpen(false)
    setCatName('')
  }

  // Handle Add Unit
  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitCode.trim()) return

    const newUnit: Unit = {
      id: 'unit-' + Date.now(),
      name: unitCode.trim(),
      description: unitDescription.trim() || 'Custom unit',
    }

    apiPost<Unit>('/api/admin/units', newUnit)
      .then((res) => {
        syncUnits([...units, res])
        triggerToast(`Created unit ${res.name}!`)
      })
      .catch(() => {
        syncUnits([...units, newUnit])
        triggerToast(`Created unit ${newUnit.name} (Mock)!`)
      })

    setIsAddUnitOpen(false)
    setUnitCode('')
    setUnitDescription('')
  }

  // Handle Stock Adjustment
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetItem = activeTab === 'PRODUCTS' ? activeProduct : activeService
    if (!targetItem) return

    const qty = parseFloat(adjustQty) || 0
    if (qty <= 0) {
      alert('Adjustment quantity must be greater than 0.')
      return
    }

    const payload = {
      itemId: targetItem.id,
      type: adjustType,
      quantity: qty,
      notes: adjustNotes.trim() || 'Manual adjustment',
      invoiceNo: adjustInvoice.trim(),
      name: adjustName.trim(),
    }

    apiPost('/api/admin/items/inventory', payload)
      .then(() => {
        triggerToast(`Adjusted inventory for ${targetItem.name}!`)
      })
      .catch(() => {
        const factor = adjustType === 'OUTWARDS' ? -1 : 1
        const delta = qty * factor

        const updated = items.map((it) => {
          if (it.id === targetItem.id) {
            return { ...it, currentStock: Math.max(0, it.currentStock + delta) }
          }
          return it
        })
        syncItems(updated)

        const tx: InventoryTransaction = {
          id: 't-' + Date.now(),
          itemId: targetItem.id,
          type: adjustType,
          notes: adjustNotes.trim() || 'Manual stock adjustment',
          invoiceNo: adjustInvoice.trim() || 'N/A',
          name: adjustName.trim() || 'Manual Adjustment',
          quantity: qty,
          pricePerUnit: targetItem.purchasePrice || 0,
          status: 'Completed',
          createdAt: new Date().toISOString(),
        }
        syncTransactions([...transactions, tx])
        triggerToast(`Adjusted stock for ${targetItem.name} (Mock)!`)
      })

    setIsAdjustOpen(false)
    setAdjustQty('')
    setAdjustNotes('')
    setAdjustInvoice('')
    setAdjustName('')
  }

  // Simulate Excel Import
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiPostMultipart<any[]>('/api/admin/items/import/excel', formData)
      triggerToast(`Successfully imported items from ${file.name}!`)
      apiGet<Item[]>('/api/admin/items').then(syncItems) // refresh all
    } catch (err) {
      triggerToast(`Failed to import from ${file.name}. Please check the format.`)
    } finally {
      setIsImportOpen(false)
    }
  }

  // Start Bulk Edit Screen
  const startBulkEdit = () => {
    setBulkRows(JSON.parse(JSON.stringify(items)))
    setViewMode('bulk-edit')
  }

  const handleBulkChange = (idx: number, key: keyof Item, value: any) => {
    const updated = [...bulkRows]
    updated[idx] = { ...updated[idx], [key]: value }
    setBulkRows(updated)
  }

  const saveBulkChanges = () => {
    apiPut<Item[]>('/api/admin/items/bulk', bulkRows)
      .then((res) => {
        syncItems(res)
        setViewMode('list')
        triggerToast('Saved all bulk updates!')
      })
      .catch(() => {
        syncItems(bulkRows)
        setViewMode('list')
        triggerToast('Saved bulk updates (Mock)!')
      })
  }

  // Render Left Side list logic
  const leftSideItems = items.filter((item) => {
    const isTabMatch = item.type === (activeTab === 'PRODUCTS' ? 'product' : 'service')
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.hsnSac.includes(searchQuery)
    return isTabMatch && matchesSearch
  })

  // Render transactions lists
  const currentActiveItem = activeTab === 'PRODUCTS' ? activeProduct : activeService
  const activeTxList = currentActiveItem ? transactions.filter(tx => tx.itemId === currentActiveItem.id && (rightPanelSearch === '' || tx.notes.toLowerCase().includes(rightPanelSearch.toLowerCase()) || tx.invoiceNo?.includes(rightPanelSearch))) : []

  // Category view counts
  const getCategoryItemCount = (catName: string) => {
    if (catName === 'Items not in any Category') {
      return items.filter(it => !it.category || it.category === 'Items not in any Category' || it.category === '').length
    }
    return items.filter(it => it.category === catName).length
  }

  // Items under selected category
  const getCategoryItems = (catName: string) => {
    const filteredItems = items.filter((it) => {
      if (catName === 'Items not in any Category') {
        return !it.category || it.category === 'Items not in any Category' || it.category === ''
      }
      return it.category === catName
    })
    return filteredItems.filter(it => it.name.toLowerCase().includes(rightPanelSearch.toLowerCase()))
  }

  // Items under selected unit
  const getUnitItems = (uName: string) => {
    return items.filter(it => it.unit === uName && it.name.toLowerCase().includes(rightPanelSearch.toLowerCase()))
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans">
      <AdminNav activeTab="items" role="admin" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="sidebar-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Page Heading & Hamburger */}
          <div className="flex items-center gap-3 mb-6">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" title="Open menu">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-2xl font-extrabold text-gray-900">Item Master</h1>
          </div>

          {/* Top Main Tab Navigation */}
          {viewMode === 'list' && (
            <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-200 mb-6 bg-white rounded-t-xl px-4 shadow-sm scrollbar-none items-center">
              {(['PRODUCTS', 'SERVICES', 'CATEGORY', 'UNITS'] as ActiveTabId[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setRightPanelSearch(''); }}
                  className={`py-4 px-6 text-sm font-bold tracking-wider transition-all border-b-4 flex-shrink-0 ${
                    activeTab === tab
                      ? 'border-purple-700 text-purple-700 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="flex-1" />
              {/* Main controls */}
              <div className="flex items-center gap-3 py-2 flex-shrink-0">
                <button
                  id="main-btn-import"
                  onClick={() => setIsImportOpen(true)}
                  className="px-3.5 py-1.5 border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  📥 Import
                </button>
                <button
                  id="main-btn-bulk"
                  onClick={startBulkEdit}
                  className="px-3.5 py-1.5 border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  ✏️ Bulk Edit
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: SPLIT DESKTOP PANEL PANES */}
          {viewMode === 'list' && (
            <div className="flex flex-col md:flex-row bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-sm md:h-[calc(100vh-250px)] min-h-[500px]">
              
              {/* LEFT SPLIT COLUMN */}
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col h-[280px] md:h-full bg-[#f8fafc] flex-shrink-0">
                
                {/* Search & Add Action header */}
                <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-white">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">🔍</span>
                    <input
                      id="split-left-search"
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-slate-50"
                    />
                  </div>
                  
                  {/* Category / Item Add Trigger Buttons */}
                  {activeTab === 'CATEGORY' ? (
                    <button
                      id="split-add-category-btn"
                      onClick={() => setIsAddCategoryOpen(true)}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1"
                    >
                      ➕ Add Category
                    </button>
                  ) : activeTab === 'UNITS' ? (
                    <button
                      id="split-add-unit-btn"
                      onClick={() => setIsAddUnitOpen(true)}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1"
                    >
                      ➕ Add Unit
                    </button>
                  ) : (
                    <button
                      id="split-add-item-btn"
                      onClick={() => { setItemType(activeTab === 'PRODUCTS' ? 'product' : 'service'); setIsAddItemOpen(true); }}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1"
                    >
                      ➕ Add Item
                    </button>
                  )}
                </div>

                {/* Sub headers columns */}
                <div className="grid grid-cols-2 px-4 py-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 tracking-wider">
                  <div>{activeTab === 'CATEGORY' ? 'CATEGORY' : activeTab === 'UNITS' ? 'UNIT' : 'ITEM'}</div>
                  <div className="text-right">{activeTab === 'CATEGORY' ? 'ITEM' : activeTab === 'UNITS' ? 'ITEMS' : 'QUANTITY'}</div>
                </div>

                {/* Scrollable list items */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  
                  {/* PRODUCTS / SERVICES Tab */}
                  {(activeTab === 'PRODUCTS' || activeTab === 'SERVICES') && leftSideItems.map((item) => {
                    const isSelected = activeTab === 'PRODUCTS' ? (selectedProductId === item.id) : (selectedServiceId === item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => activeTab === 'PRODUCTS' ? setSelectedProductId(item.id) : setSelectedServiceId(item.id)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between text-xs transition-all ${
                          isSelected ? 'bg-purple-50 text-purple-900 font-bold border-l-4 border-purple-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{item.name}</span>
                        <span className={`font-mono ${item.currentStock > 0 ? 'text-slate-900' : 'text-red-500'}`}>
                          {item.type === 'service' ? '-' : item.currentStock}
                        </span>
                      </button>
                    )
                  })}

                  {/* CATEGORIES Tab */}
                  {activeTab === 'CATEGORY' && categories.map((cat) => {
                    const isSelected = selectedCategoryName === cat.name
                    const itemCount = getCategoryItemCount(cat.name)
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryName(cat.name)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between text-xs transition-all ${
                          isSelected ? 'bg-purple-50 text-purple-900 font-bold border-l-4 border-purple-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        <span className="font-mono text-slate-500">{itemCount}</span>
                      </button>
                    )
                  })}

                  {/* UNITS Tab */}
                  {activeTab === 'UNITS' && units.map((u) => {
                    const isSelected = selectedUnitName === u.name
                    const itemCount = getUnitItems(u.name).length
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUnitName(u.name)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between text-xs transition-all ${
                          isSelected ? 'bg-purple-50 text-purple-900 font-bold border-l-4 border-purple-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{u.name}</span>
                        <span className="font-mono text-slate-500">{itemCount}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* RIGHT SPLIT COLUMN */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                
                {/* 1. DETAILED VIEW FOR PRODUCTS / SERVICES */}
                {(activeTab === 'PRODUCTS' || activeTab === 'SERVICES') && (
                  currentActiveItem ? (
                    <div className="flex-1 flex flex-col h-full">
                      {/* Top Header info */}
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                            <span>{currentActiveItem.name.toUpperCase()}</span>
                            <span className="text-slate-400 cursor-pointer text-xs">➡️</span>
                          </h2>
                          <div className="flex items-center gap-6 mt-2 text-xs text-slate-600">
                            <div>SALE PRICE: <span className="font-bold text-slate-900">₹ {currentActiveItem.salePrice.toFixed(2)}</span> (excl)</div>
                            <div>PURCHASE PRICE: <span className="font-bold text-slate-900">₹ {currentActiveItem.purchasePrice.toFixed(2)}</span> (excl)</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                          <div className="text-xs">
                            {currentActiveItem.type === 'product' && (
                              <>
                                <div className={`flex items-center gap-1.5 font-bold ${currentActiveItem.currentStock > 0 ? 'text-slate-700' : 'text-red-500'}`}>
                                  {currentActiveItem.currentStock === 0 && <span className="text-red-500">⚠</span>}
                                  <span>STOCK QUANTITY: {currentActiveItem.currentStock}</span>
                                </div>
                                <div className="text-slate-400 mt-0.5">STOCK VALUE: <span className="font-bold text-green-700">₹ {(currentActiveItem.currentStock * currentActiveItem.purchasePrice).toFixed(2)}</span></div>
                              </>
                            )}
                          </div>

                          {currentActiveItem.type === 'product' && (
                            <button
                              id="btn-adjust-item"
                              onClick={() => setIsAdjustOpen(true)}
                              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1"
                            >
                              ⚙️ ADJUST ITEM
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Ledger History List */}
                      <div className="flex-1 flex flex-col p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transactions</span>
                          
                          <div className="flex items-center gap-2">
                            <input
                              id="tx-search-input"
                              type="text"
                              placeholder="Search..."
                              value={rightPanelSearch}
                              onChange={(e) => setRightPanelSearch(e.target.value)}
                              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-slate-50 w-44"
                            />
                            <button className="p-1 border border-slate-200 rounded hover:bg-slate-50" title="Export Ledger">📈</button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-4 py-2.5">Type</th>
                                <th className="px-4 py-2.5">Invoice/R...</th>
                                <th className="px-4 py-2.5">Name</th>
                                <th className="px-4 py-2.5">Date</th>
                                <th className="px-4 py-2.5">Quantity</th>
                                <th className="px-4 py-2.5">Price/ Unit</th>
                                <th className="px-4 py-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeTxList.map((tx) => (
                                <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      tx.type === 'INWARDS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>{tx.type}</span>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-500">{tx.invoiceNo || '-'}</td>
                                  <td className="px-4 py-3 font-medium text-slate-700">{tx.name || '-'}</td>
                                  <td className="px-4 py-3 text-slate-400">
                                    {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="px-4 py-3 font-bold">{tx.quantity}</td>
                                  <td className="px-4 py-3 text-slate-500">₹ {tx.pricePerUnit?.toFixed(2) || '0.00'}</td>
                                  <td className="px-4 py-3 text-slate-400">{tx.status || 'Completed'}</td>
                                </tr>
                              ))}
                              {activeTxList.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="text-center py-16 text-slate-400 text-sm">No transactions to show</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select an item to view transaction history</div>
                  )
                )}

                {/* 2. DETAILED VIEW FOR CATEGORIES */}
                {activeTab === 'CATEGORY' && (
                  <div className="flex-1 flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">{selectedCategoryName.toUpperCase()}</h2>
                        <div className="text-xs text-slate-400 mt-1">Total Items: {getCategoryItems(selectedCategoryName).length}</div>
                      </div>
                      
                      <button className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-md transition-all">
                        Move To This Category
                      </button>
                    </div>

                    {/* Member Items */}
                    <div className="flex-1 flex flex-col p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Items</span>
                        <input
                          id="category-member-search"
                          type="text"
                          placeholder="Search items..."
                          value={rightPanelSearch}
                          onChange={(e) => setRightPanelSearch(e.target.value)}
                          className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-slate-50 w-44"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="px-4 py-2.5">Name</th>
                              <th className="px-4 py-2.5">Quantity</th>
                              <th className="px-4 py-2.5">Stock Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getCategoryItems(selectedCategoryName).map((item) => (
                              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-bold text-slate-700">{item.name}</td>
                                  <td className="px-4 py-3 font-mono">{item.type === 'service' ? '-' : item.currentStock}</td>
                                  <td className="px-4 py-3 font-bold text-green-700">₹ {(item.currentStock * item.purchasePrice).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. DETAILED VIEW FOR UNITS */}
                {activeTab === 'UNITS' && (
                  <div className="flex-1 flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100">
                      <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">UNIT: {selectedUnitName}</h2>
                      <div className="text-xs text-slate-400 mt-1">Total items using this unit: {getUnitItems(selectedUnitName).length}</div>
                    </div>

                    {/* Member Items */}
                    <div className="flex-1 flex flex-col p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Items using {selectedUnitName}</span>
                        <input
                          id="unit-member-search"
                          type="text"
                          placeholder="Search items..."
                          value={rightPanelSearch}
                          onChange={(e) => setRightPanelSearch(e.target.value)}
                          className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-slate-50 w-44"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="px-4 py-2.5">Name</th>
                              <th className="px-4 py-2.5">Category</th>
                              <th className="px-4 py-2.5">Sale Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getUnitItems(selectedUnitName).map((item) => (
                              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-bold text-slate-700">{item.name}</td>
                                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                                  <td className="px-4 py-3 font-bold text-green-700">₹ {item.salePrice.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* VIEW MODE 2: BULK UPDATE EDITABLE GRID */}
          {viewMode === 'bulk-edit' && (
            <div className="space-y-6">
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Bulk Update Items</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Edit multiple products and services in a spreadsheet layout. All fields are editable.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    id="bulk-cancel-btn"
                    onClick={() => setViewMode('list')}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="bulk-save-btn"
                    onClick={saveBulkChanges}
                    className="px-5 py-2 bg-purple-700 text-white font-bold text-sm rounded-lg hover:bg-purple-800 transition-all shadow-md"
                  >
                    Save All Changes
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {['ITEM NAME *', 'HSN/SAC', 'CATEGORY', 'UNIT', 'SALE PRICE (₹) *', 'PURCHASE PRICE (₹)', 'TYPE'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-2">
                          <input
                            id={`bulk-name-${idx}`}
                            type="text"
                            value={item.name}
                            onChange={(e) => handleBulkChange(idx, 'name', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            id={`bulk-hsn-${idx}`}
                            type="text"
                            value={item.hsnSac}
                            onChange={(e) => handleBulkChange(idx, 'hsnSac', e.target.value)}
                            className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            id={`bulk-cat-${idx}`}
                            value={item.category}
                            onChange={(e) => handleBulkChange(idx, 'category', e.target.value)}
                            className="w-40 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            id={`bulk-unit-${idx}`}
                            value={item.unit}
                            onChange={(e) => handleBulkChange(idx, 'unit', e.target.value)}
                            className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                          >
                            {units.map((u) => (
                              <option key={u.id} value={u.name}>{u.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            id={`bulk-sale-${idx}`}
                            type="number"
                            step="0.01"
                            value={item.salePrice}
                            onChange={(e) => handleBulkChange(idx, 'salePrice', parseFloat(e.target.value) || 0)}
                            className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-green-700 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            id={`bulk-purchase-${idx}`}
                            type="number"
                            step="0.01"
                            value={item.purchasePrice}
                            onChange={(e) => handleBulkChange(idx, 'purchasePrice', parseFloat(e.target.value) || 0)}
                            className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            id={`bulk-type-${idx}`}
                            value={item.type}
                            onChange={(e) => handleBulkChange(idx, 'type', e.target.value)}
                            className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                          >
                            <option value="product">PRODUCT</option>
                            <option value="service">SERVICE</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── MODAL: ADD ITEM (HIGH-FIDELITY SCREENSHOT 5) ──────── */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <span className="text-base font-extrabold text-slate-800">Add Item</span>
                <div className="flex items-center gap-2 bg-slate-200/60 p-0.5 rounded-lg text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setItemType('product')}
                    className={`px-3 py-1 rounded-md transition-all ${itemType === 'product' ? 'bg-purple-700 text-white' : 'hover:bg-slate-200 text-slate-600'}`}
                  >
                    Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType('service')}
                    className={`px-3 py-1 rounded-md transition-all ${itemType === 'service' ? 'bg-purple-700 text-white' : 'hover:bg-slate-200 text-slate-600'}`}
                  >
                    Service
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button type="button" className="text-slate-400 hover:text-slate-600 text-lg">⚙️</button>
                <button id="close-add-item-modal" onClick={() => setIsAddItemOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
              </div>
            </div>

            <form onSubmit={handleAddItemSubmit} className="p-6 space-y-6">
              {/* Top Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-end">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide" htmlFor="form-item-name">Item Name *</label>
                  <input
                    id="form-item-name"
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full border border-purple-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white font-medium"
                    placeholder="Enter Item Name"
                  />
                </div>

                {/* HSN */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide" htmlFor="form-item-hsn">Item HSN</label>
                  <div className="relative">
                    <input
                      id="form-item-hsn"
                      type="text"
                      value={itemHsn}
                      onChange={(e) => setItemHsn(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                      placeholder="Search HSN"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs cursor-pointer">🔍</span>
                  </div>
                </div>

                {/* Select Unit Button */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide" htmlFor="form-item-unit">Unit</label>
                  <select
                    id="form-item-unit"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-slate-700 font-bold"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide" htmlFor="form-item-category">Category</label>
                  <select
                    id="form-item-category"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-slate-700"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Item Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide" htmlFor="form-item-code">Item Code</label>
                  <div className="relative">
                    <input
                      id="form-item-code"
                      type="text"
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-3 pr-20 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                      placeholder="Code"
                    />
                    <button
                      type="button"
                      onClick={assignCode}
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-purple-50 text-purple-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-purple-100 transition-colors"
                    >
                      Assign Code
                    </button>
                  </div>
                </div>

                {/* Image Placeholder Link */}
                <div className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-lg bg-purple-50 text-xs text-purple-700 cursor-pointer hover:bg-purple-100/80 transition-all w-full h-[38px] justify-center">
                  <span>📷</span>
                  <span className="font-bold">Add Item Image</span>
                </div>
              </div>

              {/* Sub tabs: Pricing & Stock */}
              <div className="border-b border-slate-200 flex gap-6">
                <button
                  type="button"
                  onClick={() => setModalActiveTab('Pricing')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                    modalActiveTab === 'Pricing' ? 'border-purple-700 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Pricing
                </button>
                {itemType === 'product' && (
                  <button
                    type="button"
                    onClick={() => setModalActiveTab('Stock')}
                    className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      modalActiveTab === 'Stock' ? 'border-purple-700 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Stock
                  </button>
                )}
              </div>

              {/* TAB CONTENT: PRICING */}
              {modalActiveTab === 'Pricing' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fadeIn">
                  
                  {/* Sale Price Card */}
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sale Price</span>
                    <div className="flex gap-2">
                      <input
                        id="form-sale-price"
                        type="number"
                        step="0.01"
                        required
                        value={itemSalePrice}
                        onChange={(e) => setItemSalePrice(e.target.value)}
                        placeholder="Sale Price"
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                      />
                      <select className="border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white">
                        <option>Without Tax</option>
                        <option>With Tax</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Discount on Sale Price"
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
                      />
                      <select className="border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white">
                        <option>Percentage</option>
                        <option>Flat Amount</option>
                      </select>
                    </div>

                    <button type="button" className="text-xs text-purple-700 font-bold hover:underline">+ Add Wholesale Price</button>
                  </div>

                  {/* Purchase Price Card */}
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchase Price</span>
                    <div className="flex gap-2">
                      <input
                        id="form-purchase-price"
                        type="number"
                        step="0.01"
                        value={itemPurchasePrice}
                        onChange={(e) => setItemPurchasePrice(e.target.value)}
                        placeholder="Purchase Price"
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                      />
                      <select className="border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white">
                        <option>Without Tax</option>
                        <option>With Tax</option>
                      </select>
                    </div>
                  </div>

                  {/* Taxes Card */}
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxes</span>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1" htmlFor="form-tax-select">Tax Rate</label>
                      <select
                        id="form-tax-select"
                        value={itemTaxRate}
                        onChange={(e) => setItemTaxRate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
                      >
                        <option value="None">None</option>
                        <option value="GST @ 5%">GST @ 5%</option>
                        <option value="GST @ 12%">GST @ 12%</option>
                        <option value="GST @ 18%">GST @ 18%</option>
                        <option value="GST @ 28%">GST @ 28%</option>
                      </select>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB CONTENT: STOCK */}
              {modalActiveTab === 'Stock' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide" htmlFor="form-stock-opening">Opening Stock</label>
                    <input
                      id="form-stock-opening"
                      type="number"
                      value={itemOpeningStock}
                      onChange={(e) => setItemOpeningStock(e.target.value)}
                      placeholder="0"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide" htmlFor="form-stock-min">Minimum Stock to Maintain</label>
                    <input
                      id="form-stock-min"
                      type="number"
                      value={itemMinStock}
                      onChange={(e) => setItemMinStock(e.target.value)}
                      placeholder="0"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 bg-slate-50 px-6 py-3 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => { resetItemForm(); triggerToast('Reset form!'); }}
                  className="px-4 py-2 border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-lg transition-all shadow-sm"
                >
                  Save &amp; New
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-md transition-all"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CATEGORY (SCREENSHOT 1) ───────────────── */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-800">Add Category</h3>
              <button id="close-add-cat-modal" onClick={() => setIsAddCategoryOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            
            <form onSubmit={handleAddCategorySubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="form-cat-name">Enter Category Name</label>
                <input
                  id="form-cat-name"
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full border border-purple-400 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                  placeholder="Paper"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold rounded-full shadow-lg transition-all"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD UNIT ──────────────────────────────────── */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-800">Add Unit</h3>
              <button id="close-add-unit-modal" onClick={() => setIsAddUnitOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            
            <form onSubmit={handleAddUnitSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="form-unit-name">Enter Unit Code</label>
                <input
                  id="form-unit-name"
                  type="text"
                  required
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="w-full border border-purple-400 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                  placeholder="e.g. Rolls"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="form-unit-desc">Description</label>
                <input
                  id="form-unit-desc"
                  type="text"
                  value={unitDescription}
                  onChange={(e) => setUnitDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                  placeholder="e.g. Paper rolls"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold rounded-full shadow-lg transition-all"
              >
                Create Unit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EXCEL IMPORT ──────────────────────────────── */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-sm font-bold text-slate-800">Import Catalog Items</span>
              <button id="close-import-modal" onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Select an Excel spreadsheet (`.xlsx` or `.csv`) containing product names, HSN codes, categories, units, and pricing.
              </p>
              
              <div className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/10 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 transition-all relative">
                <input
                  id="import-excel-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleExcelImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-3xl">📁</span>
                <span className="text-xs font-bold text-purple-800">Upload excel sheet from system</span>
                <span className="text-[10px] text-slate-400">CSV, XLSX up to 10MB</span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: STOCK ADJUSTMENT ───────────────────────────── */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Adjust Stock Quantity</span>
              <button id="close-adjust-modal" onClick={() => setIsAdjustOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              {currentActiveItem && (
                <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400">Item Name</span>
                    <div className="font-bold text-slate-800">{currentActiveItem.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Current Stock</span>
                    <div className="font-bold text-purple-700 text-right">{currentActiveItem.currentStock} {currentActiveItem.unit}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="adjust-type-select">Adjustment Type</label>
                <select
                  id="adjust-type-select"
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as 'INWARDS' | 'OUTWARDS' | 'ADJUSTMENT')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                >
                  <option value="INWARDS">Stock Inward (+) (Add Inventory)</option>
                  <option value="OUTWARDS">Stock Outward (-) (Reduce Inventory)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="adjust-qty">Quantity *</label>
                <input
                  id="adjust-qty"
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                  placeholder="Enter Quantity"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="adjust-invoice">Invoice / Ref No</label>
                <input
                  id="adjust-invoice"
                  type="text"
                  value={adjustInvoice}
                  onChange={(e) => setAdjustInvoice(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                  placeholder="e.g. INV-202"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="adjust-name">Dealer/Party Name</label>
                <input
                  id="adjust-name"
                  type="text"
                  value={adjustName}
                  onChange={(e) => setAdjustName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                  placeholder="e.g. Vendor A"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="adjust-notes">Remarks / Notes</label>
                <textarea
                  id="adjust-notes"
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white resize-none"
                  placeholder="Remarks"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 text-white font-bold text-xs rounded-lg hover:bg-purple-800"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-slate-800/80 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  )
}

const resetItemForm = () => {}
