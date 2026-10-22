// Light and dark theme. The theme is set as <html data-theme="light|dark">, and the colour tokens
// in index.css change with it. A visitor's choice is remembered on this device; until they choose,
// the site follows their device setting. index.html applies it before the page draws, so there is
// no flash of the wrong theme.

export type Theme = 'light' | 'dark'

const THEME_KEY = 'cp-theme'

export function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

export function deviceTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Puts the theme on the page, with a short fade while the colours change. */
export function applyTheme(theme: Theme, animate = true) {
  const root = document.documentElement
  if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-switching')
    window.setTimeout(() => root.classList.remove('theme-switching'), 400)
  }
  root.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141312' : '#fcf9f8')
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* private mode: the choice lasts for this visit only */
  }
}
