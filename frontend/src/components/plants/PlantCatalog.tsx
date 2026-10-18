import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ProductGrid from '../shop/ProductGrid'
import PillTabs from '../ui/PillTabs'
import { listProducts } from '../../services/catalog'

const COLLECTIONS = [
  { id: 'all', label: 'All indoor plants' },
  { id: 'low-light', label: 'Low-light plants' },
  { id: 'air-purifying', label: 'Air-purifying' },
  { id: 'rare-orchids', label: 'Orchids & calatheas' },
]

const LIGHT_OPTIONS = [
  { id: '', label: 'Any light' },
  { id: 'low', label: 'Low light' },
  { id: 'bright', label: 'Bright, filtered light' },
]

export default function PlantCatalog() {
  const [collection, setCollection] = useState('all')
  const [light, setLight] = useState('')
  const [petSafe, setPetSafe] = useState(false)
  const { data: plants } = useQuery({
    queryKey: ['products', { categoryId: 'indoor-plants' }],
    queryFn: () => listProducts({ categoryId: 'indoor-plants' }),
  })

  const filtered = useMemo(
    () =>
      plants?.filter((p) => {
        const attrs = p.attributes ?? {}
        if (collection !== 'all' && !p.tags.includes(collection)) return false
        if (light && !(attrs.Light ?? '').toLowerCase().startsWith(light)) return false
        if (petSafe && !(attrs['Pet safe'] ?? '').startsWith('Yes')) return false
        return true
      }),
    [plants, collection, light, petSafe]
  )

  function reset() {
    setCollection('all')
    setLight('')
    setPetSafe(false)
  }

  return (
    <section id="plantsGrid" className="px-4 lg:px-12 py-12 scroll-mt-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-3">
          <PillTabs
            label="Plant collections"
            active={collection}
            onChange={setCollection}
            options={COLLECTIONS.map((c) => ({ ...c, count: plants ? (c.id === 'all' ? plants.length : plants.filter((p) => p.tags.includes(c.id)).length) : null }))}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="plant-light" className="sr-only">Light</label>
              <select
                id="plant-light"
                value={light}
                onChange={(e) => setLight(e.target.value)}
                className="bg-surface-container-low text-on-surface text-label-md px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {LIGHT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <label className="flex items-center gap-2 text-label-md text-on-surface cursor-pointer">
                <input type="checkbox" checked={petSafe} onChange={(e) => setPetSafe(e.target.checked)} className="accent-primary w-4 h-4" />
                Safe for cats & dogs
              </label>
            </div>
            <div className="flex items-center gap-4 text-body-sm text-secondary">
              <span>Showing <strong className="text-primary">{filtered?.length ?? 0}</strong> plants</span>
              <button type="button" onClick={reset} className="text-label-md text-primary hover:underline">Reset</button>
            </div>
          </div>
        </div>

        <ProductGrid
          columns="wide"
          products={filtered}
          loading={!plants}
          empty={<p className="text-center text-secondary py-10">No plants match these filters yet — try resetting them.</p>}
        />
      </div>
    </section>
  )
}
