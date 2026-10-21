import { useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, MessageCircle, Truck, PenLine, ShieldCheck, Check, Zap } from 'lucide-react'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import QuantityStepper from '../components/ui/QuantityStepper'
import ProductGrid from '../components/shop/ProductGrid'
import NotFound from './NotFound'
import LoadError from '../components/ui/LoadError'
import { getProduct, listCategories, listProducts } from '../services/catalog'
import { OCCASION_NAME } from '../data/occasions'
import { DISTRICTS } from '../data/settings'
import { useCart } from '../hooks/useCart'
import { useShop, useWhatsApp } from '../hooks/useShop'
import { formatLKR } from '../lib/format'
import { formatClock } from '../lib/dates'
import { deliveryFeeFor, discountPercent, effectivePrice, isLowStock } from '../lib/pricing'
import { productOrderMessage } from '../lib/whatsapp'
import type { Product } from '../types'
import { imageSrcSet, sizedImage } from '../lib/images'
import { creditForImage } from '../data/photoCredits'

export default function ProductDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: product, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ['product', slug], queryFn: () => getProduct(slug) })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-12 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse" aria-busy="true">
        <div className="aspect-[4/3] rounded-xl bg-surface-container" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-surface-container rounded" />
          <div className="h-6 w-1/3 bg-surface-container rounded" />
          <div className="h-24 w-full bg-surface-container-low rounded" />
        </div>
      </div>
    )
  }
  // (a missing product comes back as null; an error means the server could not be reached)
  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <LoadError what="this item" onRetry={() => refetch()} retrying={isFetching} />
      </div>
    )
  }
  if (!product) return <NotFound />
  // Reset quantity and photo when moving between products.
  return <ProductView key={product.id} product={product} />
}

function DeliveryChecker({ product }: { product: Product }) {
  const shop = useShop()
  const [district, setDistrict] = useState('Colombo')
  const zone = shop.deliveryZones.find((z) => z.active && z.district === district)
  const fee = deliveryFeeFor(district, effectivePrice(product), shop)

  return (
    <div className="bg-surface-container-low ring-1 ring-outline-variant/40 rounded-xl p-5 sm:p-6 space-y-3">
      <label htmlFor="delivery-district" className="flex items-center gap-2 text-[14px] font-medium text-on-surface-variant">
        <Truck size={18} className="text-tertiary" /> Delivery to
      </label>
      <select
        id="delivery-district"
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        className="w-full min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
      >
        {DISTRICTS.map((d) => (
          <option key={d} value={d}>{d} District</option>
        ))}
      </select>
      <p className="text-body-sm text-on-surface-variant" aria-live="polite">
        {!zone ? (
          <>We don't deliver to {district} online yet — message us on WhatsApp and we'll try to arrange it.</>
        ) : (
          <>
            Delivery fee <strong className="text-on-surface">{fee === 0 ? 'Free' : formatLKR(fee ?? 0)}</strong>
            {' • '}
            {zone.sameDay && product.sameDay
              ? `Same-day if you order before ${formatClock(shop.sameDayCutoff)}`
              : 'Next-day or scheduled delivery'}
          </>
        )}
      </p>
    </div>
  )
}

