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
    <section className="w-full py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-1">
            <span className="text-[11px] text-secondary uppercase tracking-widest">Meet the Team</span>
            <h2 className="font-display text-headline-lg text-primary">The People Behind the Blooms</h2>
          </div>
          <p className="text-body-sm text-secondary max-w-md">
            A small team of florists who care about doing right by every arrangement, from
            everyday bouquets to Poruwa ceremonies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TEAM.map((member) => (
            <div key={member.id} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-96 relative overflow-hidden">
                <img className="w-full h-full object-cover" src={member.imageUrl} alt={member.name} />
                <div className="absolute top-4 left-4 bg-primary text-on-primary text-[11px] px-3 py-0.5 rounded uppercase tracking-wider">
                  {member.badge}
                </div>
              </div>
              <div className="p-8 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-headline-md text-primary">{member.name}</h3>
                  <p className="text-label-md text-tertiary mb-2">{member.role}</p>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">{member.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-xl bg-surface-container">
          {BOTANICALS.map(({ icon: Icon, name, desc }) => (
            <div key={name} className="flex items-start gap-2">
              <Icon size={20} className="text-primary mt-0.5" />
              <div>
                <h4 className="text-title-md text-primary">{name}</h4>
                <p className="text-body-sm text-secondary">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}