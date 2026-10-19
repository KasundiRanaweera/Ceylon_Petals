import { useShop } from '../../hooks/useShop'

// "Moments on Instagram": a strip of six photos. It links to the shop's Instagram when the owner has
// added one (Admin -> Settings -> Storefront); without a link it is just a gallery.
const PHOTOS = ['ig-1', 'ig-2', 'ig-3', 'shop-4', 'ig-5', 'ig-6']

function handleOf(url: string): string {
  try {
    const path = new URL(url).pathname.split('/').filter(Boolean)[0]
    return path ? `@${path.replace(/^@/, '')}` : ''
  } catch {
    return ''
  }
}

export default function InstagramStrip() {
  const { instagramUrl } = useShop()
  const handle = instagramUrl ? handleOf(instagramUrl) : ''
  return (
    <section aria-labelledby="instagram-title" className="bg-surface pt-20">
      <div className="px-4 text-center">
        <h2 id="instagram-title" className="text-[13px] font-medium uppercase tracking-[0.3em] text-tertiary">
          Moments on Instagram
        </h2>
        {instagramUrl && (
          <p className="mt-3 text-[15px] text-on-surface-variant">
            Follow our journey{' '}
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="uppercase underline-offset-4 hover:text-tertiary hover:underline">
              {handle || 'on Instagram'}
            </a>
          </p>
        )}
      </div>
      <ul className="mt-10 grid grid-cols-3 gap-2 px-2 lg:grid-cols-6">
        {PHOTOS.map((p) => {
          const img = <img src={`/images/stitch/${p}.webp`} alt="" loading="lazy" className="aspect-square h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          return (
            <li key={p} className="group overflow-hidden">
              {instagramUrl ? (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Open our Instagram" className="block">
                  {img}
                </a>
              ) : (
                img
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
