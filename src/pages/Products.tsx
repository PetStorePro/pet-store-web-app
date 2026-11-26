import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, Card, ErrorText, PageHeader, Spinner, btnCls, btnSecondaryCls, inputCls } from '../components/ui'
import type { CreateProductRequest, Product, ProductCategory } from '../types'

const categories: ProductCategory[] = ['FOOD', 'MEDICINE', 'TOY', 'ACCESSORY', 'CARE']
const emptyForm: CreateProductRequest = {
  name: '', description: '', category: 'FOOD', price: 0,
  expiryDate: '', lowStockThreshold: 5,
}

export default function Products() {
  const { user } = useAuth()
  const canManage = user?.role === 'MANAGER' || user?.role === 'DEVOPS'

  const [items, setItems] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [form, setForm] = useState<CreateProductRequest>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [catalogRevision, setCatalogRevision] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    api.listProducts({
      search: search || undefined,
      category: category || undefined,
      lowStockOnly,
      pageSize: 100,
    }).then((res) => {
      if (active) setItems(res.items)
    }).catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : 'Failed to load products')
    }).finally(() => {
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [search, category, lowStockOnly, catalogRevision])

  const openNew = () => { setForm(emptyForm); setEditing('new') }
  const openEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description, category: p.category, price: p.price, expiryDate: p.expiryDate ?? '', lowStockThreshold: p.lowStockThreshold })
    setEditing(p)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !editing) return
    setSaving(true)
    setError(null)
    try {
      if (editing === 'new') {
        await api.createProduct({ ...form, expiryDate: form.expiryDate || undefined })
      } else {
        await api.updateProduct(editing.id, { ...form, expiryDate: form.expiryDate || null })
      }
      setEditing(null)
      setCatalogRevision((revision) => revision + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: Product) => {
    if (!user || !confirm(`Delete "${p.name}"?`)) return
    setError(null)
    try {
      await api.deleteProduct(p.id)
      setCatalogRevision((revision) => revision + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage the product catalog">
        {canManage && <button className={btnCls} onClick={openNew}>+ New product</button>}
      </PageHeader>

      <ErrorText message={error} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input className={`${inputCls} max-w-xs`} placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={`${inputCls} max-w-[180px]`} value={category} onChange={(e) => setCategory(e.target.value as ProductCategory | '')}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      {loading ? <Spinner /> : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => {
                const low = p.stock <= p.lowStockThreshold
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.description}</div>
                    </td>
                    <td className="px-4 py-3"><Badge color="sky">{p.category}</Badge></td>
                    <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={low ? 'text-red-600 font-semibold' : ''}>{p.stock}</span>
                      {low && <span className="ml-2"><Badge color="red">LOW</Badge></span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.expiryDate ?? '—'}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <button className="text-sky-600 hover:underline text-xs" onClick={() => openEdit(p)}>Edit</button>
                        <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(p)}>Delete</button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No products found</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4">{editing === 'new' ? 'New product' : `Edit ${editing.name}`}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                  <input required type="number" min="0" step="0.01" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry date</label>
                  <input type="date" className={inputCls} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Low stock threshold</label>
                  <input required type="number" min="0" className={inputCls} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: +e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className={btnSecondaryCls} onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className={btnCls} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
