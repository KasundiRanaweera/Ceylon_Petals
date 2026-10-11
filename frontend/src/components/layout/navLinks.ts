// One list drives the desktop nav, the mobile menu and the footer "Shop" column.
// `short` is the label in the compact desktop bar; `label` is used everywhere else.
// `inBar: false` keeps a link out of the desktop bar (it lives in the top info bar instead).
export const SHOP_NAV = [
  { label: 'Shop All', short: 'Shop', path: '/shop' },
  { label: 'Fresh Bouquets', short: 'Bouquets', path: '/products/fresh-bouquets' },
  { label: 'Roses', short: 'Roses', path: '/products/roses' },
  { label: 'Occasions', short: 'Occasions', path: '/products/occasions' },
  { label: 'Luxury Hampers', short: 'Hampers', path: '/products/luxury-hampers' },
  { label: 'Indoor Plants', short: 'Plants', path: '/products/indoor-plants' },
  { label: 'Weddings & Events', short: 'Weddings', path: '/wedding-events' },
  { label: 'Custom Orders', short: 'Custom orders', path: '/custom-order', inBar: false },
  { label: 'About', short: 'About', path: '/about' },
]

export const HELP_NAV = [
  { label: 'Track your order', path: '/track-order' },
  { label: 'Delivery areas & fees', path: '/delivery' },
  { label: 'Flower care guide', path: '/care-guide' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Refunds & replacements', path: '/refund-policy' },
  { label: 'Privacy & terms', path: '/privacy' },
]
