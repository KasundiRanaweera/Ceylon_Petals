import { CloudOff } from 'lucide-react'
import EmptyState from './EmptyState'

// Shown when a page could not get what it needs from the shop's server (offline, or the server is
// down), so the visitor is not told an item is missing or that nothing matched. "Try again" asks again.
export default function LoadError({ what, onRetry, retrying = false }: { what: string; onRetry: () => void; retrying?: boolean }) {
  return (
    <EmptyState
      icon={CloudOff}
      title={`We couldn’t load ${what}`}
      message="Please check your connection and try again. You can still order on WhatsApp."
      action={
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md disabled:opacity-60"
        >
          {retrying ? 'Trying again…' : 'Try again'}
        </button>
      }
    />
  )
}
