// Product photos from Wikimedia Commons. Most are Unsplash photos released as CC0 (no credit
// needed, but we credit the photographer anyway); the CC BY-SA ones must be credited, so the
// product page shows this line under the photo. The files are resized to WebP and served from
// /public/images/products rather than hotlinked.

export interface PhotoCredit {
  author: string
  license: string
  licenseUrl: string
  source: string
}

const CC0 = { license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }
const BY_SA_4 = { license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }
const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const PHOTO_CREDITS: Record<string, PhotoCredit> = {
  'poruwa-blush-bridal-bouquet': { author: 'Tamara Menzi', ...CC0, source: `${COMMONS}Bridal_bouquet_(Unsplash).jpg` },
  'sunset-rose-bridesmaid-posy': { author: 'Désirée Fawn', ...CC0, source: `${COMMONS}Bridesmaid_Bouquet_(Unsplash).jpg` },
  'kraft-wrapped-carnation-bunch': { author: 'Lizzie', ...CC0, source: `${COMMONS}Paper-wrapped_bouquet_(Unsplash).jpg` },
  'dusky-mauve-garden-roses': { author: 'Jez Timms', ...CC0, source: `${COMMONS}Pastel_rose_bouquet_(Unsplash).jpg` },
  'morning-carnation-and-eucalyptus-jar': { author: 'Alexandra Gorn', ...CC0, source: `${COMMONS}Flowers_1_(Unsplash).jpg` },
  'fuchsia-celebration-bouquet': { author: 'Mira Bozhko', ...CC0, source: `${COMMONS}Gorgeous_bouquet_on_purple_background_(Unsplash).jpg` },
  'kandyan-bride-round-rose-bouquet': { author: 'Orio Nguyen', ...CC0, source: `${COMMONS}Flowers_2_(Unsplash).jpg` },
  'coral-rose-velvet-bunch': { author: 'Alex Blăjan', ...CC0, source: `${COMMONS}Rose_Bouquet_(Unsplash).jpg` },
  'ivory-phalaenopsis-spray': { author: 'Kai Oberhäuser', ...CC0, source: `${COMMONS}White_orchids_on_black_(Unsplash).jpg` },
  'highland-wildflower-posy': { author: 'chuttersnap', ...CC0, source: `${COMMONS}Sweet-scented_bouquet_(Unsplash).jpg` },
  'avurudu-sunshine-gerberas': { author: 'George E. Koronaios', ...BY_SA_4, source: `${COMMONS}A_bouquet_of_Gerberas_on_Ermou_Street.jpg` },
  'scarlet-anthurium-altar-arrangement': { author: 'René Hourdry', ...BY_SA_4, source: `${COMMONS}Anthurium_-_Bouquet_7_fleurs.jpg` },
  'olu-water-lily-pooja-offering': { author: 'AntanO', ...BY_SA_4, source: `${COMMONS}Blue_lotus_(Nymphaea_sp).jpg` },
  'araliya-temple-blossoms': { author: 'Basile Morin', ...BY_SA_4, source: `${COMMONS}Plumeria_(Frangipani)_flowers.jpg` },
}

/** Credit for a product photo, matched by the image URL (so it still works after the owner edits the product). */
export function creditForImage(url: string | undefined): PhotoCredit | undefined {
  if (!url) return undefined
  const slug = url.match(/\/images\/products\/(.+)-\d+\.webp$/)?.[1]
  return slug ? PHOTO_CREDITS[slug] : undefined
}
