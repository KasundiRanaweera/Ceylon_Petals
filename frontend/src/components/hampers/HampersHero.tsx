import { Link } from 'react-router-dom'
import { Gift, Snowflake, BadgeCheck, Building2, ArrowRight } from 'lucide-react'
import PageHero from '../ui/PageHero'
import { PRODUCT_IMAGES } from '../../data/productImages'

export default function HampersHero() {
  return (
    <PageHero
      breadcrumbs={[{ label: 'Shop', to: '/shop' }, { label: 'Luxury Hampers' }]}
      eyebrow="Festive & corporate gifting"
      eyebrowIcon={Gift}
      title="Artisanal hampers & handcrafted gourmet pairings"
      highlight="gourmet pairings"
      subtitle="Willow and velvet crates filled with fresh highland stems, single-estate Ceylon tea and fine chocolates — or build your own below."
      actions={
        <>
          <a href="#build-hamper" className="btn-gradient inline-flex items-center gap-3 px-7 py-4">
            Build your own hamper <ArrowRight size={16} />
          </a>
          <Link to="/custom-order?type=corporate" className="inline-flex items-center gap-2 border-b border-primary pb-1 text-[13px] font-medium uppercase tracking-[0.14em] text-primary hover:border-tertiary hover:text-tertiary">
            Corporate orders
          </Link>
        </>
      }
      badges={[
        { icon: Snowflake, label: 'Careful, cool delivery' },
        { icon: BadgeCheck, label: 'Genuine Ceylon tea' },
        { icon: Building2, label: 'Corporate invoices' },
      ]}
      image={{
        src: PRODUCT_IMAGES['velvet-bloom-and-chocolate-box'],
        alt: 'Red roses beside fine chocolates in a velvet keepsake box',
        caption: { eyebrow: 'Bestseller', title: 'Velvet Bloom & Chocolate Box', text: '24 roses & fine pralines' },
      }}
    />
  )
}
