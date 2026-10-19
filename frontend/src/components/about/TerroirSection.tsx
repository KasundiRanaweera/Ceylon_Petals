import { Leaf } from 'lucide-react'

const REGIONS = [
  {
    id: 'nuwara-eliya',
    title: 'Nuwara Eliya Highlands',
    subtitle: 'Garden Roses & Hydrangeas',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9JsU3dPZg4M1CbBLtbc_0ng47CsEd6l5GAGgnm2uj4CW2Ibh0Yw0SuRFLYhqOCCqzuTZpA7MZQVpNdegNzNulQVgU2n2O9oawruMxJp_NWgaiWQDhgXVg5-7sdcw52o4n059VK06sVLyWEGRZupHhiBBgMxNrLePbOrW-7sAColkX5sWdA1qsoAjICJ4YUowaKUFRbfdE3Vdn0tir41VwRUpPqSTWVqazrgmCRr2sijqBQYLOtJfeVg=w1408',
    note: 'Above 1,800m elevation',
  },
  {
    id: 'central-hills',
    title: 'Central Hill Country',
    subtitle: 'Lilies, Delphiniums & Gypsophila',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ-AGujDVxbMItxy4ilwCLqw-sOU6nCvG47-xuSCcBAzuQ-9aK98y9ya8g0L9M1JyDWxMBUT489clygkdAi45kCPBxv7PSBwaRgAVYI2m51JX_6Sr0N5v4-rrJMkFH-XW2Rum4dAhfl758z2M3ybZpftafs3Rzou9WK0cvbjPJQUfwaGwqkHdcx44i7pUUuB0u7EvdKJaGSaPvVNVTFY3odabCdNqSRN7CyZUGA7KTuL6TIZ1vQActgw=w1408',
    note: 'Cool nights, mist-fed valleys',
  },
  {
    id: 'foothills',
    title: 'Hill Country Foothills',
    subtitle: 'Orchids, Jasmine & Rare Ferns',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY_cZ5Y98f_JpQUv8O78v1LmnhoHUBuxZtXEXN0C6kjFaEIk5KVRSKXtuaLZs_ER9ZIcI-AuW07GR5vezV3dlbRuqwhdTEeoUBunzRORE16H53yG4XV-D5bn8z58Dfk7veWVwOtkKJWrlmtmmAbp7BIJPl_3ena9iMxRDs_kKOpMqV88ohG0Es_qAuRvxElPpYlX-pJJzW7Wx70gsHG_5fpTB9_anFuwCFVrpbuplKkMDFSrMNarUBFw=w1408',
    note: 'Warm, humid microclimate',
  },
]

export default function TerroirSection() {
  return (
    <section className="w-full py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary block">Where Our Flowers Come From</span>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
              Cool highland air makes for slower, sturdier blooms.
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Sri Lanka's central highlands have a rare gift: cool nights and misty mornings even
              this close to the equator. Flowers grown here develop more slowly than in the
              lowland tropics, which tends to mean fuller blooms and better vase life.
            </p>
            <div className="p-6 rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] space-y-1 mt-4">
              <div className="flex items-center gap-2 text-on-surface [&>svg]:text-tertiary">
                <Leaf size={20} />
                <span className="text-title-md">Working Directly With Growers</span>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                We buy directly from small highland growers rather than through multiple
                middlemen, which helps us keep stems fresher and support fair pricing.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            {REGIONS.map((region) => (
              <div key={region.id} className="group flex flex-col rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] overflow-hidden p-2 transition-shadow hover:shadow-[0_24px_50px_-26px_rgba(48,48,48,0.45)]">
                <div className="h-56 relative overflow-hidden rounded-lg">
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" src={region.imageUrl} alt={region.title} />
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-display text-headline-sm text-on-surface mb-1">{region.title}</h3>
                    <p className="text-body-sm text-on-surface-variant">{region.subtitle}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/50 text-tertiary text-[11px] uppercase tracking-[0.14em]">{region.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}