import { useState } from 'react'
import { Sunrise, Truck, Scissors, DoorOpen } from 'lucide-react'

interface TimelineStep {
  id: number
  icon: typeof Sunrise
  time: string
  label: string
  tag: string
  title: string
  description: string
  stat1Label: string
  stat1Value: string
  stat2Label: string
  stat2Value: string
  imageUrl: string
  imageCaption: string
}

const STEPS: TimelineStep[] = [
  {
    id: 0, icon: Sunrise, time: 'Early Morning', label: 'Highland Harvest',
    tag: 'HARVEST', title: 'Early Hand-Harvest in the Highlands',
    description:
      "Stems are cut early, while it's cool and the plants are well hydrated. They're placed in water right away to seal the cut and keep them fresh for the journey.",
    stat1Label: 'Harvest Time', stat1Value: 'Early Morning',
    stat2Label: 'Post-Cut Care', stat2Value: 'Immediate Hydration',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByYR6Z0imMMYt82L9LK-wGOElBMLbuVxAURK_jXN5kOU5LhgoyYF7ogjzqSZvaccDhycA3pAlXeHGXGqsg6rBY0j1VtMIrmZCuzy7qmYi4txSJOG2Q01G8PrYW2a1U5ZToGKUDOmOhHju6j_-1z1QWZH3IqJrPii-SHz-gRO99-2DVrgZ6eObwPUpOwqufYCOUlaDku1yM-YGq7q_Go6NUNb601oY9EeYYKSqxGT8Ne-rdUQoGos-hrg=w1408',
    imageCaption: 'Cut fresh in the highlands each morning',
  },
  {
    id: 1, icon: Truck, time: 'Morning', label: 'Cool Transit',
    tag: 'TRANSIT', title: 'Temperature-Conscious Transport to Colombo',
    description:
      "Stems travel down to Colombo in cooled, insulated transport, kept out of direct heat and sunlight for the journey from the hills to our studio.",
    stat1Label: 'Transit Conditions', stat1Value: 'Cool & Shaded',
    stat2Label: 'Handling', stat2Value: 'Minimal Movement',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfEZqb2rdYT4qfGPZRsWQ5iDVPOIlF_jALfnqg4VwbWA_oB2uthdliMNCr6QA7mOdmlhfCl6Bdn8_5Ex6HiNw6xY0oQthmh9EYZl9gQoshKe-qiajs3OrkhO1x2EBkPjdW40m5LMljcSANV3Jk89CnVgTdykF_tbsXw31IFUDgC_RnW5jaN5Sbn8W5q3pQgwb7DKtP6KjJ3lepFLuHYc6e2mosvAcj7a3omEE7paKtMEuexyGOjNOAJA=w1408',
    imageCaption: 'Cooled transport from hills to city',
  },
  {
    id: 2, icon: Scissors, time: 'Late Morning', label: 'Studio Artistry',
    tag: 'CRAFTSMANSHIP', title: 'Arranged at Our Colombo Studio',
    description:
      'Each stem is re-cut underwater and conditioned before our florists hand-select and arrange blooms, finishing every piece with quality ribbon and packaging.',
    stat1Label: 'Technique', stat1Value: 'Underwater Re-Cut',
    stat2Label: 'Finishing', stat2Value: 'Hand-Tied & Wrapped',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByYR6Z0imMMYt82L9LK-wGOElBMLbuVxAURK_jXN5kOU5LhgoyYF7ogjzqSZvaccDhycA3pAlXeHGXGqsg6rBY0j1VtMIrmZCuzy7qmYi4txSJOG2Q01G8PrYW2a1U5ZToGKUDOmOhHju6j_-1z1QWZH3IqJrPii-SHz-gRO99-2DVrgZ6eObwPUpOwqufYCOUlaDku1yM-YGq7q_Go6NUNb601oY9EeYYKSqxGT8Ne-rdUQoGos-hrg=w1408',
    imageCaption: 'Arranged fresh at our Colombo studio',
  },
  {
    id: 3, icon: DoorOpen, time: 'Afternoon', label: 'Careful Handover',
    tag: 'DELIVERY', title: 'Careful Delivery Across Colombo',
    description:
      'Finished arrangements are delivered by our own couriers across Colombo and nearby suburbs, handed over directly rather than left unattended where possible.',
    stat1Label: 'Delivery Style', stat1Value: 'Direct Handover',
    stat2Label: 'Coverage', stat2Value: 'Colombo & Suburbs',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfEZqb2rdYT4qfGPZRsWQ5iDVPOIlF_jALfnqg4VwbWA_oB2uthdliMNCr6QA7mOdmlhfCl6Bdn8_5Ex6HiNw6xY0oQthmh9EYZl9gQoshKe-qiajs3OrkhO1x2EBkPjdW40m5LMljcSANV3Jk89CnVgTdykF_tbsXw31IFUDgC_RnW5jaN5Sbn8W5q3pQgwb7DKtP6KjJ3lepFLuHYc6e2mosvAcj7a3omEE7paKtMEuexyGOjNOAJA=w1408',
    imageCaption: 'Delivered fresh across Colombo',
  },
]

export default function ColdChainTimeline() {
  const [activeId, setActiveId] = useState(0)
  const active = STEPS.find((s) => s.id === activeId)!

  return (
    <section className="w-full py-20 lg:py-28 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <span className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">From Farm to Doorstep</span>
          <h2 className="mt-3 block font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">How We Keep Flowers Fresh</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-on-surface-variant">
            A same-day journey from the highlands to your table, designed around freshness at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {STEPS.map((step) => {
            const Icon = step.icon
            const isActive = step.id === activeId
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveId(step.id)}
                className={`text-left p-4 rounded-xl transition-all flex flex-col justify-between h-32 ring-1 ${
                  isActive ? 'bg-surface-container-lowest ring-2 ring-[#d4af37] shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)]' : 'bg-surface-container-lowest/60 ring-outline-variant/40 hover:bg-surface-container-lowest'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] ${isActive ? 'text-tertiary' : 'text-on-surface-variant'}`}>STEP 0{step.id + 1}</span>
                  <Icon size={20} className={isActive ? 'text-tertiary' : 'text-on-surface-variant'} />
                </div>
                <div>
                  <p className="font-display text-title-md text-on-surface">{step.time}</p>
                  <p className="text-body-sm text-on-surface-variant truncate">{step.label}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-8 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed">
                <span className="text-[11px] font-bold">{active.tag}</span>
              </div>
              <h3 className="font-display text-headline-lg text-on-surface leading-tight">{active.title}</h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">{active.description}</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-surface-container-low ring-1 ring-outline-variant/40">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-tertiary block">{active.stat1Label}</span>
                  <span className="font-display text-title-md text-on-surface">{active.stat1Value}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low ring-1 ring-outline-variant/40">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-tertiary block">{active.stat2Label}</span>
                  <span className="font-display text-title-md text-on-surface">{active.stat2Value}</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="group relative h-80 lg:h-96 rounded-xl overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" src={active.imageUrl} alt={active.title} />
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-ink/80 backdrop-blur-md rounded-lg text-white text-[11px]">
                  {active.imageCaption}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}