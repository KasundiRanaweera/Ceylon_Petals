import { Link } from 'react-router-dom'
import { Flower2 } from 'lucide-react'

export default function NotFound() {
  return (
    <section className="max-w-2xl mx-auto px-4 py-20 lg:py-28 text-center space-y-5">
      <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-lowest ring-1 ring-[#d4af37]/60 flex items-center justify-center text-tertiary">
        <Flower2 size={28} />
      </div>
      <h1 className="font-display text-headline-lg text-on-surface">We couldn't find that page</h1>
      <p className="text-body-md leading-relaxed text-on-surface-variant">
        The link may be old, or the item may no longer be available. Have a look at what's fresh today instead.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link to="/shop" className="btn-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-label-md">Shop flowers</Link>
        <Link to="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#d4af37] px-5 py-2.5 text-label-md text-tertiary transition-colors hover:bg-[#d4af37] hover:text-on-tertiary-container">Go to home page</Link>
      </div>
    </section>
  )
}
