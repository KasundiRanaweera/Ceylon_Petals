import type { Testimonial } from '../types'

// Customer reviews shown on the home page (the hero's review card and the reviews section).
// TODO (later phase): replace with GET /api/testimonials once the Testimonial table has real data
export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Dilshan Karunaratne',
    location: 'Colombo 05, Sri Lanka',
    rating: 5,
    message: "The WhatsApp concierge made the whole order effortless for my mother’s birthday in Colombo 05. The roses arrived fresh, beautifully arranged, and lasted beautifully for over a week.",
    orderedItem: "Ordered 'Nuwara Eliya Crimson Empress'",
    initials: 'DK',
  },
  {
    id: '2',
    name: 'Ananya Perera',
    location: 'Cinnamon Gardens, Colombo',
    rating: 5,
    message: 'This flower studio feels premium and personal from start to finish. The lilies arrived smelling incredible and the handwritten card made the gift feel extra special.',
    orderedItem: "Ordered 'Casablanca Pure Ivory Lilies'",
    initials: 'AP',
  },
  {
    id: '3',
    name: 'Rukshan Fernando',
    location: 'Battaramulla, Sri Lanka',
    rating: 5,
    message: 'We ordered a gourmet hamper for a graduation celebration and the delivery was perfectly on time. The packaging and presentation were elegant and very Sri Lankan in style.',
    orderedItem: "Ordered 'Highland Rose & Tea Hamper'",
    initials: 'RF',
  },
]

/** The average star rating across the reviews above, e.g. "5.0". */
export const AVERAGE_RATING = (TESTIMONIALS.reduce((sum, t) => sum + t.rating, 0) / TESTIMONIALS.length).toFixed(1)
