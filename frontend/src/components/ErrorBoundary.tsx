import { Component, type ErrorInfo, type ReactNode } from 'react'

// The last safety net: if a page crashes while drawing, show a friendly screen with a way back
// instead of a blank white page. The most common cause after a new version goes live is a page
// whose code file was replaced; reloading fetches the new one, so that is the main button.

interface State {
  error: Error | null
}

const isStaleCode = (error: Error) => /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(error.message)

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[site] a page crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const stale = isStaleCode(error)
    return (
      <main role="alert" className="min-h-svh bg-surface text-on-surface flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center space-y-4">
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Ceylon Petals</p>
          <h1 className="font-display text-[clamp(1.8rem,5vw,2.5rem)] leading-tight">
            {stale ? 'The website has just been updated' : 'Something went wrong on this page'}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {stale
              ? 'Please reload to get the latest version. Your cart is kept.'
              : 'Sorry about that. Reloading usually fixes it. Your cart is kept. If it keeps happening, message us on WhatsApp and we will help you order.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button type="button" onClick={() => window.location.reload()} className="btn-gradient rounded-lg px-6 py-3 text-title-md">
              Reload the page
            </button>
            <a href="/" className="rounded-lg bg-surface-container-high px-6 py-3 text-title-md text-on-surface hover:bg-surface-container-highest">
              Go to the home page
            </a>
          </div>
        </div>
      </main>
    )
  }
}
