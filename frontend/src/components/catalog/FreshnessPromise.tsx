import { Snowflake } from 'lucide-react'

// Generalized from the original Stitch design: the original showed a "live IoT sensor"
// with a fake sensor ID and real-time readout, which would be a misleading claim for
// a real flower shop to make. This keeps the same reassuring message and visual style
// as a straightforward freshness guarantee instead of a fabricated live data feed.
export default function FreshnessPromise() {
  return (
    <section className="w-full px-4 lg:px-12 py-20 lg:py-28 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="bg-ink-gradient text-on-primary rounded-xl p-8 lg:p-14 shadow-[0_30px_60px_-30px_rgba(48,48,48,0.6)] relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-[#d4af37]/10 blur-2xl" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-[11px] uppercase tracking-[0.22em] text-[#e9c349] ring-1 ring-[#e9c349]/30">
                <Snowflake size={16} />
                Our Freshness Promise
              </div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-white">
                Cold-Chain Care, From Highland Cut to Your Doorstep
              </h2>
              <p className="text-[15px] text-white/70 leading-relaxed">
                Every stem is cut fresh, kept cool during transport, and hydrated with care right up
                until handover — so your flowers arrive looking the way they should.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="bg-white/5 ring-1 ring-white/10 p-4 rounded-lg space-y-1">
                  <span className="font-display text-[13px] text-[#e9c349] block">Step 01</span>
                  <p className="text-title-md text-white">Cut Fresh Daily</p>
                  <p className="text-body-sm text-white/70">Sourced each morning from our highland growers</p>
                </div>
                <div className="bg-white/5 ring-1 ring-white/10 p-4 rounded-lg space-y-1">
                  <span className="font-display text-[13px] text-[#e9c349] block">Step 02</span>
                  <p className="text-title-md text-white">Kept Cool in Transit</p>
                  <p className="text-body-sm text-white/70">Chilled handling on the journey to Colombo</p>
                </div>
                <div className="bg-white/5 ring-1 ring-white/10 p-4 rounded-lg space-y-1">
                  <span className="font-display text-[13px] text-[#e9c349] block">Step 03</span>
                  <p className="text-title-md text-white">Hydrated on Delivery</p>
                  <p className="text-body-sm text-white/70">Stem care so your flowers settle in well at home</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-surface-container-lowest text-on-surface p-6 rounded-xl ring-1 ring-white/10 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)] w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-title-md text-on-surface">7-Day Freshness Guarantee</span>
                </div>
                <div className="py-2 flex flex-col items-center">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle className="text-surface-container" cx="60" cy="60" fill="none" r="50" stroke="currentColor" strokeWidth="8" />
                      <circle
                        className="text-[#d4af37]"
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
                      <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Vase Life</span>
                      <span className="font-display text-display-lg text-tertiary leading-none">7+</span>
                      <span className="text-[11px] text-tertiary font-semibold tracking-[0.14em] mt-1">DAYS GUARANTEED</span>
                    </div>
                  </div>
                  <p className="text-body-sm text-on-surface-variant text-center pt-3">
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