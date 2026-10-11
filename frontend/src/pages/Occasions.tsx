import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import OccasionsHero from '../components/occasions/OccasionsHero'
import OccasionTabs from '../components/occasions/OccasionTabs'
import OccasionSection from '../components/occasions/OccasionSection'
import CalligrapherStudio from '../components/occasions/CalligrapherStudio'
import DiasporaBanner from '../components/occasions/DiasporaBanner'
import { listProducts } from '../services/catalog'
import { OCCASIONS } from '../data/catalog'
import type { OccasionSlug } from '../types'

export default function Occasions() {
  const [params, setParams] = useSearchParams()
  const active = OCCASIONS.some((o) => o.slug === params.get('tab')) ? params.get('tab')! : 'all'
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })

  const byOccasion = (slug: OccasionSlug) => products?.filter((p) => p.occasions.includes(slug))
  const visible = active === 'all' ? OCCASIONS : OCCASIONS.filter((o) => o.slug === active)

  function changeTab(slug: string) {
    setParams(slug === 'all' ? {} : { tab: slug }, { replace: true })
  }

  return (
    <div className="flex flex-col w-full">
      <OccasionsHero />
      <OccasionTabs active={active} onChange={changeTab} products={products} />

      {visible.slice(0, 2).map((o, i) => (
        <OccasionSection key={o.slug} occasion={o} products={byOccasion(o.slug)} limit={active === 'all' ? 3 : undefined} shaded={i % 2 === 1} />
      ))}

      <CalligrapherStudio />

      {visible.slice(2).map((o, i) => (
        <OccasionSection key={o.slug} occasion={o} products={byOccasion(o.slug)} limit={3} shaded={i % 2 === 1} />
      ))}

      <DiasporaBanner />
    </div>
  )
}
