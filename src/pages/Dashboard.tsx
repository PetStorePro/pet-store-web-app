import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Badge, Card, ErrorText, PageHeader, Spinner } from '../components/ui'
import type { DashboardSummary } from '../types'

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.dashboardSummary()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorText message={error} />
  if (!data) return null

  const stats = [
    { label: 'Products', value: data.totalProducts },
    { label: 'Stock value', value: `$${data.totalStockValue.toFixed(2)}` },
    { label: 'Sales today', value: data.salesToday },
    { label: 'Low stock items', value: data.lowStockCount, warn: data.lowStockCount > 0 },
    { label: 'Expiring medicines', value: data.expiringCount, warn: data.expiringCount > 0 },
    { label: 'Open alerts', value: data.openAlerts, warn: data.openAlerts > 0 },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Store overview and key metrics" />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.warn ? 'text-red-600' : 'text-slate-800'}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-700 text-sm">Recent sales</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {data.recentSales.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-800">{s.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}</td>
                  <td className="px-4 py-2 font-semibold text-slate-800">${s.total.toFixed(2)}</td>
                </tr>
              ))}
              {data.recentSales.length === 0 && <tr><td className="px-4 py-6 text-center text-slate-400">No sales</td></tr>}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-700 text-sm">Top products by units sold</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {data.topProducts.map((p, i) => (
                <tr key={p.productId}>
                  <td className="px-4 py-2"><Badge color="sky">#{i + 1}</Badge></td>
                  <td className="px-4 py-2 text-slate-800">{p.productName}</td>
                  <td className="px-4 py-2 font-semibold text-slate-800">{p.unitsSold} units</td>
                </tr>
              ))}
              {data.topProducts.length === 0 && <tr><td className="px-4 py-6 text-center text-slate-400">No sales yet</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
