import { BadgeCheck, PenLine, Clock } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'

const STEPS = [
  {
    number: 1,
    title: 'Choose Fresh Blooms',
    description: 'Select from seasonal roses, lilies, orchids, and celebration hampers prepared fresh every morning.',
    icon: BadgeCheck,
    footer: 'Freshness guaranteed',
  },
  {
    number: 2,
    title: 'Add a Personal Message',
    description: 'Include a handwritten note or a short card message to make every arrangement feel personal and thoughtful.',
    icon: PenLine,
    footer: 'Free custom gift note',
  },
  {
    number: 3,
    title: 'Pick Your Delivery Time',
    description: 'Choose a convenient delivery time for your occasion and enjoy updates from our team until your order arrives.',
    icon: Clock,
    footer: 'Live delivery updates',
  },
]

export default function HowItWorks() {
  return (
    <section className="w-full bg-surface py-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <SectionHeading title="How ordering works" highlight="works" className="mb-12" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {STEPS.map(({ number, title, description, icon: Icon, footer }) => (
            <div key={number} className="flex flex-col border-t border-primary pt-6">
              <span className="text-gradient mb-4 font-display text-6xl italic leading-none">{String(number).padStart(2, '0')}</span>
              <h3 className="mb-2 font-display text-[26px] leading-tight text-primary">{title}</h3>
              <p className="text-body-sm text-secondary leading-relaxed">{description}</p>
              <div className="eyebrow mt-5 flex items-center gap-2 text-tertiary">
                <Icon size={18} /> {footer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
