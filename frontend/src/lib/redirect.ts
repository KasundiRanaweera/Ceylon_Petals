/** Only allow "?next=" redirects to pages inside this site. */
export function safeNext(next: string | null, fallback: string): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}
