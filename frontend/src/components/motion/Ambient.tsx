// Decorative background layers for heroes. Pure CSS loops (see index.css), hidden from
// screen readers and switched off for people who prefer reduced motion.

export function Blobs({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const colors =
    tone === 'dark'
      ? ['bg-[#d4af37]/15', 'bg-[#e9c349]/10', 'bg-white/5']
      : ['bg-[#e9c349]/20', 'bg-[#fce4ec]/50', 'bg-[#f0eded]/80']
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`animate-blob absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl ${colors[0]}`} />
      <div className={`animate-blob absolute top-1/3 -left-32 h-80 w-80 rounded-full blur-3xl ${colors[1]}`} style={{ animationDelay: '-6s' }} />
      <div className={`animate-blob absolute -bottom-24 right-1/3 h-72 w-72 rounded-full blur-3xl ${colors[2]}`} style={{ animationDelay: '-12s' }} />
    </div>
  )
}

// A few slowly falling petals. Positions are fixed so the layout never shifts between renders.
const PETALS = [
  { left: '8%', delay: '0s', duration: '17s', size: 14, sway: '60px', spin: '320deg' },
  { left: '22%', delay: '-6s', duration: '21s', size: 10, sway: '-40px', spin: '-260deg' },
  { left: '48%', delay: '-11s', duration: '19s', size: 12, sway: '50px', spin: '280deg' },
  { left: '67%', delay: '-3s', duration: '23s', size: 9, sway: '-55px', spin: '-300deg' },
  { left: '86%', delay: '-14s', duration: '18s', size: 13, sway: '35px', spin: '240deg' },
]

export function Petals({ color = '#d4af37' }: { color?: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {PETALS.map((p, i) => (
        <svg
          key={i}
          className="animate-petal absolute top-0"
          width={p.size}
          height={p.size}
          viewBox="0 0 20 20"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ['--petal-sway' as string]: p.sway,
            ['--petal-spin' as string]: p.spin,
          }}
        >
          <path d="M10 0C14 5 16 10 10 20C4 10 6 5 10 0Z" fill={color} opacity="0.75" />
        </svg>
      ))}
    </div>
  )
}
