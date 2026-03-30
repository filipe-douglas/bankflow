import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '../../utils'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (m) => addToast('success', m),
    error: (m) => addToast('error', m),
    warning: (m) => addToast('warning', m),
  }

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />,
    error:   <XCircle size={18} className="text-red-400 shrink-0" />,
    warning: <AlertCircle size={18} className="text-gold-400 shrink-0" />,
  }

  const styles = {
    success: 'border-emerald-500/30 bg-emerald-500/10',
    error:   'border-red-500/30 bg-red-500/10',
    warning: 'border-gold-500/30 bg-gold-500/10',
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'glass flex items-center gap-3 px-4 py-3 rounded-xl border animate-fade-up',
              styles[t.type]
            )}
          >
            {icons[t.type]}
            <p className="text-sm text-ink-100 flex-1">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-ink-400 hover:text-ink-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
