import { useState } from 'react'
import { Snowflake, Umbrella, Sun, Briefcase, Droplet, ShowerHead, Recycle, ThumbsUp, ArrowRight, CheckCircle2 } from 'lucide-react'

interface SpaceOption {
  id: string
  icon: typeof Snowflake
  title: string
  subtitle: string
  tag: string
  description: string
  water: string
  misting: string
  medium: string
  match: string
}

const SPACE_OPTIONS: SpaceOption[] = [
  {
    id: 'ac-living', icon: Snowflake,
    title: 'Air-Conditioned Living Room', subtitle: 'Dry continuous airflow, moderate indirect window exposure.',
    tag: 'Higher Dehydration Risk',
    description: 'Air conditioning lowers relative humidity quickly, sometimes down to 40%. Leaf edges can dry out even while the soil below stays damp.',
    water: 'Every 6 - 8 Days', misting: '3x Weekly', medium: 'Coir & Pumice Mix',
    match: 'Monstera Deliciosa or Golden Pothos',
  },
  {
    id: 'shaded-verandah', icon: Umbrella,
    title: 'Shaded Verandah', subtitle: 'High coastal humidity (75%+), soft ambient natural breeze.',
    tag: 'High Natural Humidity',
    description: 'Warm coastal air speeds up water loss through the leaves. Plenty of indirect light means faster growth, so good root drainage matters.',
    water: 'Every 3 - 4 Days', misting: 'Optional / Weekly', medium: 'Well-Draining Clay Mix',
    match: 'Highland Cloud Fern or Calathea',
  },
  {
    id: 'bright-master', icon: Sun,
    title: 'Bright Room with Large Windows', subtitle: 'Strong morning sun through floor-to-ceiling glass.',
    tag: 'Direct Heat Exposure',
    description: 'Strong morning sun can scorch tender leaves. Varieties here need deeper root reserves and pots that resist heat absorption.',
    water: 'Every 4 - 5 Days', misting: 'Twice Weekly', medium: 'Coarse Bark & Coir',
    match: 'Ficus Lyrata Specimen Tree',
  },
  {
    id: 'executive-desk', icon: Briefcase,
    title: 'Office Desk or Shelving', subtitle: 'Filtered LED lighting, compact footprints, minimal watering.',
    tag: 'Low Light, Low Thirst',
    description: 'Limited light means a slower metabolism for the plant, so it needs less water and is more sensitive to overwatering.',
    water: 'Every 10 - 12 Days', misting: '1x Weekly', medium: 'Sterile Fine Coir',
    match: 'Dendrobium Orchid or Pothos',
  },
]

export default function LightDiagnostic() {
  const [activeId, setActiveId] = useState('ac-living')
  const active = SPACE_OPTIONS.find((s) => s.id === activeId)!

  return (
    <section className="bg-surface-container-low px-4 lg:px-12 py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="max-w-3xl space-y-1">
          <span className="text-[11px] text-secondary uppercase tracking-widest">Plant Care Guide</span>
          <h2 className="font-display text-headline-lg text-primary">Find the Right Plant for Your Space</h2>
          <p className="text-body-md text-secondary">
            Colombo's warm, humid climate calls for the right watering routine for each spot in your
            home. Pick your space below to see suggested care and a good plant match.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            {SPACE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isActive = opt.id === activeId
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActiveId(opt.id)}
                  className={`w-full text-left p-4 rounded-xl bg-surface-container-lowest shadow-sm transition-all flex items-start gap-4 border-2 ${
                    isActive ? 'border-primary' : 'border-transparent hover:bg-surface-container'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${isActive ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-primary'}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-title-md text-primary font-semibold">{opt.title}</h4>
                      {isActive && <CheckCircle2 size={20} className="text-primary" />}
                    </div>
                    <p className="text-body-sm text-secondary">{opt.subtitle}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-md h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-secondary">Care Profile</span>
                  <span className="px-3 py-1 rounded-sm bg-primary/10 text-label-md text-primary font-semibold">{active.tag}</span>
                </div>
                <div>
                  <h3 className="font-display text-headline-md text-primary">{active.title}</h3>
                  <p className="text-body-md text-secondary mt-1">{active.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 rounded-lg bg-surface-container-low space-y-1">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Droplet size={20} />
                      <span className="text-[11px] uppercase font-semibold">Watering</span>
                    </div>
                    <div className="font-display text-headline-sm text-primary font-semibold">{active.water}</div>
                    <p className="text-body-sm text-secondary">Let the top layer dry before watering thoroughly.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-container-low space-y-1">
                    <div className="flex items-center gap-1.5 text-primary">
                      <ShowerHead size={20} />
                      <span className="text-[11px] uppercase font-semibold">Misting</span>
                    </div>
                    <div className="font-display text-headline-sm text-primary font-semibold">{active.misting}</div>
                    <p className="text-body-sm text-secondary">Mist in the morning for best results.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-container-low space-y-1">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Recycle size={20} />
                      <span className="text-[11px] uppercase font-semibold">Potting Mix</span>
                    </div>
                    <div className="font-display text-headline-sm text-primary font-semibold">{active.medium}</div>
                    <p className="text-body-sm text-secondary">A well-aerated mix prevents root rot.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <ThumbsUp size={20} className="text-primary" />
                  <span className="text-body-sm text-on-surface"><strong>Good match:</strong> {active.match}</span>
                </div>
                <a href="#plantsGrid" className="text-label-md text-primary hover:underline font-semibold flex items-center gap-1">
                  View matched plants <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}