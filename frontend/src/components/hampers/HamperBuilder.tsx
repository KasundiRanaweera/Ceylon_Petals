import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Gift } from 'lucide-react'
import BuilderOption, { type BuilderOptionData } from './BuilderOption'
import { useCart } from '../../hooks/useCart'
import { formatLKR } from '../../lib/format'
import { PRODUCT_IMAGES } from '../../data/productImages'

const STEP1_OPTIONS: BuilderOptionData[] = [
  { id: 'roses', name: 'Highland Roses', description: '18 velvety crimson stems in a willow cup.', price: 12000 },
  { id: 'orchids', name: 'White Orchids', description: 'Tall architectural Phalaenopsis & lilies.', price: 14500 },
  { id: 'pastel', name: 'Pastel Meadow', description: 'Soft hydrangeas, lisianthus & baby eucalyptus.', price: 9500 },
]

const STEP2_OPTIONS: BuilderOptionData[] = [
  { id: 'pralines', name: 'Swiss Chocolate Pralines (16 pcs)', description: 'An imported 16-piece chocolate assortment.', price: 7500 },
  { id: 'macarons', name: 'French Macarons Box (10 pcs)', description: 'Pistachio, salted caramel & raspberry.', price: 6800 },
  { id: 'strawberries', name: '24K Gold Glazed Strawberries', description: 'Fresh highland berries with edible gold.', price: 8200 },
]

const STEP3_OPTIONS: BuilderOptionData[] = [
  { id: 'teacaddy', name: 'Single Estate Tea in Brass Caddy', description: 'Handcrafted Sri Lankan brass tea vessel.', price: 9500 },
  { id: 'candle', name: 'Aromatherapy Candle', description: 'Cinnamon, cardamom & wild vanilla soy wax.', price: 4500 },
  { id: 'fan', name: 'Hand-carved Sandalwood Keepsake Fan', description: 'Traditional scented artisanal woodwork.', price: 5500 },
]

export default function HamperBuilder() {
  const [step1, setStep1] = useState('roses')
  const [step2, setStep2] = useState<string[]>(['pralines'])
  const [step3, setStep3] = useState<string | null>('teacaddy')
  const navigate = useNavigate()
  const { addCustom, cardMessage, setCardMessage } = useCart()
  const [message, setMessage] = useState(cardMessage)

  function toggleStep2(id: string) {
    setStep2((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function selectStep3(id: string) {
    setStep3((prev) => (prev === id ? null : id))
  }

  const selectedItems = useMemo(() => {
    const items: { name: string; price: number }[] = []
    const s1 = STEP1_OPTIONS.find((o) => o.id === step1)
    if (s1) items.push({ name: s1.name, price: s1.price })
    STEP2_OPTIONS.filter((o) => step2.includes(o.id)).forEach((o) => items.push({ name: o.name, price: o.price }))
    const s3 = STEP3_OPTIONS.find((o) => o.id === step3)
    if (s3) items.push({ name: s3.name, price: s3.price })
    return items
  }, [step1, step2, step3])

  const total = selectedItems.reduce((sum, item) => sum + item.price, 0)

  // The cart keeps the recipe (which parts were picked). At checkout the server adds up the price
  // from its own list, so the total shown here is only a preview.
  function addToCart() {
    if (!step1) return
    addCustom({
      name: 'Custom-built hamper',
      imageUrl: PRODUCT_IMAGES['velvet-bloom-and-chocolate-box'],
      unitPrice: total,
      options: selectedItems.map((i) => i.name).join(' + '),
      hamper: { base: step1, treats: step2, keepsake: step3 },
    })
    if (message.trim()) setCardMessage(message.trim())
    navigate('/cart')
  }

  return (
    <section id="build-hamper" className="w-full bg-surface-container-low py-14 scroll-mt-36">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] uppercase tracking-widest text-tertiary font-bold">Bespoke Atelier Studio</span>
          <h2 className="font-display text-headline-lg text-primary mt-1">Craft Your Bespoke Hamper</h2>
          <p className="text-body-md text-secondary mt-1">
            Hand-assemble your personalized pairing in 3 effortless steps, freshly prepared each day.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold">1</span>
                  <h3 className="font-display text-headline-sm text-primary">Choose Your Floral Arrangement Base</h3>
                </div>
                <span className="text-[11px] text-secondary uppercase tracking-wider">Required</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {STEP1_OPTIONS.map((opt) => (
                  <BuilderOption key={opt.id} option={opt} selected={step1 === opt.id} onSelect={() => setStep1(opt.id)} />
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold">2</span>
                  <h3 className="font-display text-headline-sm text-primary">Select Gourmet Sweet Treats</h3>
                </div>
                <span className="text-[11px] text-secondary uppercase tracking-wider">Pick 1 or More</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {STEP2_OPTIONS.map((opt) => (
                  <BuilderOption key={opt.id} option={opt} selected={step2.includes(opt.id)} onSelect={() => toggleStep2(opt.id)} />
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold">3</span>
                  <h3 className="font-display text-headline-sm text-primary">Add a Keepsake or Beverage</h3>
                </div>
                <span className="text-[11px] text-secondary uppercase tracking-wider">Optional</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {STEP3_OPTIONS.map((opt) => (
                  <BuilderOption key={opt.id} option={opt} selected={step3 === opt.id} onSelect={() => selectStep3(opt.id)} />
                ))}
              </div>
            </div>
          </div>

          {/* Live summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-40">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-md space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Package size={20} />
                <h4 className="font-display text-headline-sm">Hamper Composition</h4>
              </div>

              <div className="space-y-1 text-body-sm text-secondary">
                {selectedItems.map((item) => (
                  <div key={item.name} className="flex justify-between items-start py-1">
                    <span>{item.name}</span>
                    <span className="text-currency-md text-primary">{formatLKR(item.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-start py-1">
                  <span className="text-secondary">Woven Crate &amp; Silk Ribbons</span>
                  <span className="text-tertiary font-bold uppercase text-[11px]">Complimentary</span>
                </div>
              </div>

              <div className="p-3 bg-surface-container rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-secondary uppercase block">Grand Total</span>
                  <span className="text-primary text-[22px] font-display">{formatLKR(total)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-tertiary block">Delivery</span>
                  <span className="text-body-sm text-primary font-semibold">Added at checkout</span>
                </div>
              </div>

              <div>
                <label htmlFor="hamper-message" className="block text-label-md text-primary mb-2">Card Message</label>
                <textarea
                  id="hamper-message"
                  maxLength={250}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Write a warm note for the recipient..."
                  className="w-full bg-surface-container-low p-3 rounded-lg text-body-sm text-on-surface focus:outline-none focus:bg-surface"
                />
              </div>

              <button type="button" onClick={addToCart} className="w-full bg-primary hover:bg-primary-container text-on-primary text-label-md py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2">
                <Gift size={20} /> Add my hamper to cart
              </button>
              <p className="text-[11px] text-center text-secondary">
                Hand-tied by our florists • Freshness guaranteed
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}