import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react'
import { ToastContext, type ToastType } from '../../context/toastContext'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-primary text-on-primary ring-1 ring-[#d4af37]/50',
  error: 'bg-error text-on-error',
  info: 'bg-inverse-surface text-inverse-on-surface',
}

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 inset-x-4 z-[80] flex flex-col items-center gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.3 }}
              className={`pointer-events-auto w-full max-w-md flex items-center gap-3 pl-5 pr-2 py-3 rounded-xl shadow-[0_18px_40px_-20px_rgba(48,48,48,0.55)] text-body-sm ${STYLES[t.type]}`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="w-9 h-9 rounded-lg flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-current"
              >
                <X size={16} />
              </button>
            </motion.div>
          )
        })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}