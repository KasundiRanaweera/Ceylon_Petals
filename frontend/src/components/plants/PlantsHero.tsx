import { Leaf, Wind, Droplet, Headset, ArrowRight } from 'lucide-react'
import PageHero from '../ui/PageHero'
import { PRODUCT_IMAGES } from '../../data/productImages'

export default function PlantsHero() {
  return (
    <PageHero
      breadcrumbs={[{ label: 'Shop', to: '/shop' }, { label: 'Indoor Plants' }]}
      eyebrow="Living greenery"
      eyebrowIcon={Leaf}
      title="Curated foliage & sculptural indoor plants"
      highlight="sculptural indoor plants"
      subtitle="Healthy plants acclimatised for Colombo homes and offices, potted in hand-thrown Sri Lankan ceramic and terracotta."
      actions={
        <a href="#plantsGrid" className="btn-gradient inline-flex items-center gap-3 px-7 py-4">
          Browse plants <ArrowRight size={16} />
        </a>
      }
      badges={[
        { icon: Wind, label: 'Air-purifying varieties' },
        { icon: Droplet, label: 'Ready for Colombo humidity' },
        { icon: Headset, label: 'Free plant-care help' },
      ]}
      image={{
        src: PRODUCT_IMAGES['monstera-deliciosa-sovereign'],
        alt: 'Monstera plant in a glazed ceramic pot',
        caption: { eyebrow: 'Statement green', title: 'Monstera Deliciosa', text: 'Trained on a moss pole' },
      }}
    />
  )
}
