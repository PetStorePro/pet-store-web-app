import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}>{children}</div>
}

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: 'slate' | 'green' | 'red' | 'amber' | 'sky' | 'purple' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>
}

export function Spinner() {
  return <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null
  return <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{message}</div>
}

export const inputCls =
  'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'

export const btnCls =
  'px-4 py-2 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50'

export const btnSecondaryCls =
  'px-4 py-2 rounded-md text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300'
