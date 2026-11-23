import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, Card, ErrorText, PageHeader, Spinner, btnCls, btnSecondaryCls, inputCls } from '../components/ui'
import type { MovementType, Product, StockMovement } from '../types'

const movementColors: Record<MovementType, 'green' | 'red' | 'sky' | 'amber'> = {
  IN: 'green',
  OUT: 'red',
  SALE: 'sky',
  ADJUSTMENT: 'amber',
}

export default function Inventory() {
  const { user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [filterProduct, setFilterProduct] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [productId, setProductId] = useState('')
  const [type, setType] = useState<MovementType>('IN')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [p, m] = await Promise.all([
        api.listProducts({ pageSize: 100 }),
        api.listMovements({ productId: filterProduct || undefined, pageSize: 100 }),
      ])
      setProducts(p.items)
      setMovements(m.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterProduct]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !productId) return
    setSaving(true)
    try {
      await api.adjustStock({ productId, type, quantity, reason: reason || undefined })
      setShowForm(false)
      setReason('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Adjustment failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Stock levels and movement history">
        <button className={btnCls} onClick={() => setShowForm(true)}>+ Stock adjustment</button>
      </PageHeader>

      <ErrorText message={error} />

      <Card className="p-4 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Stock levels</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {products.map((p) => {
            const low = p.stock <= p.lowStockThreshold
            return (
              <button
                key={p.id}
                onClick={() => setFilterProduct(filterProduct === p.id ? '' : p.id)}
                className={`text-left p-3 rounded-lg border ${filterProduct === p.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-slate-50'}`}
              >
                <div className="text-xs text-slate-500 truncate">{p.name}</div>
                <div className={`text-xl font-bold ${low ? 'text-red-600' : 'text-slate-800'}`}>{p.stock}</div>
                {low && <Badge color="red">LOW</Badge>}
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Movement history</h2>
          {filterProduct && (
            <button className="text-xs text-sky-600 hover:underline" onClick={() => setFilterProduct('')}>
              Clear product filter
            </button>
          )}
        </div>
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.productName}</td>
                  <td className="px-4 py-3"><Badge color={movementColors[m.type]}>{m.type}</Badge></td>
                  <td className={`px-4 py-3 font-semibold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{m.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{m.username}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No movements</td></tr>}
            </tbody>
          </table>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Stock adjustment</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                <select required className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
                  <option value="">Select…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as MovementType)}>
                    <option value="IN">IN (add stock)</option>
                    <option value="OUT">OUT (remove stock)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT (set absolute)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input required type="number" min={type === 'ADJUSTMENT' ? 0 : 1} className={inputCls} value={quantity} onChange={(e) => setQuantity(+e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Supplier delivery" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className={btnSecondaryCls} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className={btnCls} disabled={saving}>{saving ? 'Saving…' : 'Apply'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
