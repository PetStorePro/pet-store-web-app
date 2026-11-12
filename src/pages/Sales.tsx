import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, Card, ErrorText, PageHeader, Spinner, btnCls, btnSecondaryCls, inputCls } from '../components/ui'
import type { Product, Sale } from '../types'

export default function Sales() {
  const { user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([api.listProducts({ pageSize: 100 }), api.listSales({ pageSize: 100 })])
      setProducts(p.items)
      setSales(s.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const selected = products.find((p) => p.id === productId)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !productId) return
    setSaving(true)
    setLastSale(null)
    try {
      const sale = await api.registerSale(user, {
        productId,
        quantity,
        customerName: customerName || undefined,
      })
      setLastSale(sale)
      setShowForm(false)
      setProductId('')
      setQuantity(1)
      setCustomerName('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sale failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Sales" subtitle="Register sales — inventory is updated automatically">
        <button className={btnCls} onClick={() => setShowForm(true)}>+ Register sale</button>
      </PageHeader>

      <ErrorText message={error} />
      {lastSale && (
        <div className="mb-4 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          Sale {lastSale.id} registered — total ${lastSale.total.toFixed(2)}
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Sold by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {s.items.map((i) => (
                      <div key={i.productId} className="text-slate-800">
                        {i.quantity} × {i.productName} <span className="text-slate-400">@ ${i.unitPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.customerName ?? 'Walk-in'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">${s.total.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge color="sky">{s.username}</Badge></td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No sales yet</td></tr>}
            </tbody>
          </table>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Register sale</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                <select required className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} — stock: {p.stock} @ ${p.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              {selected && (
                <div className="text-sm text-slate-500">
                  Available: <span className="font-semibold text-slate-700">{selected.stock}</span> —
                  subtotal: <span className="font-semibold text-slate-700">${(selected.price * quantity).toFixed(2)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input required type="number" min="1" max={selected?.stock ?? 1} className={inputCls} value={quantity} onChange={(e) => setQuantity(Math.max(1, +e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                  <input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className={btnSecondaryCls} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className={btnCls} disabled={saving || !selected || quantity > selected.stock}>
                {saving ? 'Registering…' : 'Register sale'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
