import { Leaf, Snowflake, Sprout, ArrowUpRight } from 'lucide-react'

const POINTS = [
  {
    icon: Leaf,
    title: 'Highland Growers',
    text: 'We source garden roses, calla lilies, and ferns from highland growers in the cool central hills.',
  },
  {
    icon: Snowflake,
    title: 'Temperature-Controlled Delivery',
    text: 'Stems travel in temperature-controlled vehicles from the hills to your venue, keeping blooms fresh for the ceremony.',
  },
  {
    icon: Sprout,
    title: 'Eco-Conscious Rigging',
    text: 'Where possible we use reusable structures and minimise floral foam to reduce waste after the event.',
  },
]

const FLOW_STEPS = [
  { x: 70, num: '01', label: 'Highland Harvest' },
  { x: 200, num: '02', label: 'Cool Transit' },
  { x: 330, num: '03', label: 'Venue Setup' },
]

export default function StandardSection() {
  return (
    <section className="w-full bg-ink-gradient text-on-primary py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[13px] font-medium uppercase tracking-[0.22em] text-[#e9c349]">Our Standard</span>
            <h2 className="mt-3 block font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-white">
              Responsible Sourcing &amp; Freshness You Can Trust
            </h2>
            <p className="text-[15px] text-white/70 leading-relaxed">
              In tropical Sri Lanka, weddings demand careful floral handling. A beautiful design means
              little if the petals tire before the vows — so we protect freshness from harvest to
              handover.
            </p>
            <div className="space-y-4 pt-1">
              {POINTS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 ring-1 ring-[#e9c349]/40 flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-[#e9c349]" />
                  </div>
                  <div>
                    <h3 className="font-display text-title-md text-white">{title}</h3>
                    <p className="text-body-sm text-white/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white/5 ring-1 ring-white/10 p-6 md:p-10 rounded-xl space-y-4 backdrop-blur-sm">
              <h3 className="font-display text-headline-sm text-[#e9c349]">From Harvest to Ceremony</h3>
              <div className="w-full bg-primary/60 ring-1 ring-white/10 p-4 rounded-lg">
                <svg className="w-full h-auto" fill="none" viewBox="0 0 400 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three step flow: harvest, cool transit, venue setup">
                  <path className="text-[#e9c349]/50" d="M70 65 H330" stroke="currentColor" strokeDasharray="4 4" strokeWidth="2" />
                  {FLOW_STEPS.map((s) => (
                    <g key={s.num}>
                      <circle className="fill-primary stroke-[#e9c349]" cx={s.x} cy="65" r="22" strokeWidth="2" />
                      <text fill="#e9c349" fontFamily="Playfair Display, Georgia, serif" fontSize="13" fontWeight="500" textAnchor="middle" x={s.x} y="69">{s.num}</text>
                      <text fill="#ffffff" fillOpacity="0.75" fontFamily="Montserrat, system-ui, sans-serif" fontSize="10" textAnchor="middle" x={s.x} y="105">{s.label}</text>
                    </g>
                  ))}
                </svg>
              </div>
              <div className="space-y-1 text-body-sm text-white/70">
                <p><strong>Studio:</strong> Colombo</p>
                <p><strong>Setup:</strong> Completed well ahead of your auspicious (Nekath) times.</p>
              </div>
              <div className="pt-1">
                <a
                  href="#consultation"
                  className="inline-flex items-center justify-center gap-2 w-full btn-gradient text-title-md py-3 rounded-lg"
                >
                  <span>Check Date Availability</span>
                  <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}