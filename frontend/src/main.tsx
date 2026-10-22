import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/ui/ToastProvider'
import AuthProvider from './components/providers/AuthProvider'
import CartProvider from './components/providers/CartProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* a crash anywhere below shows a friendly screen instead of a blank page */}
    <ErrorBoundary>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              {/* Respect the visitor's "reduce motion" setting everywhere. */}
              <MotionConfig reducedMotion="user">
                <App />
              </MotionConfig>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
