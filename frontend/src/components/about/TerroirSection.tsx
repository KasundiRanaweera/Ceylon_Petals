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
    <section className="w-full py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[11px] text-secondary uppercase tracking-widest block">Where Our Flowers Come From</span>
            <h2 className="font-display text-headline-lg text-primary leading-snug">
              Cool highland air makes for slower, sturdier blooms.
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Sri Lanka's central highlands have a rare gift: cool nights and misty mornings even
              this close to the equator. Flowers grown here develop more slowly than in the
              lowland tropics, which tends to mean fuller blooms and better vase life.
            </p>
            <div className="p-6 rounded-xl bg-surface-container space-y-1 mt-4 shadow-sm">
              <div className="flex items-center gap-2 text-primary">
                <Leaf size={20} />
                <span className="text-title-md">Working Directly With Growers</span>
              </div>
              <p className="text-body-sm text-secondary">
                We buy directly from small highland growers rather than through multiple
                middlemen, which helps us keep stems fresher and support fair pricing.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            {REGIONS.map((region) => (
              <div key={region.id} className="flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-56 relative overflow-hidden">
                  <img className="w-full h-full object-cover" src={region.imageUrl} alt={region.title} />
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-display text-headline-sm text-primary mb-1">{region.title}</h3>
                    <p className="text-body-sm text-secondary">{region.subtitle}</p>
                  </div>
                  <div className="pt-4 text-secondary text-[11px]">{region.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}