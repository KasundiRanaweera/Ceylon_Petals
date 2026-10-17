import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ProductGrid from '../shop/ProductGrid'
import PillTabs from '../ui/PillTabs'
import { listProducts } from '../../services/catalog'

// Sub-collections match the "tags" the owner sets on each hamper in Admin → Products.
const COLLECTIONS = [
  { id: 'all', label: 'All hampers' },
  { id: 'tea', label: 'Ceylon tea crates' },
  { id: 'choc', label: 'Chocolate hampers' },
  { id: 'executive', label: 'Executive & corporate' },
  { id: 'wellness', label: 'Wellness & aromatherapy' },
]

export default function ProductShowcase() {
  const [active, setActive] = useState('all')
  const { data: products } = useQuery({
    queryKey: ['products', { categoryId: 'luxury-hampers' }],
    queryFn: () => listProducts({ categoryId: 'luxury-hampers' }),
  })
  const filtered = active === 'all' ? products : products?.filter((p) => p.tags.includes(active))

  return (
    <section className="w-full bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-secondary">Ready to send</span>
            <h2 className="font-display text-headline-lg text-primary">Flower & gourmet gift crates</h2>
          </div>
          <p className="text-body-sm text-secondary">Silk ribbon • Free card message • Careful delivery</p>
        </div>

        <PillTabs
          label="Hamper collections"
          active={active}
          onChange={setActive}
          options={COLLECTIONS.map((c) => ({ id: c.id, label: c.id === 'all' && products ? `${c.label} (${products.length})` : c.label }))}
        />

        <ProductGrid
          columns="wide"
          products={filtered}
          loading={!products}
          empty={<p className="text-center text-secondary py-10">No hampers in this collection right now — try building your own below.</p>}
        />
      </div>
    </section>
  )
}