function ProductView({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { addProduct, items } = useCart()
  const whatsapp = useWhatsApp()
  const [quantity, setQuantity] = useState(1)
  const [photo, setPhoto] = useState(0)
  // On phones, show a sticky buy bar once the main buttons scroll out of view.
  const buyBox = useRef<HTMLDivElement>(null)
  const buyBoxVisible = useInView(buyBox, { initial: true })

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const { data: related } = useQuery({
    queryKey: ['products', { categoryId: product.categoryId }],
    queryFn: () => listProducts({ categoryId: product.categoryId }),
  })
  const category = categories.find((c) => c.id === product.categoryId)

  const price = effectivePrice(product)
  const off = discountPercent(product)
  const credit = creditForImage(product.images[photo])
  const soldOut = product.stock <= 0
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0
  const maxQty = Math.max(1, product.stock - inCart)

  function buyNow() {
    if (addProduct(product, quantity)) navigate('/checkout')
  }

  return (
    <div className="flex flex-col w-full">
      <section className="max-w-7xl mx-auto w-full px-4 lg:px-12 pt-6 pb-16 lg:pb-24">
        <Breadcrumbs
          items={[{ label: 'Shop', to: '/shop' }, ...(category ? [{ label: category.name, to: `/products/${category.slug}` }] : []), { label: product.name }]}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Gallery */}
          <div className="space-y-3 lg:sticky lg:top-36">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-container ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)]">
              <AnimatePresence initial={false}>
                <motion.img
                  key={product.images[photo]}
                  src={sizedImage(product.images[photo], 1408)}
                  srcSet={imageSrcSet(product.images[photo])}
                  sizes="(min-width: 1024px) 640px, 100vw"
                  alt={product.name}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              {off > 0 && (
                <span className="absolute top-4 left-4 bg-primary-fixed text-tertiary text-label-md font-bold px-3 py-1 rounded-full">{off}% off</span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setPhoto(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={photo === i}
                    className={`aspect-square rounded-lg overflow-hidden ring-2 ${photo === i ? 'ring-[#d4af37]' : 'ring-transparent hover:ring-outline-variant'}`}
                  >
                    <img src={sizedImage(src, 240)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {credit && (
              <p className="text-[12px] text-on-surface-variant">
                Photo: {credit.author} ·{' '}
                <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{credit.license}</a>
                {' '}via{' '}
                <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Wikimedia Commons</a>
              </p>
            )}
          </div>

          {/* Buy box */}
          <div className="space-y-6">
            <div className="space-y-2">
              {product.badge && (
                <span className="inline-block bg-primary-fixed text-tertiary text-[11px] font-medium uppercase tracking-[0.18em] px-3 py-1 rounded-full">{product.badge}</span>
              )}
              <h1 className="font-display text-[34px] leading-[42px] lg:text-display-lg text-on-surface tracking-tight">{product.name}</h1>
              <p className="text-body-lg text-on-surface-variant">{product.shortDescription}</p>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-display text-headline-lg text-tertiary">{formatLKR(price)}</span>
              {off > 0 && <span className="text-body-lg text-secondary line-through">{formatLKR(product.price)}</span>}
            </div>

            <p className={`text-label-md ${soldOut ? 'text-error' : isLowStock(product) ? 'text-tertiary' : 'text-emerald-700'}`}>
              {soldOut ? 'Sold out for today — order on WhatsApp and we will try to help' : isLowStock(product) ? `Only ${product.stock} left today` : 'In stock, freshly prepared today'}
            </p>

            {!soldOut && (
              <div className="flex flex-wrap items-center gap-3">
                <QuantityStepper value={quantity} max={maxQty} onChange={setQuantity} label="Quantity" />
                {inCart > 0 && <span className="text-body-sm text-secondary">{inCart} already in your cart</span>}
              </div>
            )}

            <div ref={buyBox} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => addProduct(product, quantity)}
                disabled={soldOut}
                className="btn-gradient min-h-11 text-title-md py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={19} /> Add to cart
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={soldOut}
                className="min-h-11 rounded-lg border border-[#d4af37] text-tertiary hover:bg-[#d4af37] hover:text-on-tertiary-container transition-colors text-title-md py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-tertiary"
              >
                <Zap size={19} /> Buy now
              </button>
              <a
                href={whatsapp(productOrderMessage(product, quantity))}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:col-span-2 min-h-11 bg-[#25D366] text-white hover:bg-[#1EBE5D] text-title-md py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle size={19} /> Order on WhatsApp
              </a>
            </div>

            <DeliveryChecker product={product} />

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm text-on-surface-variant">
              <li className="flex items-center gap-2"><PenLine size={17} className="text-tertiary" /> Free handwritten card message</li>
              <li className="flex items-center gap-2"><ShieldCheck size={17} className="text-tertiary" /> Freshness guaranteed or replaced</li>
            </ul>

            {product.details.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-display text-on-surface text-headline-sm">What's included</h2>
                <ul className="space-y-1.5">
                  {product.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-body-md text-on-surface">
                      <Check size={18} className="text-emerald-700 mt-0.5 shrink-0" /> {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.attributes && (
              <dl className="grid grid-cols-2 gap-3">
                {Object.entries(product.attributes).map(([k, v]) => (
                  <div key={k} className="bg-surface-container-lowest ring-1 ring-outline-variant/40 rounded-xl p-4">
                    <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-tertiary">{k}</dt>
                    <dd className="text-body-md text-on-surface">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="space-y-2">
              <h2 className="font-display text-on-surface text-headline-sm">About this {category?.id === 'indoor-plants' ? 'plant' : 'arrangement'}</h2>
              <p className="text-body-md text-on-surface-variant leading-relaxed">{product.description}</p>
              <p className="text-body-sm text-secondary">
                Flowers are seasonal, so we may swap a stem for one of equal or higher value to keep your gift looking its best.
              </p>
            </div>

            {product.occasions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-label-md text-on-surface-variant">Perfect for:</span>
                {product.occasions.map((o) => (
                  <Link key={o} to={`/shop?occasion=${o}`} className="inline-flex min-h-11 items-center px-4 py-1 rounded-full bg-primary-fixed text-label-md text-tertiary hover:bg-[#d4af37] hover:text-on-tertiary-container transition-colors">
                    {OCCASION_NAME[o]}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {!buyBoxVisible && !soldOut && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface/95 px-4 py-3 backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center gap-3">
              <img src={sizedImage(product.images[0], 160)} alt="" className="h-12 w-10 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-title-md text-on-surface">{product.name}</p>
                <p className="text-body-sm text-secondary">{formatLKR(price)}</p>
              </div>
              <a
                href={whatsapp(productOrderMessage(product, quantity))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Order on WhatsApp"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#25D366] text-white hover:bg-[#1EBE5D]"
              >
                <MessageCircle size={18} />
              </a>
              <button type="button" onClick={() => addProduct(product, quantity)} className="flex h-11 items-center gap-2 rounded-lg btn-gradient px-4 text-label-md">
                <ShoppingBag size={17} /> Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="w-full bg-surface-container-low py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-8">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-headline-lg text-on-surface">You may also like</h2>
            {category && (
              <Link to={`/products/${category.slug}`} className="inline-flex min-h-11 items-center border-b border-[#d4af37] text-label-md text-tertiary hover:text-on-surface transition-colors">
                See all {category.name}
              </Link>
            )}
          </div>
          <ProductGrid products={related?.filter((p) => p.id !== product.id).slice(0, 4)} loading={!related} columns={4} />
        </div>
      </section>
    </div>
  )
}
