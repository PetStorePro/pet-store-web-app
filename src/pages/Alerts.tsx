import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card, ErrorText, PageHeader, Spinner, btnSecondaryCls, inputCls } from '../components/ui'
import type { Alert, AlertType } from '../types'

const severityColor: Record<Alert['severity'], string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

const typeLabel: Record<AlertType, string> = {
  LOW_STOCK: 'Low stock',
  EXPIRING_MEDICINE: 'Expiring medicine',
  NEGATIVE_STOCK: 'Negative stock',
}

export default function Alerts() {
  const [items, setItems] = useState<Alert[]>([])
  const [type, setType] = useState<AlertType | ''>('')
  const [showResolved, setShowResolved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.listAlerts({
        type: type || undefined,
        resolved: showResolved ? undefined : false,
      })
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [type, showResolved]) // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = async (id: string) => {
    await api.resolveAlert(id)
    await load()
  }

  return (
    <div>
      <PageHeader title="Alerts" subtitle="Low stock and expiring medicine notifications" />

      <ErrorText message={error} />

      <div className="flex gap-3 mb-4 items-center">
        <select className={`${inputCls} max-w-[220px]`} value={type} onChange={(e) => setType(e.target.value as AlertType | '')}>
          <option value="">All types</option>
          <option value="LOW_STOCK">Low stock</option>
          <option value="EXPIRING_MEDICINE">Expiring medicine</option>
          <option value="NEGATIVE_STOCK">Negative stock</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className={`p-4 flex items-center justify-between ${a.resolved ? 'opacity-50' : ''}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColor[a.severity]}`}>{a.severity}</span>
                  <span className="text-xs font-medium text-slate-500 uppercase">{typeLabel[a.type]}</span>
                  {a.resolved && <span className="text-xs text-emerald-600 font-medium">RESOLVED</span>}
                </div>
                <div className="font-medium text-slate-800">{a.productName}</div>
                <div className="text-sm text-slate-500">{a.message}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
              {!a.resolved && (
                <button className={btnSecondaryCls} onClick={() => resolve(a.id)}>Resolve</button>
              )}
            </Card>
          ))}
          {items.length === 0 && <Card className="p-8 text-center text-slate-400">No alerts</Card>}
        </div>
      )}
    </div>
  )
}
