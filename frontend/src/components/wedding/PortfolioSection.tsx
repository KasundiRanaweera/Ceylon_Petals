import { Star } from 'lucide-react'

interface PortfolioItem {
  id: string
  couple: string
  venue: string
  location: string
  quote: string
  scale: string
  imageUrl: string
}

// TODO: these are sample entries. The owner should replace them with real weddings
// and real client testimonials (later loaded from the API / admin dashboard).
const ITEMS: PortfolioItem[] = [
  {
    id: '1',
    couple: 'Senali & Rukshan',
    venue: 'Colombo Hotel Ballroom',
    location: 'Colombo',
    quote:
      'The Poruwa left our elders spellbound. The fragrance of fresh jasmine and lotus stayed with us throughout the ceremony.',
    scale: 'Traditional Sinhala Rite • Full Poruwa & Reception',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_OhzMRsVsJsJJkLj2xxwNcD45McmXDDWYJP4UUGSKia9hZrMPCQpeyerCcTwI0f2yc8yrwYVW5w546ld5FUCOduk-4aItId01e4cc9OMhxr2Jj73bMIB3EjC0gVvvtZ8iZQbOFGm5MG_zVcOY4DzOcKm1-0HKzvY461yxMcrwTkle_XRjkT7HXAvAEJWXKIAwzLYxSE53j4bHYVIaujFr4GNVEawuKASjZhDKnXprlOOufD_1zWTAXw=w1408',
  },
  {
    id: '2',
    couple: 'Maya & David',
    venue: 'Galle Fort Heritage Venue',
    location: 'Galle Fort',
    quote:
      'Planning from Melbourne was stress-free. They understood our wish for tropical flora layered with garden blooms, and the bridal bouquet held up beautifully in the coastal heat.',
    scale: 'Rampart Archways & Banquet Tables • Overseas Couple',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANU_fGF1su4RYXhyVcLxrADLaki9WHd98aXpMOUO3fcxJLXDVys44GvqWuJCv_MdFlTcV3Eic7oYeexSx3bF1BDdSc9jG-6fIkTZP0pJQbWPCaVoPwZNUfd23GAmpkUVN_SngKfCT5sBq8xJ-dRVn-FS64F-VlACS7uoS3uF1Gd9qdsaKtSTzDojk4qyiANCEqiQMkyyB7wEb1bLg9dznwFLJrC8uz9zh-RQNPEes-9LPe6VIlXYxceg=w1408',
  },
  {
    id: '3',
    couple: 'Kavindi & Tariq',
    venue: 'Colombo Lakeside Venue',
    location: 'Colombo',
    quote:
      'The head-table floral arrangement took our breath away. The team set everything up overnight and every bloom looked fresh on the day.',
    scale: 'Suspended Florals & Ceremonial Mandap',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3c_dSFotztpOokndsiilEzUGI1Jfpk8lvdnLsoximZCtAQLg0zWDqH5IFkIM4vQ4FUMAlOSayf_zoqDM9JdH53qeEQ3pSEiu5g1vqY20ROc782FKr7Tx64fHmaaCKti1rTbhsLV0FYgp7Wz5sBGvjCoOsuXlu4qbKPMiNoeKYIfOz6CRM6HZ5P0ZYsBXaVrlOjSvSuww5eUN92pzyHbXtyeZmhzP5XsIwWjWtIubcK_n5daghdTghXg=w1408',
  },
]

export default function PortfolioSection() {
  return (
    <section id="portfolio" className="w-full bg-surface py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-12 lg:space-y-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Our Work</span>
          <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">Real Weddings &amp; Celebrations</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-on-surface-variant">A glimpse into ceremonies we've had the joy of decorating across the island.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ITEMS.map((item) => (
            <div key={item.id} className="group rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] overflow-hidden p-3 transition-shadow hover:shadow-[0_24px_50px_-26px_rgba(48,48,48,0.45)] flex flex-col">
              <div className="h-80 relative overflow-hidden rounded-lg">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" src={item.imageUrl} alt={`${item.couple} wedding florals`} />
                <span className="absolute top-3 right-3 bg-primary-fixed text-on-primary-fixed px-3 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
                  {item.location}
                </span>
              </div>
              <div className="p-4 pt-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1 text-tertiary mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" />
                    ))}
                  </div>
                  <h3 className="font-display text-headline-sm text-on-surface">{item.couple}</h3>
                  <p className="text-label-md text-tertiary mt-0.5">{item.venue}</p>
                  <p className="text-body-sm text-on-surface-variant italic mt-3 leading-relaxed">"{item.quote}"</p>
                </div>
                <div className="pt-3 text-[11px] uppercase tracking-[0.14em] text-on-surface-variant border-t border-outline-variant/50">{item.scale}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}