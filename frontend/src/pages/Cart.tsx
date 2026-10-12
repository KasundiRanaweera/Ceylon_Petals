import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ShoppingBag, Trash2, MessageCircle, ArrowRight, Truck } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import QuantityStepper from '../components/ui/QuantityStepper'
import EmptyState from '../components/ui/EmptyState'
import { useCart } from '../hooks/useCart'
import { useShop, useWhatsApp } from '../hooks/useShop'
import { formatLKR } from '../lib/format'
import { cartOrderMessage } from '../lib/whatsapp'
import { sizedImage } from '../lib/images'

export default function Cart() {
  const { items, subtotal, count, setQuantity, remove, cardMessage, setCardMessage } = useCart()
  const shop = useShop()
  const whatsapp = useWhatsApp()
  const toFreeDelivery = shop.freeDeliveryOver - subtotal

  return (
    <div className="flex flex-col w-full">
      <PageHeader title="Your cart" breadcrumbs={[{ label: 'Cart' }]} subtitle={count > 0 ? `${count} ${count === 1 ? 'item' : 'items'} ready for delivery.` : undefined} />

      <section className="max-w-7xl mx-auto w-full px-4 lg:px-12 py-10">
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            message="Browse fresh bouquets, hampers and plants — everything is prepared in Colombo on the day of delivery."
            action={
              <Link to="/shop" className="px-5 py-2.5 rounded-lg btn-gradient text-label-md ">
                Start shopping
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <ul className="bg-surface-container-lowest rounded-2xl shadow-sm divide-y divide-surface-container overflow-hidden">
                <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, x: 40 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                  <div className="p-4 flex gap-4">
                    <img src={sizedImage(item.imageUrl, 320)} alt="" className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg object-cover bg-surface-container shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          {item.slug ? (
                            <Link to={`/product/${item.slug}`} className="font-display text-headline-sm text-primary hover:text-surface-tint">
                              {item.name}
                            </Link>
                          ) : (
                            <span className="font-display text-headline-sm text-primary">{item.name}</span>
                          )}
                          {item.options && <p className="text-body-sm text-secondary mt-0.5">{item.options}</p>}
                          <p className="text-body-sm text-secondary">{formatLKR(item.unitPrice)} each</p>
                        </div>
                        <span className="text-currency-md text-primary whitespace-nowrap">{formatLKR(item.unitPrice * item.quantity)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-auto">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          max={item.maxQuantity}
                          onChange={(q) => setQuantity(item.id, q)}
                          label={`Quantity of ${item.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="flex items-center gap-1 text-label-md text-error hover:underline"
                        >
                          <Trash2 size={15} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  </motion.li>
                ))}
                </AnimatePresence>
              </ul>

              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-2">
                <label htmlFor="cart-card-message" className="block text-title-md text-primary">Card message (free)</label>
                <textarea
                  id="cart-card-message"
                  rows={3}
                  maxLength={250}
                  value={cardMessage}
                  onChange={(e) => setCardMessage(e.target.value)}
                  placeholder="e.g. Happy birthday Amma! With all our love, Nimal & family"
                  className="w-full bg-surface-container-low rounded-lg p-3 text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-body-sm text-secondary">{cardMessage.length}/250 — handwritten on a card by our team. You can change it at checkout.</p>
              </div>

              <Link to="/shop" className="inline-block text-label-md text-primary hover:underline">← Continue shopping</Link>
            </div>

            <aside className="lg:col-span-4 lg:sticky lg:top-36 bg-surface-container-lowest rounded-xl shadow-md p-6 space-y-4">
              <h2 className="font-display text-headline-sm text-primary">Order summary</h2>
              <dl className="space-y-2 text-body-md">
                <div className="flex justify-between">
                  <dt className="text-secondary">Subtotal</dt>
                  <dd className="text-primary font-semibold">{formatLKR(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary">Delivery</dt>
                  <dd className="text-secondary">Calculated at checkout</dd>
                </div>
              </dl>
              {shop.freeDeliveryOver > 0 && (
                <p className="flex items-start gap-2 bg-surface-container-low rounded-lg p-3 text-body-sm text-on-surface-variant">
                  <Truck size={16} className="text-primary mt-0.5 shrink-0" />
                  {toFreeDelivery > 0
                    ? <>Add {formatLKR(toFreeDelivery)} more for free delivery.</>
                    : <>Your order qualifies for free delivery.</>}
                </p>
              )}
              <Link
                to="/checkout"
                className="w-full btn-gradient  text-title-md py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Checkout <ArrowRight size={18} />
              </Link>
              <a
                href={whatsapp(cartOrderMessage(items, subtotal, cardMessage))}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white hover:bg-[#1EBE5D] text-title-md py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle size={18} /> Order this cart on WhatsApp
              </a>
              <p className="text-body-sm text-secondary text-center">Pay by card (PayHere), cash on delivery, or confirm on WhatsApp.</p>
            </aside>
          </div>
        )}
      </section>
    </div>
  )
}
