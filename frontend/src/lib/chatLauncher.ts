import { useSyncExternalStore } from 'react'

// Whether the chat window is open. It is shared so that the round chat button (floating on the
// home page) and the chat button in the phone nav bar can both open the same window.

let open = false
const listeners = new Set<() => void>()

function set(next: boolean) {
  if (open === next) return
  open = next
  listeners.forEach((l) => l())
}

export const openChat = () => set(true)
export const closeChat = () => set(false)

export function useChatOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => open,
    () => false,
  )
}
