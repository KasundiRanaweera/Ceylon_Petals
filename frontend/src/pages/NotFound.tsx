import { Link } from 'react-router-dom'
import { Flower2 } from 'lucide-react'

export default function NotFound() {
  return (
    <section className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-surface-container flex items-center justify-center text-primary">
        <Flower2 size={28} />
      </div>
      <h1 className="font-display text-headline-lg text-primary">We couldn't find that page</h1>
      <p className="text-body-md text-secondary">
        The link may be old, or the item may no longer be available. Have a look at what's fresh today instead.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link to="/shop" className="px-5 py-2.5 rounded-lg btn-gradient text-label-md ">Shop flowers</Link>
        <Link to="/" className="px-5 py-2.5 rounded-lg bg-surface-container text-primary text-label-md hover:bg-surface-container-high">Go to home page</Link>
      </div>
    </section>
  )
}
