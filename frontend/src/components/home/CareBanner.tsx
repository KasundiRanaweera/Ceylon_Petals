import { Droplet, Scissors, Snowflake, FlaskConical, Headset } from 'lucide-react'
import { useWhatsApp } from '../../hooks/useShop'

export default function CareBanner() {
  const whatsapp = useWhatsApp()
  const link = whatsapp("Hello! I'd like some advice on caring for my flowers.")

  return (
    <section className="w-full py-14 bg-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="bg-primary-container text-on-primary rounded-2xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-tertiary-fixed text-[11px] uppercase tracking-wider mb-2">
              <Droplet size={18} />
              <span>Floral Care Concierge</span>
            </div>
            <h2 className="font-display text-headline-lg text-white mb-3">
              How to keep fresh flowers looking beautiful for longer
            </h2>
            <p className="text-body-md text-on-primary-container mb-6 leading-relaxed">
              Sri Lanka’s tropical climate can warm blooms quickly, so trim the stems at a 45-degree angle,
              place them in clean water, and keep them away from direct afternoon sun. Our complimentary
              flower care sachet helps every arrangement stay fresh for longer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-primary/50 p-3 rounded-lg backdrop-blur-sm">
                <Scissors className="text-tertiary-fixed mb-1" size={20} />
                <p className="text-title-md text-white">Trim Daily</p>
                <p className="text-body-sm text-on-primary-container">Snip 1cm diagonally</p>
              </div>
              <div className="bg-primary/50 p-3 rounded-lg backdrop-blur-sm">
                <Snowflake className="text-tertiary-fixed mb-1" size={20} />
                <p className="text-title-md text-white">Cool Interior</p>
                <p className="text-body-sm text-on-primary-container">Keep away from A/C draft</p>
              </div>
              <div className="bg-primary/50 p-3 rounded-lg backdrop-blur-sm">
                <FlaskConical className="text-tertiary-fixed mb-1" size={20} />
                <p className="text-title-md text-white">Flora Nutrient</p>
                <p className="text-body-sm text-on-primary-container">Free sachets included</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-tertiary-container hover:bg-tertiary-fixed text-on-tertiary-container text-title-md rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <Headset size={20} />
                <span>Ask a Master Florist</span>
              </a>
              <span className="text-body-sm text-on-primary-container">Available 8:00 AM – 9:00 PM Daily</span>
            </div>
          </div>
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full">
            <img
              className="w-full h-full object-cover"
              alt="Artisan florist trimming rose stems in a Colombo salon"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBniQRGdwXWnArawnX9GlWFoqEVMGcjuKxJk6eN4rWcUBB4TRo8n0juq9henCQ08PvnXhH86dneWgI5yv9ZV7X6QHDMFfWjvFFX1IOxzvn6-cx3VsGtlb32CQI6VgpWa6A-ViS6QXKRl65tTvagIbfZib8wQXvtPFy6BoKm1z9DVs1NOYEYbjo4KQxs-ROUfsM7wdA9I_U9gW1bQoQ68iPdxH-8O8qnnn0j1GxOWn9TRk8-c4DeuSStrA=w1408"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
