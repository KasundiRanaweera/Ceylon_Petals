import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'motion/react'
import Header from './Header'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'

// Wraps every customer-facing page with the same Header, Footer and WhatsApp button.
export default function Layout() {
  const { pathname } = useLocation()
  // Skip the page fade on the very first landing, so the first screen shows instantly.
  const [firstPage] = useState(pathname)
  // A thin gold bar along the top that fills as the visitor scrolls down the page.
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })

  // Start each new page at the top (React Router keeps the old scroll position otherwise).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[90] bg-primary text-on-primary px-4 py-2 rounded-lg">
        Skip to content
      </a>
      <motion.div aria-hidden="true" className="bg-brand-gradient fixed inset-x-0 top-0 z-[60] h-[3px] origin-left" style={{ scaleX: progress }} />
      <Header />
      <main id="main" className="w-full flex-1">
        {/* Each page eases in when the visitor moves between pages. */}
        <motion.div key={pathname} initial={pathname === firstPage ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <Outlet />
        </motion.div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
