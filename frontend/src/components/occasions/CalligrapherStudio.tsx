import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PenTool, BookOpen, BadgeCheck, Brush, Check } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useShop } from '../../hooks/useShop'
import { useToast } from '../../hooks/useToast'

const CARD_THEMES = [
  {
    id: 'anniversary',
    label: 'Golden Anniversary',
    previewLabel: 'Golden Anniversary Letter',
    defaultMessage: "May our shared journey blossom forever with the grace of Nuwara Eliya mornings. Happy 10th Anniversary, my eternal love.",
  },
  {
    id: 'birthday',
    label: 'Birthday Milestone',
    previewLabel: 'Birthday Jubilee Inscription',
    defaultMessage: "Wishing you a vibrant year brimming with sunshine, fresh blooms, and radiant joy. Happy Birthday!",
  },
  {
    id: 'condolence',
    label: 'Deep Condolences',
    previewLabel: 'Comfort & Gentle Solace',
    defaultMessage: "Holding your family deeply in our thoughts during this quiet hour. May fondest memories bring warmth and peace to your hearts.",
  },
]

const WAX_COLORS = [
  { id: 'ember', hex: '#1C1410', label: 'Ember Black' },
  { id: 'gold', hex: '#CCA830', label: 'Royal Gold' },
  { id: 'orange', hex: '#C2410C', label: 'Burnt Orange' },
]

// Converted from the original vanilla-JS DOM manipulation (selectWax, selectCardTheme,
// updateLivePreview) into a single piece of React state driving the live preview.
export default function CalligrapherStudio() {
  const [themeId, setThemeId] = useState('anniversary')
  const [waxId, setWaxId] = useState('ember')
  const [message, setMessage] = useState(CARD_THEMES[0].defaultMessage)
  const { cardMessage, setCardMessage } = useCart()
  const { shopName } = useShop()
  const { showToast } = useToast()
  const saved = cardMessage === message.trim() && message.trim() !== ''

  function saveForOrder() {
    setCardMessage(message.trim())
    showToast('Card message saved — it will be filled in at checkout')
  }

  const theme = CARD_THEMES.find((t) => t.id === themeId)!
  const wax = WAX_COLORS.find((w) => w.id === waxId)!

  function handleThemeSelect(id: string) {
    setThemeId(id)
    const found = CARD_THEMES.find((t) => t.id === id)
    if (found) setMessage(found.defaultMessage)
  }

  return (
    <section className="w-full bg-surface py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Studio controls */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">
                  <PenTool size={16} />
                  Complimentary Service
                </div>
                <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">Complimentary Calligrapher Studio</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-on-surface-variant">
                  Every occasion arrangement includes a personalized card, handwritten by our
                  calligrapher and sealed with a hand-poured wax seal.
                </p>
              </div>

              <div>
                <label className="block text-label-md text-on-surface mb-2">1. Select Occasion Card</label>
                <div className="grid grid-cols-3 gap-2">
                  {CARD_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleThemeSelect(t.id)}
                      className={`p-2 rounded-lg text-center text-[11px] ring-1 transition-colors ${
                        t.id === themeId ? 'bg-[#d4af37]/15 font-semibold text-on-surface ring-[#d4af37]' : 'bg-surface-container-low text-on-surface-variant ring-transparent hover:text-tertiary'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-label-md text-on-surface mb-2">2. Choose Wax Seal Colour</label>
                <div className="flex items-center gap-4">
                  {WAX_COLORS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWaxId(w.id)}
                      className={`flex items-center gap-2 p-1.5 rounded-full transition-colors ${
                        w.id === waxId ? 'bg-surface-container-high ring-2 ring-[#d4af37]' : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full inline-block shadow-sm" style={{ backgroundColor: w.hex }} />
                      <span className={`text-[11px] pr-2 ${w.id === waxId ? 'text-on-surface' : 'text-on-surface-variant'}`}>{w.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-label-md text-on-surface" htmlFor="custom-message">3. Write Your Message</label>
                  <span className="text-[11px] text-on-surface-variant">{message.length}/250 characters</span>
                </div>
                <textarea
                  id="custom-message"
                  maxLength={250}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter names, sentiments, or memorable moments..."
                  className="w-full bg-surface-container-low rounded-lg p-4 text-body-md text-on-surface ring-1 ring-outline-variant/40 focus:outline-none focus:ring-[#d4af37] placeholder:text-outline"
                />
              </div>

              <div className="flex items-center gap-2 text-tertiary text-body-sm">
                <Brush size={18} />
                <span>Handwritten with black ink by our resident calligrapher.</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveForOrder}
                  disabled={!message.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg btn-gradient text-label-md  disabled:opacity-50"
                >
                  {saved ? <Check size={16} /> : <PenTool size={16} />} {saved ? 'Saved for your order' : 'Use this message for my order'}
                </button>
                {saved && <Link to="/cart" className="text-label-md border-b border-on-surface-variant pb-1 text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary">Go to cart</Link>}
              </div>
            </div>

            {/* Live preview */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md bg-surface text-on-surface p-8 rounded-xl ring-1 ring-outline-variant/40 shadow-[0_24px_50px_-28px_rgba(48,48,48,0.45)] relative min-h-[380px] flex flex-col justify-between overflow-hidden">
                <div className="absolute -right-8 -top-8 w-40 h-40 opacity-20 pointer-events-none">
                  <svg className="w-full h-full fill-current text-[#d4af37]" viewBox="0 0 100 100">
                    <path d="M50 0 C60 30 70 40 100 50 C70 60 60 70 50 100 C40 70 30 60 0 50 C30 40 40 30 50 0 Z" />
                  </svg>
                </div>

                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="font-display text-[16px] text-mauve tracking-widest uppercase block">{shopName}</span>
                    <span className="text-[9px] uppercase tracking-widest text-outline">{theme.previewLabel}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline">
                    <BookOpen size={16} />
                  </div>
                </div>

                <div className="my-4">
                  <p className="font-display italic text-[19px] leading-relaxed text-on-surface tracking-wide whitespace-pre-wrap">
                    "{message}"
                  </p>
                  <div className="mt-4 text-right font-display italic text-[15px] text-on-surface-variant">— With Love</div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-outline tracking-widest uppercase">
                    <span>COLOMBO</span>
                  </div>
                  <div
                    className="flex items-center gap-2 text-on-primary px-4 py-1.5 rounded-lg shadow-md transition-all duration-300"
                    style={{ backgroundColor: wax.hex }}
                  >
                    <BadgeCheck size={16} className="text-[#e9c349]" />
                    <span className="text-[10px] tracking-wider uppercase">{wax.label} Seal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}