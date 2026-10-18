import Hero from '../components/home/Hero'
import SignatureBento from '../components/home/SignatureBento'
import ProductCarousel from '../components/home/ProductCarousel'
import CategoryGrid from '../components/home/CategoryGrid'
import FeaturedProducts from '../components/home/FeaturedProducts'
import DeliveryCoverage from '../components/home/DeliveryCoverage'
import HowItWorks from '../components/home/HowItWorks'
import Testimonials from '../components/home/Testimonials'
import CareBanner from '../components/home/CareBanner'
import { Reveal } from '../components/motion/Reveal'

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <SignatureBento />
      <ProductCarousel />
      <Reveal>
        <CategoryGrid />
      </Reveal>
      <Reveal>
        <FeaturedProducts />
      </Reveal>
      <Reveal>
        <DeliveryCoverage />
      </Reveal>
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <Testimonials />
      </Reveal>
      <Reveal>
        <CareBanner />
      </Reveal>
    </div>
  )
}
