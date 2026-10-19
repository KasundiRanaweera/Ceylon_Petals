import type { Occasion, OccasionSlug } from '../types'

// The occasions customers shop by. They match the Occasion rows in the database (backend seed
// data/catalog.json), so pages can show names and filters before the API answers.
export const OCCASIONS: Occasion[] = [
  { slug: 'anniversary', name: 'Anniversary', description: 'Rose cascades and keepsake boxes for the years you have shared.' },
  { slug: 'birthday', name: 'Birthday', description: 'Bright, cheerful colour and treats to make their day.' },
  { slug: 'love', name: 'Love & Romance', description: 'Red roses and soft pastels to say what words cannot.' },
  { slug: 'wedding', name: 'Wedding & Poruwa', description: 'Auspicious arrangements for Poruwa ceremonies and receptions.' },
  { slug: 'sympathy', name: 'Sympathy & Condolence', description: 'Quiet white lilies and tributes, delivered with discretion.' },
  { slug: 'get-well', name: 'Get Well Soon', description: 'Gentle blooms and plants to lift their spirits.' },
  { slug: 'congratulations', name: 'Congratulations', description: 'For promotions, graduations and new beginnings.' },
  { slug: 'corporate', name: 'Corporate Gifting', description: 'Hampers and arrangements for clients, teams and events.' },
]

export const OCCASION_NAME = Object.fromEntries(OCCASIONS.map((o) => [o.slug, o.name])) as Record<OccasionSlug, string>
