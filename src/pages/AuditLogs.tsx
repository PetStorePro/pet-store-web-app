import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Badge, Card, ErrorText, PageHeader, Spinner, inputCls } from '../components/ui'
import type { AuditLog } from '../types'

export default function AuditLogs() {
  const [items, setItems] = useState<AuditLog[]>([])
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listAuditLogs({ action: action || undefined, page, pageSize: 50 })
      setItems(res.items)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [action, page]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Every operation is recorded with user, time and action" />

      <ErrorText message={error} />

      <input className={`${inputCls} max-w-xs mb-4`} placeholder="Filter by action (e.g. SALE_REGISTERED)…" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} />

      {loading ? <Spinner /> : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge color="sky">{l.username}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{l.action}</td>
                  <td className="px-4 py-3 text-slate-500">{l.entityType}{l.entityId ? ` #${l.entityId}` : ''}</td>
                  <td className="px-4 py-3 text-slate-500">{l.details ?? '—'}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No logs</td></tr>}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>{total} audit entries</span>
            <div className="flex items-center gap-3">
              <button className="text-sky-700 disabled:text-slate-300" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
              <span>Page {page} of {Math.max(1, Math.ceil(total / 50))}</span>
              <button className="text-sky-700 disabled:text-slate-300" disabled={page * 50 >= total} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
