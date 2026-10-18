import { Snowflake } from 'lucide-react'

// Generalized from the original Stitch design: the original showed a "live IoT sensor"
// with a fake sensor ID and real-time readout, which would be a misleading claim for
// a real flower shop to make. This keeps the same reassuring message and visual style
// as a straightforward freshness guarantee instead of a fabricated live data feed.
export default function FreshnessPromise() {
  return (
    <section className="w-full px-4 lg:px-12 py-14 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="bg-ink-gradient text-on-primary rounded-2xl p-8 lg:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-primary-container blur-2xl" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 bg-on-primary/10 text-tertiary-fixed px-3 py-1 rounded-sm text-[11px] uppercase tracking-wider">
                <Snowflake size={16} />
                Our Freshness Promise
              </div>
              <h2 className="font-display text-headline-lg-mobile lg:text-headline-lg text-on-primary tracking-tight">
                Cold-Chain Care, From Highland Cut to Your Doorstep
              </h2>
              <p className="text-body-md text-inverse-on-surface/90 leading-relaxed">
                Every stem is cut fresh, kept cool during transport, and hydrated with care right up
                until handover — so your flowers arrive looking the way they should.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="bg-on-primary/10 p-3 rounded-xl space-y-1">
                  <span className="text-[11px] text-tertiary-fixed block">Step 01</span>
                  <p className="text-title-md text-on-primary">Cut Fresh Daily</p>
                  <p className="text-body-sm text-inverse-on-surface/80">Sourced each morning from our highland growers</p>
                </div>
                <div className="bg-on-primary/10 p-3 rounded-xl space-y-1">
                  <span className="text-[11px] text-tertiary-fixed block">Step 02</span>
                  <p className="text-title-md text-on-primary">Kept Cool in Transit</p>
                  <p className="text-body-sm text-inverse-on-surface/80">Chilled handling on the journey to Colombo</p>
                </div>
                <div className="bg-on-primary/10 p-3 rounded-xl space-y-1">
                  <span className="text-[11px] text-tertiary-fixed block">Step 03</span>
                  <p className="text-title-md text-on-primary">Hydrated on Delivery</p>
                  <p className="text-body-sm text-inverse-on-surface/80">Stem care so your flowers settle in well at home</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-surface-container-lowest text-on-surface p-4 rounded-2xl shadow-2xl w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-title-md text-primary">7-Day Freshness Guarantee</span>
                </div>
                <div className="py-2 flex flex-col items-center">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle className="text-surface-container" cx="60" cy="60" fill="none" r="50" stroke="currentColor" strokeWidth="8" />
                      <circle
                        className="text-surface-tint"
                        cx="60"
                        cy="60"
                        fill="none"
                        r="50"
                        stroke="currentColor"
                        strokeDasharray="314"
                        strokeDashoffset="30"
                        strokeLinecap="round"
                        strokeWidth="8"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[11px] text-secondary uppercase tracking-wider">Vase Life</span>
                      <span className="font-display text-display-lg text-primary leading-none">7+</span>
                      <span className="text-[11px] text-emerald-700 font-bold mt-1">DAYS GUARANTEED</span>
                    </div>
                  </div>
                  <p className="text-body-sm text-secondary text-center pt-3">
                    Not happy with freshness on arrival? We'll replace it — no questions asked.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}