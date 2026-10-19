import { Handshake, Wallet, Leaf } from 'lucide-react'

export default function SourcingCharter() {
  return (
    <section className="w-full pb-20 lg:pb-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="bg-surface-container-low rounded-xl ring-1 ring-outline-variant/40 p-8 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-2 text-tertiary">
                <Handshake size={20} />
                <span className="text-[13px] font-medium uppercase tracking-[0.22em]">Our Sourcing Commitment</span>
              </div>
              <h3 className="font-display text-headline-md text-on-surface">
                Supporting the Growers Behind Every Stem
              </h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                We try to buy directly from small growers and cooperatives in the highlands
                rather than going through multiple brokers. It means fresher flowers for you,
                and fairer, more direct payment for the people who grow them.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-tertiary uppercase tracking-[0.14em]">Direct Sourcing</span>
                  <p className="font-display text-title-md text-on-surface">Fewer Middlemen</p>
                </div>
                <Wallet size={28} className="text-tertiary" />
              </div>
              <div className="p-4 rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-tertiary uppercase tracking-[0.14em]">Growing Practices</span>
                  <p className="font-display text-title-md text-on-surface">Low-Impact Methods</p>
                </div>
                <Leaf size={28} className="text-tertiary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}