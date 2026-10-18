import { Flower2, ArrowRight, Images, CalendarHeart, Sprout } from 'lucide-react'
import PageHero from '../ui/PageHero'
import { SITE_IMAGES } from '../../data/siteImages'

export default function WeddingHero() {
  return (
    <PageHero
      tone="dark"
      breadcrumbs={[{ label: 'Weddings & Events' }]}
      eyebrow="Now booking upcoming wedding seasons"
      eyebrowIcon={Flower2}
      title="Bespoke Poruwa ceremonies & floral architecture"
      highlight="floral architecture"
      subtitle="Sri Lankan wedding traditions in living flowers — from lotus-draped Poruwa stages in Colombo ballrooms to highland orchids framing colonial arches."
      actions={
        <>
          <a
            href="#consultation"
            className="btn-gradient inline-flex items-center gap-3 px-7 py-4"
          >
            Book a consultation <ArrowRight size={16} />
          </a>
          <a href="#portfolio" className="inline-flex items-center gap-2 border-b border-[#fdba74] pb-1 text-[13px] font-medium uppercase tracking-[0.14em] text-white hover:text-tertiary-fixed-dim">
            <Images size={18} /> View our work
          </a>
        </>
      }
      badges={[
        { icon: CalendarHeart, label: 'Book 6–12 months ahead' },
        { icon: Sprout, label: 'Fresh highland blooms' },
      ]}
      image={{
        src: SITE_IMAGES.weddingPoruwa,
        alt: 'Traditional Sri Lankan Poruwa decorated with fresh lotuses, orchids and jasmine',
        caption: { eyebrow: 'Featured design', title: 'The Lotus & Brass Poruwa', text: 'Colombo ballroom celebration' },
      }}
    />
  )
}
