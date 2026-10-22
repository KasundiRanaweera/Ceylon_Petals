import { Link } from 'react-router-dom'
import { Sprout, Mountain, Snowflake, Users, ArrowRight } from 'lucide-react'
import PageHero from '../ui/PageHero'
import { SITE_IMAGES } from '../../data/siteImages'
import { useShop } from '../../hooks/useShop'

export default function AboutHero() {
  const { shopName } = useShop()
  return (
    <PageHero
      breadcrumbs={[{ label: 'About us' }]}
      eyebrow={`The story of ${shopName}`}
      eyebrowIcon={Sprout}
      title="From misty highlands to homes across Sri Lanka"
      highlight="homes across Sri Lanka"
      subtitle={`${shopName} began in Colombo with a simple idea: bring the cool-climate flowers of Sri Lanka's central highlands to the island's doorsteps, arranged with the same care they were grown with.`}
      actions={
        <>
          <Link to="/shop" className="btn-gradient inline-flex items-center gap-3 px-7 py-4">
            Shop the collection <ArrowRight size={16} />
          </Link>
          <a href="#visit" className="inline-flex items-center gap-2 border-b border-[#d4af37] pb-1 text-[13px] font-medium uppercase tracking-[0.14em] text-on-surface hover:text-tertiary">
            Visit our studio
          </a>
        </>
      }
      badges={[
        { icon: Mountain, label: 'Grown in the central hills' },
        { icon: Snowflake, label: 'Temperature-conscious transit' },
        { icon: Users, label: 'Direct from local growers' },
      ]}
      image={{
        src: SITE_IMAGES.aboutHighlands,
        alt: 'Rows of pink and red flowers in a garden below the hills',
        caption: { eyebrow: 'Since day one', title: 'Highland to doorstep', text: 'Cut fresh, arranged in Colombo' },
      }}
    />
  )
}
