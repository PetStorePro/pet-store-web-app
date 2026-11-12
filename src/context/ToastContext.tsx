import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastState {
  toast: (message: string, type?: ToastType) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastState | null>(null)

const DEFAULT_DURATION = 4000

const typeStyles: Record<ToastType, string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-sky-600',
  warning: 'bg-amber-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++nextId.current
      setToasts((prev) => [...prev, { id, type, message }])
      timers.current.set(id, setTimeout(() => dismiss(id), DEFAULT_DURATION))
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((timer) => clearTimeout(timer))
      map.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center justify-between gap-4 px-4 py-3 rounded-md text-white text-sm shadow-lg ${typeStyles[t.type]}`}
          >
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-white/70 hover:text-white leading-none text-lg">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
