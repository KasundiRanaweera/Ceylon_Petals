import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '../motion/Reveal'
import { useShop } from '../../hooks/useShop'

// The studio story: a full-height photo beside a short text, then the live figures band.
export default function StudioStory() {
  const { shopName } = useShop()
  return (
    <section aria-labelledby="story-title" className="grid grid-cols-1 bg-surface lg:grid-cols-2">
      <div className="relative min-h-[360px] lg:min-h-[640px]">
        <img src="/images/stitch/story-florist.webp" alt="A florist arranging fresh roses in the studio" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <Reveal className="flex items-center px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
        <div className="max-w-lg">
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Our Colombo studio</p>
          <h2 id="story-title" className="mt-4 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] text-on-surface">
            Weaving Narratives through Petals
          </h2>
          <p className="mt-8 text-[16px] leading-[1.85] text-on-surface-variant">
            At {shopName}, we believe every stem holds a silent conversation. Each bouquet is hand-tied in our Colombo studio from flowers
            cut fresh in Sri Lanka's hill country, then delivered with a handwritten card.
          </p>
          <p className="mt-5 text-[16px] leading-[1.85] text-on-surface-variant">
            We pair local tropical blooms with contemporary design, for birthdays, Poruwa ceremonies and every quiet moment in between.
          </p>
          <Link to="/about" className="mt-10 inline-flex min-h-[44px] items-center gap-3 text-[15px] text-on-surface-variant transition-colors hover:text-tertiary">
            Explore our story <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
