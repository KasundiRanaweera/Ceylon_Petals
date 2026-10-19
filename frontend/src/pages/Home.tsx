import Hero from '../components/home/Hero'
import OccasionTiles from '../components/home/OccasionTiles'
import SignatureSeries from '../components/home/SignatureSeries'
import StudioStory from '../components/home/StudioStory'
import LiveFigures from '../components/home/LiveFigures'
import Testimonials from '../components/home/Testimonials'
import DeliveryCoverage from '../components/home/DeliveryCoverage'
import InstagramStrip from '../components/home/InstagramStrip'
import { Reveal } from '../components/motion/Reveal'

// The home page, laid out like the Stitch design: hero, occasions, signature pieces, the studio
// story with live figures, customer voices, delivery check and the Instagram strip.
export default function Home() {
  return (
    <div className="flex w-full flex-col">
      <Hero />
      <OccasionTiles />
      <SignatureSeries />
      <StudioStory />
      <LiveFigures />
      <Testimonials />
      <Reveal>
        <DeliveryCoverage />
      </Reveal>
      <InstagramStrip />
    </div>
  )
}
