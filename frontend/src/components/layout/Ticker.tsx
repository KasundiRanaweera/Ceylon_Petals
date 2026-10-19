import { useShop } from '../../hooks/useShop'
import { sameDayDistricts, listWords } from '../../lib/shopInfo'
import { formatClock } from '../../lib/dates'
import { formatLKR } from '../../lib/format'

// The scrolling line in the top bar. Every message comes from the owner's Settings, so it always
// says what the shop really offers: the owner's own announcement first, then delivery, free
// delivery, custom orders and opening hours. Hovering pauses it; with reduced motion it stays still.
export default function Ticker() {
  const shop = useShop()
  const sameDay = sameDayDistricts(shop)
  const messages = [
    shop.announcement,
    sameDay.length > 0 ? `Same-day delivery in ${listWords(sameDay)}, order before ${formatClock(shop.sameDayCutoff)}` : '',
    shop.freeDeliveryOver > 0 ? `Free delivery on orders over ${formatLKR(shop.freeDeliveryOver)}` : '',
    'Fresh highland flowers, hand-tied in Colombo',
    'Custom orders for weddings, Poruwa ceremonies and events',
    shop.openingHours ? `Open ${shop.openingHours}` : '',
  ].filter(Boolean)

  // Two identical runs side by side; the track slides left by one run, then loops seamlessly.
  const run = () => (
    <ul className="flex shrink-0 items-center">
      {messages.map((m) => (
        <li key={m} className="flex items-center whitespace-nowrap">
          <span>{m}</span>
          <span aria-hidden="true" className="px-5 text-[#e9c349]">✦</span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="ticker relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
      <p className="sr-only">{messages.join('. ')}</p>
      <div aria-hidden="true" className="ticker-track flex w-max">
        {run()}
        {run()}
      </div>
    </div>
  )
}
