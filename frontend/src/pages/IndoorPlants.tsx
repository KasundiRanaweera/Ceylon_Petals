import PlantsHero from '../components/plants/PlantsHero'
import PlantCatalog from '../components/plants/PlantCatalog'
import LightDiagnostic from '../components/plants/LightDiagnostic'
import PlantCareBanner from '../components/plants/PlantCareBanner'
import { Reveal } from '../components/motion/Reveal'

export default function IndoorPlants() {
  return (
    <div className="flex flex-col w-full">
      <PlantsHero />
      <PlantCatalog />
      <Reveal>
        <LightDiagnostic />
      </Reveal>
      <Reveal>
        <PlantCareBanner />
      </Reveal>
    </div>
  )
}