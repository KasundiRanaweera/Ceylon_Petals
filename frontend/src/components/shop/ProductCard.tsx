import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ShoppingBag, MessageCircle, Truck, Check } from 'lucide-react'
import type { Product } from '../../types'
import { formatLKR } from '../../lib/format'
import { discountPercent, effectivePrice, isLowStock } from '../../lib/pricing'
import { productOrderMessage } from '../../lib/whatsapp'
import { useCart } from '../../hooks/useCart'
import { useWhatsApp } from '../../hooks/useShop'
import { imageSrcSet, sizedImage } from '../../lib/images'

// The one product card used on every listing (home, categories, occasions, hampers, plants, search),
// so products look and behave the same wherever a customer finds them.
interface ProductCardProps {
  product: Product
  /** A visual duplicate (e.g. the second copy in a looping carousel): still clickable, but kept out of the tab order. */
  copy?: boolean
  /** Override the image `sizes` hint when the card is shown at a fixed width. */
  sizes?: string
  /** Carousel layout: no description, one-line title, so every card is exactly the same height. */
  compact?: boolean
}

export default function ProductCard({ product, copy = false, sizes, compact = false }: ProductCardProps) {
  const tab = copy ? -1 : undefined
  const { addProduct } = useCart()
  const whatsapp = useWhatsApp()
  const price = effectivePrice(product)
  const off = discountPercent(product)
  const soldOut = product.stock <= 0
  const href = `/product/${product.slug}`
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const id = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(id)
  }, [added])

  return (
    <article className="group flex h-full w-full flex-col rounded-xl bg-surface-container-lowest p-3 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] ring-1 ring-outline-variant/40 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_26px_50px_-28px_rgba(48,48,48,0.45)] motion-reduce:hover:translate-y-0 sm:p-4">
      <Link to={href} className="relative block aspect-square overflow-hidden rounded-lg bg-surface-container" tabIndex={-1} aria-hidden="true">
        <img
          src={sizedImage(product.images[0], 960)}
          srcSet={imageSrcSet(product.images[0])}
          // The photos are landscape (11:6) and the card is square, so the image is drawn
          // 1.83× wider than the card. These sizes include that, so retina screens get a sharp file.
          sizes={sizes ?? "(min-width: 1024px) 560px, (min-width: 640px) 60vw, 90vw"}
          alt=""
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${soldOut ? 'opacity-60 grayscale-[40%]' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {product.badge && (
            <span className="rounded-full bg-primary-fixed px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-tertiary">{product.badge}</span>
          )}
          {off > 0 && (
            <span className="rounded-full bg-tertiary-container px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-on-tertiary-container">
              {off}% off
            </span>
          )}
        </div>
        {soldOut ? (
          <span className="absolute inset-x-3 bottom-3 text-center bg-surface-container-lowest/95 text-on-surface text-label-md py-1.5 rounded-lg">
            Sold out today
          </span>
        ) : (
          isLowStock(product) && (
            <span className="absolute bottom-3 left-3 bg-surface-container-lowest/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-error">
              Only {product.stock} left
            </span>
          )
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 px-1 pb-1 pt-4 sm:gap-3 sm:pt-5">
        <div className="flex-1">
          {product.sameDay ? (
            <p className="eyebrow mb-1.5 flex items-center gap-1.5 text-tertiary">
              <Truck size={13} aria-hidden="true" />
              {/* The full words wrap on narrow two-per-row phone cards. */}
              <span className="sm:hidden">Same-day</span>
              <span className="hidden sm:inline">Same-day delivery</span>
            </p>
          ) : (
            // Keep the same height as the same-day line, so titles and prices line up.
            compact && <p className="eyebrow mb-1.5 text-secondary">Made to order</p>
          )}
          <h3 className={`font-display text-[17px] sm:text-[20px] lg:text-[22px] leading-tight text-primary ${compact ? 'truncate' : ''}`}>
            <Link to={href} tabIndex={tab} className="hover:text-surface-tint transition-colors">
              {product.name}
            </Link>
          </h3>
          {!compact && <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-1">{product.shortDescription}</p>}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold text-tertiary sm:text-[17px]">{formatLKR(price)}</span>
          {off > 0 && <span className="text-body-sm text-secondary line-through">{formatLKR(product.price)}</span>}
        </div>

        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={() => setAdded(addProduct(product))}
            disabled={soldOut}
            tabIndex={tab}
            whileTap={{ scale: 0.97 }}
            className={`flex min-h-[44px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg border text-[14px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              added ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-[#d4af37] text-tertiary hover:bg-[#d4af37] hover:text-on-tertiary-container'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? 'added' : 'add'}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5"
              >
                {added ? <Check size={17} /> : <ShoppingBag size={17} />}
                {soldOut ? 'Sold out' : added ? 'Added' : (
                  <>
                    {/* Narrow two-per-row cards on small phones only fit the short word. */}
                    <span className="min-[420px]:hidden">Add</span>
                    <span className="hidden min-[420px]:inline">Add to cart</span>
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <a
            href={whatsapp(productOrderMessage(product))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Order ${product.name} on WhatsApp`}
            tabIndex={tab}
            title="Order on WhatsApp"
            className="flex w-11 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white transition-colors hover:bg-[#1EBE5D]"
          >
            <MessageCircle size={18} />
          </a>
        </div>
      </div>
    </article>
  )
}
