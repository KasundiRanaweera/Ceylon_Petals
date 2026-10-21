import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { applyTheme, deviceTheme, saveTheme, storedTheme, type Theme } from '../../lib/theme'

// The sun / moon button in the header. It switches between the light and dark theme and remembers
// the choice. Until the visitor chooses, the site follows their device, and changes with it.
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))

  // Follow the device's setting while the visitor has not picked a theme themselves.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const follow = () => {
      if (storedTheme()) return
      const next = deviceTheme()
      applyTheme(next)
      setTheme(next)
    }
    media.addEventListener('change', follow)
    return () => media.removeEventListener('change', follow)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    saveTheme(next)
    setTheme(next)
  }

  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={dark}
      title={dark ? 'Light theme' : 'Dark theme'}
      className={`relative flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full text-primary transition-colors hover:bg-surface-container-low ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 14, rotate: -60, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -14, rotate: 60, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.3, visualDuration: 0.3 }}
          className="flex"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
