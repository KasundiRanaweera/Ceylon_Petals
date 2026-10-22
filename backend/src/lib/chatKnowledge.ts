// Verified shop policies the chatbot may quote. Same wording as the website's Help pages
// (frontend/src/pages/InfoPages.tsx), so the bot and the pages never disagree.
// Prices, delivery fees, stock and opening hours are NOT here: those are read live from the database.

export const POLICY_TOPICS = ['payment', 'cancellation', 'refunds', 'delivery_rules', 'ordering', 'tracking', 'custom_orders', 'care'] as const
export type PolicyTopic = (typeof POLICY_TOPICS)[number]

export const POLICIES: Record<PolicyTopic, { text: string; page: string }> = {
  payment: {
    text: 'Payment methods: card online through PayHere (Visa, Mastercard, Amex and local cards, when card payments are switched on), cash on delivery, or confirm the order on WhatsApp and pay by bank transfer. Overseas customers can pay by card and enter an overseas WhatsApp number; we send a photo when the flowers are handed over.',
    page: '/faq',
  },
  cancellation: {
    text: 'Changes and cancellations: message the shop on WhatsApp as soon as possible with the order number. Changes are free until the shop starts preparing the order. A full refund is possible until preparation starts; afterwards a refund may not be possible because flowers are made to order.',
    page: '/refund-policy',
  },
  refunds: {
    text: 'Freshness guarantee: if flowers arrive damaged or not fresh, send a photo on WhatsApp within 24 hours of delivery and the shop replaces them free of charge. Card refunds go back through PayHere and usually appear within 5-7 working days. Cash and bank-transfer refunds are paid by bank transfer. If the recipient cannot be reached, the shop tries once more the same day; a second attempt on another day may have a delivery fee. If a flower is out of season the shop may swap a stem for one of equal or higher value in the same colours.',
    page: '/refund-policy',
  },
  delivery_rules: {
    text: 'Delivery: our own team hand-delivers in Colombo and suburbs, trusted partners deliver further afield. Same-day delivery is available in same-day districts when ordering before the daily cut-off. Poya days and public holidays may have limited slots. For a district not listed, the shop can often arrange a courier: message them on WhatsApp with the town and date. Every order includes a free handwritten card message.',
    page: '/delivery',
  },
  ordering: {
    text: 'How to order: browse the Shop or use the search, open a product and press Add to cart, then open the Cart and press Checkout. At checkout enter your details, the recipient, address, district, delivery date and time slot, an optional card message, and choose a payment method. A guest checkout works without an account; an account saves addresses and order history. Promo codes are entered at checkout.',
    page: '/shop',
  },
  tracking: {
    text: 'Order tracking: open the Track order page and enter the order number and the phone number used for the order. Signed-in customers can also see their orders under My account.',
    page: '/track-order',
  },
  custom_orders: {
    text: 'Weddings, events, bulk, corporate and custom bouquet designs go through the custom order request form; the shop replies to the request.',
    page: '/custom-order',
  },
  care: {
    text: [
      'Fresh flowers: trim 1-2 cm off each stem at an angle as soon as they arrive; use a clean vase with cool water and the flower food sachet; remove leaves below the water line; keep away from direct sun, fruit bowls and A/C or fan drafts; change the water and re-trim the stems every two days.',
      'Roses follow the same fresh-flower steps; in Sri Lanka\'s warm, humid climate fresh water every day or two helps them last.',
      'Orchids: water once a week by soaking the roots briefly, then let them drain; bright, indirect light is best; dendrobiums can bloom for 8 weeks or more.',
      'Indoor plants: check the care card; water only when the top 2-3 cm of soil is dry; keep out of strong afternoon sun; in air-conditioned rooms mist the leaves a few times a week.',
    ].join(' '),
    page: '/care-guide',
  },
}

/** Pages the bot may point customers to. */
export const SITE_PAGES: Record<string, string> = {
  '/shop': 'Browse and search all products',
  '/products/occasions': 'Flowers by occasion',
  '/products/luxury-hampers': 'Luxury hampers',
  '/products/indoor-plants': 'Indoor plants',
  '/wedding-events': 'Wedding and event flowers',
  '/custom-order': 'Request a custom order',
  '/cart': 'Shopping cart',
  '/checkout': 'Checkout',
  '/track-order': 'Track an order with order number + phone',
  '/sign-in': 'Sign in',
  '/register': 'Create an account',
  '/account/orders': 'My orders (signed-in customers)',
  '/delivery': 'Delivery areas, fees and times',
  '/care-guide': 'Flower and plant care',
  '/faq': 'Frequently asked questions',
  '/refund-policy': 'Refunds and replacements',
  '/about': 'About the shop',
}
