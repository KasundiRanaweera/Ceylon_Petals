import AboutHero from '../components/about/AboutHero'
import TerroirSection from '../components/about/TerroirSection'
import SourcingCharter from '../components/about/SourcingCharter'
import ColdChainTimeline from '../components/about/ColdChainTimeline'
import TeamSection from '../components/about/TeamSection'
import VisitSalonSection from '../components/about/VisitSalonSection'
import { Reveal } from '../components/motion/Reveal'

export default function About() {
  return (
    <div className="flex flex-col w-full">
      <AboutHero />
      <Reveal>
        <TerroirSection />
      </Reveal>
      <Reveal>
        <SourcingCharter />
      </Reveal>
      <Reveal>
        <ColdChainTimeline />
      </Reveal>
      <Reveal>
        <TeamSection />
      </Reveal>
      <Reveal>
        <VisitSalonSection />
      </Reveal>
    </div>
  )
}