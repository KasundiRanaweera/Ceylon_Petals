// The home page's opening screen shows once per browser session, and never to visitors who have
// asked their device for reduced motion.
export const INTRO_SEEN_KEY = 'cp-intro-seen'

export function shouldShowIntro(): boolean {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1'
  } catch {
    return false
  }
}
