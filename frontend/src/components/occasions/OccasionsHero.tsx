import { Link } from 'react-router-dom'
import { Sparkles, PenLine, Truck, Globe, ArrowRight } from 'lucide-react'
import PageHero from '../ui/PageHero'
import { PRODUCT_IMAGES } from '../../data/productImages'
import { useShop } from '../../hooks/useShop'
import { sameDayDistricts } from '../../lib/shopInfo'

export default function OccasionsHero() {
  const sameDay = sameDayDistricts(useShop())
  return (
    <PageHero
      breadcrumbs={[{ label: 'Shop', to: '/shop' }, { label: 'Occasions' }]}
      eyebrow="Arrangements for every occasion"
      eyebrowIcon={Sparkles}
      title="Celebrate every milestone in Ceylon splendour"
      highlight="Ceylon splendour"
      subtitle="Birthdays, anniversaries, Poruwa ceremonies and quiet moments of sympathy — arrangements designed to mark life's moments with care."
      actions={
        <>
          <Link to="/shop" className="btn-gradient inline-flex items-center gap-3 px-7 py-4">
            Shop all flowers <ArrowRight size={16} />
          </Link>
          <Link to="/custom-order" className="inline-flex items-center gap-2 border-b border-primary pb-1 text-[13px] font-medium uppercase tracking-[0.14em] text-primary hover:border-tertiary hover:text-tertiary">
            Need something custom?
          </Link>
        </>
      }
      badges={[
        { icon: PenLine, label: 'Free handwritten card' },
        { icon: Truck, label: sameDay.length ? `Same-day in ${sameDay[0]}${sameDay.length > 1 ? ' & more' : ''}` : 'Islandwide delivery' },
        { icon: Globe, label: 'Send from overseas' },
      ]}
      image={{
        src: PRODUCT_IMAGES['victoria-pavilion-velvet-box'],
        alt: 'Blush garden roses and tuberose in an emerald velvet hat box',
        caption: { eyebrow: 'Birthday favourite', title: 'Victoria Pavilion Velvet Box', text: 'Garden roses in velvet' },
      }}
    />
  )
}
