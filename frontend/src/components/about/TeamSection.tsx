import { Award, Flower2, Leaf, Sprout } from 'lucide-react'

// TODO: these are placeholder team profiles. Replace names, photos and bios
// with the real florists and creative team once the owner provides them.
const TEAM = [
  {
    id: '1',
    name: 'Head Florist',
    role: 'Bouquets & Everyday Arrangements',
    bio: 'Leads the design of our seasonal bouquets and gift arrangements, focused on clean, modern floral styling.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk0dEIHVWeW5dPvCldIXiQ0JW0r-WRJFtTVERxSjjo72pIXp3MQj7dCW_0VthvjhIIBaa1u-fTOR5G6Lhql4_d3WrPM2vyI1rY4dR5pGTDtzBJSDXfEpyIfV4mt83Etf9bJjpFOMOXt47ANcMAhiH4G5kCUyW7iVmO3jjMYkjC1preflAe8zCAKf5Fuj3h5bp-riVHcMdzgvKlznpYZRokH1CS3_hlb5gihAPXnl2QV0X6I2ow2SiDHg=w1408',
    badge: 'Bouquets & Gifting',
  },
  {
    id: '2',
    name: 'Wedding & Events Lead',
    role: 'Poruwa & Ceremony Design',
    bio: 'Specializes in traditional and modern Poruwa florals, bringing together local customs with contemporary styling.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-43xV13C8zFHi87kmn-WGv5PpL7cB27EiKs4FurQT3obzntlIBUgyEUVk6T7xX7WDaJx_tEN35GzOvpXf0ni3GxjCg-JWyUYDDqAYdOgk-NhiqdcskqHULL18AOHNTL8eDKQtpW52lawjV2qNLYNtMNoLeP7R3VrMopudrAQqQbWZq9eMZNdctAZzvD8GhwUPtulqszSnpGRg8K0gfjRwj2mO1ENEg5i7fD0FTzLpABhL1ermPy7dfQ=w1408',
    badge: 'Wedding & Events',
  },
]

const BOTANICALS = [
  { icon: Flower2, name: 'Lotus (Nelum)', desc: 'Offered at the temple on Poya days and used to dress the Poruwa — a symbol of purity.' },
  { icon: Sprout, name: 'Jasmine (Pichcha)', desc: 'Strung by hand into garlands and bridal hair circlets; its scent fills every Poruwa.' },
  { icon: Leaf, name: 'Betel Leaves (Bulath)', desc: 'Offered in a sheaf to elders and guests as a mark of respect, at weddings and at Avurudu.' },
  { icon: Award, name: 'Blue Water Lily (Nil Manel)', desc: "Sri Lanka's national flower — a quiet, graceful bloom for remembrance and offerings." },
]

export default function TeamSection() {
  return (
    <section className="w-full py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-12">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="max-w-2xl">
            <span className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Meet the Team</span>
            <h2 className="mt-3 block font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">The People Behind the Blooms</h2>
          </div>
          <p className="text-[15px] leading-relaxed text-on-surface-variant max-w-xl">
            A small team of florists who care about doing right by every arrangement, from
            everyday bouquets to Poruwa ceremonies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TEAM.map((member) => (
            <div key={member.id} className="group rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] overflow-hidden p-3 transition-shadow hover:shadow-[0_24px_50px_-26px_rgba(48,48,48,0.45)] flex flex-col">
              <div className="h-96 relative overflow-hidden rounded-lg">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" src={member.imageUrl} alt={member.name} />
                <div className="absolute top-4 left-4 bg-primary-fixed text-on-primary-fixed text-[11px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                  {member.badge}
                </div>
              </div>
              <div className="p-5 pt-6 lg:p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-headline-md text-on-surface">{member.name}</h3>
                  <p className="text-label-md text-tertiary mb-2">{member.role}</p>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">{member.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 lg:p-8 rounded-xl bg-surface-container-low ring-1 ring-outline-variant/40">
          {BOTANICALS.map(({ icon: Icon, name, desc }) => (
            <div key={name} className="flex items-start gap-2">
              <Icon size={20} className="text-tertiary mt-0.5 shrink-0" />
              <div>
                <h4 className="font-display text-title-md text-on-surface">{name}</h4>
                <p className="text-body-sm text-on-surface-variant">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}