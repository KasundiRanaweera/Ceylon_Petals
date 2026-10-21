import { useCallback, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import Hero from '../components/home/Hero'
import ProductMarquee from '../components/home/ProductMarquee'
import CategoryShowcase from '../components/home/CategoryShowcase'
import IntroSplash from '../components/home/IntroSplash'
import { shouldShowIntro } from '../lib/intro'
import OccasionTiles from '../components/home/OccasionTiles'
import SignatureSeries from '../components/home/SignatureSeries'
import StudioStory from '../components/home/StudioStory'
import LiveFigures from '../components/home/LiveFigures'
import Testimonials from '../components/home/Testimonials'
import DeliveryCoverage from '../components/home/DeliveryCoverage'
import InstagramStrip from '../components/home/InstagramStrip'
import GiftCards from '../components/home/GiftCards'
import { Reveal } from '../components/motion/Reveal'

// The home page: the opening screen (first visit of a session only), the hero, every product in an
// auto-scrolling row, the main categories, occasions, featured pieces, the studio story with live
// figures, customer reviews, delivery check, the Instagram strip and the gift cards.
export default function Home() {
  const [introDone, setIntroDone] = useState(() => !shouldShowIntro())
  const finishIntro = useCallback(() => setIntroDone(true), [])

  return (
    <div className="flex w-full flex-col">
      <AnimatePresence>{!introDone && <IntroSplash key="intro" onDone={finishIntro} />}</AnimatePresence>
      <Hero ready={introDone} />
      <ProductMarquee />
      <CategoryShowcase />
      <OccasionTiles />
      <SignatureSeries />
      <StudioStory />
      <LiveFigures />
      <Testimonials />
      <Reveal>
        <DeliveryCoverage />
      </Reveal>
      <InstagramStrip />
      <GiftCards />
    </div>
  )
}
