import HampersHero from '../components/hampers/HampersHero'
import ProductShowcase from '../components/hampers/ProductShowcase'
import HamperBuilder from '../components/hampers/HamperBuilder'
import CorporateBanner from '../components/hampers/CorporateBanner'
import { Reveal } from '../components/motion/Reveal'

export default function LuxuryHampers() {
  return (
    <div className="flex flex-col w-full">
      <HampersHero />
      <ProductShowcase />
      <Reveal>
        <HamperBuilder />
      </Reveal>
      <Reveal>
        <CorporateBanner />
      </Reveal>
    </div>
  )
}