import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

// Small accessible confirmation modal. Escape or clicking outside cancels.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Keep as is',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_24px_60px_-24px_rgba(48,48,48,0.45)] p-6 sm:p-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-display text-on-surface text-headline-sm">{title}</h2>
        <p className="text-body-md text-on-surface-variant">{message}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-label-md min-h-11 rounded-lg border border-[#d4af37] text-tertiary hover:bg-[#d4af37] hover:text-on-tertiary-container transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 min-h-11 rounded-lg text-label-md transition-colors ${
              tone === 'danger' ? 'bg-error text-on-error hover:opacity-90' : 'btn-gradient'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}