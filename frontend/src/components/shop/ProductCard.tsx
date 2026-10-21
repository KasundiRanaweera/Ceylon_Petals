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
//
// A modern, frameless card: the photo carries the card. Badges sit on the photo, and the two
// actions (add to cart, order on WhatsApp) float in its bottom corner; "Add to cart" opens out to
// show its label on hover. Below the photo there are just two short lines, the name and the price,
// so every card is the same height. When a product has a second photo, it fades in on hover.
interface ProductCardProps {
  product: Product
  /** A visual duplicate (e.g. the second copy in a looping carousel): still clickable, but kept out of the tab order. */
  copy?: boolean
  /** Override the image `sizes` hint when the card is shown at a fixed width. */
  sizes?: string
}

export default function ProductCard({ product, copy = false, sizes }: ProductCardProps) {
  const tab = copy ? -1 : undefined
  const { addProduct } = useCart()
  const whatsapp = useWhatsApp()
  const price = effectivePrice(product)
  const off = discountPercent(product)
  const soldOut = product.stock <= 0
  const href = `/product/${product.slug}`
  const [added, setAdded] = useState(false)
  const imageSizes = sizes ?? '(min-width: 1280px) 420px, (min-width: 1024px) 33vw, 50vw'
  const second = product.images[1]

  useEffect(() => {
    if (!added) return
    const id = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(id)
  }, [added])

  return (
    <article className="group flex w-full flex-col">
      <div className="relative">
        <Link
          to={href}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block aspect-square overflow-hidden rounded-2xl bg-surface-container"
        >
          <img
            src={sizedImage(product.images[0], 960)}
            srcSet={imageSrcSet(product.images[0])}
            sizes={imageSizes}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none ${
              soldOut ? 'opacity-60 grayscale-[40%]' : ''
            } ${second && !soldOut ? 'group-hover:opacity-0' : ''}`}
          />
          {second && !soldOut && (
            <img
              src={sizedImage(second, 960)}
              srcSet={imageSrcSet(second)}
              sizes={imageSizes}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-[1.04] object-cover opacity-0 transition-[transform,opacity] duration-700 ease-out group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none"
            />
          )}

          <div className="absolute left-3 top-3 flex flex-wrap items-start gap-1.5">
            {off > 0 && (
              <span className="rounded-full bg-[#1b1c1c] px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-[#e9c349]">−{off}%</span>
            )}
            {product.sameDay && !soldOut && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-[#735c00] backdrop-blur-sm">
                <Truck size={12} aria-hidden="true" /> Same-day
              </span>
            )}
            {product.badge && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-[#1b1c1c] backdrop-blur-sm">
                {product.badge}
              </span>
            )}
            {!soldOut && isLowStock(product) && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#ba1a1a] backdrop-blur-sm">
                Only {product.stock} left
              </span>
            )}
          </div>

          {soldOut && (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 py-2 text-center text-[13px] font-medium text-[#1b1c1c] backdrop-blur-sm">
              Sold out today
            </span>
          )}
        </Link>

        {/* the two actions, floating in the photo's bottom corner */}
        {!soldOut && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <a
              href={whatsapp(productOrderMessage(product))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Order ${product.name} on WhatsApp`}
              title="Order on WhatsApp"
              tabIndex={tab}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#1EBE5D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1c1c]"
            >
              <MessageCircle size={19} />
            </a>
            <motion.button
              type="button"
              onClick={() => setAdded(addProduct(product))}
              tabIndex={tab}
              aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
              whileTap={{ scale: 0.94 }}
              className={`card-add flex h-11 cursor-pointer items-center overflow-hidden rounded-full px-3 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.45)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1c1c] ${
                added ? 'bg-emerald-700 text-white' : 'bg-white text-[#1b1c1c] hover:bg-[#d4af37]'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={added ? 'added' : 'add'}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0.35, visualDuration: 0.25 }}
                  className="flex shrink-0 items-center"
                >
                  {added ? <Check size={19} /> : <ShoppingBag size={19} />}
                </motion.span>
              </AnimatePresence>
              <span aria-hidden="true" className="card-add-label whitespace-nowrap text-[13.5px] font-medium">
                {added ? 'Added' : 'Add to cart'}
              </span>
            </motion.button>
          </div>
        )}
      </div>

      <div className="px-1 pt-3">
        <h3 title={product.name} className="truncate font-display text-[16.5px] leading-snug text-on-surface sm:text-[18px]">
          <Link to={href} tabIndex={tab} className="transition-colors hover:text-tertiary">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 flex items-baseline gap-2 text-[14.5px] sm:text-[15.5px]">
          <span className="font-semibold text-tertiary">
            {off > 0 && <span className="sr-only">Now </span>}
            {formatLKR(price)}
          </span>
          {off > 0 && (
            <span className="text-[13px] text-secondary line-through">
              <span className="sr-only">Was </span>
              {formatLKR(product.price)}
            </span>
          )}
        </p>
      </div>
    </article>
  )
}
