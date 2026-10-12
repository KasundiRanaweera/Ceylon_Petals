import { ShieldCheck } from 'lucide-react'

interface Specialty {
  id: string
  tag: string
  index: string
  title: string
  description: string
  imageUrl: string
  imageCaption: string
  span: string
}

const SPECIALTIES: Specialty[] = [
  {
    id: 'poruwa',
    tag: 'Ceremonial Design',
    index: '01 / Signature',
    title: 'Traditional & Modern Poruwa Floral Mandaps',
    description:
      'We create Poruwa platforms that honour traditional Sinhala and Tamil customs while elevating their visual impact — dressed with fresh lotuses, cascading orchids, braided jasmine garlands, and ceremonial Pun Kalas toppers.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5Q4aqW-ew5uLrir3Dy2_I1ZA7AE5TUICN1mQ7E1b1IlKXJACHRy5ig3RYiPSrKdDf0_LVNksYNEyGL26PrhF17mteCNLvnZeEjYwRr3mKPPEVF6DuA2ONJW9d_4kqPfIcpAhSIr4PFU145LZsLVCp6QLZvhakAnYBGONqp5EYn0d0C7fnuwdeH8Z0Gm8_WBRgeicgeo1LY8DBDKV8Or1XDHzfq1CNGriKRI1tYp-_efCLbr1MkC1L_g=w1408',
    imageCaption: 'Custom timber frame with fresh floral dressing',
    span: 'lg:col-span-7',
  },
  {
    id: 'bridal',
    tag: 'Bridal Florals',
    index: '02 / Adornment',
    title: 'Bridal Bouquets & Floral Jewellery',
    description:
      'Hand-tied bouquets, organic cascades, and fresh-flower jewellery including jasmine (Pichcha) hair circlets, wrist corsages, and traditional floral arrangements for the bridal party.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQTEagWelwt_Trt9342FrfDE8V8Cxo_H5NkvTWUN0qnFQykzc_S32qHeJ-gkWOz_hjNEc_VUUtQSS8nOK8hOTyaBVuj2BwTdsNs36Mo-w_UlwXfRLzI1l41CIPXvQjCwtBnEyMDyrhXk1cXrotGztnIqtixDZMMvdYbao6CZSWWi8wGUbF1NcFyQVT671xPRjjr1YmBnd8I--LNjX7DDV8XmbXnwFTXMzff-i9jiQyJi5Zg8MO8mtnZg=w1408',
    imageCaption: 'Scented jasmine & imported stems',
    span: 'lg:col-span-5',
  },
  {
    id: 'tablescape',
    tag: 'Reception Styling',
    index: '03 / Dining',
    title: 'Reception Tablescapes & Centerpieces',
    description:
      'Garden roses, textured ferns, elevated pedestals, and candlelit arrangements that create a warm, atmospheric setting without blocking conversation across the table.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvGd2P6Gl2BiOxWLjrXCPCvhl0eeq0Bf3f80mHnEBYQ3pc01MALOW5RFezfQI481Y7TrCSh8BA8pHhIllkApDAVbDtDrEYph8p0TazRVvFqQMq5XFBzhPcgmSIXAbXUT0jDI-LZPzVt6oW9VFkpKFJfKaQv_kcR69ByeqXhA30oNFqRPuZw-Sykype6jhHjceUDhNxOg-agmpqBNmTF47dY5sBrE7CDm1F4UT6hYnWqbC59vm_W-BvPQ=w1408',
    imageCaption: 'Ambient candlelight & elevated florals',
    span: 'lg:col-span-5',
  },
  {
    id: 'aisle',
    tag: 'Island Destinations',
    index: '04 / Ensembles',
    title: 'Settee Backs & Church Aisles',
    description:
      'Tailored backdrops for couple portraits and aisle installations. We serve destination weddings island-wide — from Galle Fort and Kandy to Nuwara Eliya, Bentota beach villas, and Colombo ballrooms.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkp0p71R6mh7XkXkEhzniGf1nlzjBGlSascXCUFV6hqeWu_mX0fDJHz26za2-7o22nRghrZQWKZl6bAKBuN73CgBtiRPBRGiZya2y-IoXP8q2KEw1RpRTtVIxkPuCO_WVmNlp_fpuxxmqVPZuhvCLdEvYGcZ_qj4j8Fow2TXJkz8mxuyJ8bT4W4OgoTkZJfF4tH0MAj805dZgcIxl_jrxG5UqLexH-tbqjHGkUEUO2yaadqy_St1uLKw=w1408',
    imageCaption: 'Serving Colombo, Galle, Kandy & beyond',
    span: 'lg:col-span-7',
  },
]

export default function ServiceBento() {
  return (
    <section className="w-full bg-surface py-14 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-1 max-w-2xl">
            <span className="text-[11px] uppercase tracking-widest text-surface-tint font-bold">Our Services</span>
            <h2 className="font-display text-headline-lg lg:text-display-lg text-primary">Sacred Structures &amp; Floral Curation</h2>
            <p className="text-body-md text-secondary">
              Every commission is custom-designed in our Colombo studio, using fresh varieties sourced
              from Sri Lanka's highland growers.
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary text-title-md">
            <ShieldCheck size={22} className="text-tertiary" />
            <span>Careful Islandwide Setup</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {SPECIALTIES.map((s) => (
            <div
              key={s.id}
              className={`${s.span} bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-surface-container px-3 py-0.5 rounded-sm text-[11px] uppercase tracking-widest text-primary">{s.tag}</span>
                  <span className="text-[11px] text-secondary">{s.index}</span>
                </div>
                <h3 className="font-display text-headline-md text-primary">{s.title}</h3>
                <p className="text-body-md text-secondary leading-relaxed">{s.description}</p>
              </div>
              <div className="mt-6 rounded-lg overflow-hidden h-72 relative">
                <img className="w-full h-full object-cover" src={s.imageUrl} alt={s.title} />
                <div className="absolute bottom-3 left-3 bg-primary/80 backdrop-blur-sm text-on-primary px-3 py-1 rounded text-[11px]">
                  {s.imageCaption}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}