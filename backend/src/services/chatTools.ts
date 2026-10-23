import { effectivePrice, getProductBySlug, listCategories, listOccasions, listProducts, type ProductDto } from './catalog.js'
import { getPublicSettings } from './settings.js'
import { listPublishedReviews } from './reviews.js'
import { listMyOrders, quoteOrder, type Viewer } from './orders.js'
import { availableSlots, earliestDeliveryDate, MAX_DAYS_AHEAD, slotByKey, SLOT_KEYS } from '../lib/deliverySlots.js'
import { addDays, colomboNow } from '../lib/colomboTime.js'
import { formatPhone } from '../lib/phone.js'
import { POLICIES, POLICY_TOPICS, SITE_PAGES, type PolicyTopic } from '../lib/chatKnowledge.js'

// The only things the chatbot can do. Every tool is READ-ONLY and returns data straight from the
// shop's own services, so prices, stock, fees and hours are never made up by the AI model.
// Nothing here returns a customer's name, phone number, e-mail or address.

export interface ChatProduct {
  slug: string
  name: string
  price: number
  originalPrice?: number
  imageUrl?: string
  url: string
}

export interface ToolContext {
  user: Viewer['user']
  /** Products the model looked at this turn; the route shows cards for the ones the reply names. */
  seenProducts: Map<string, ChatProduct>
}

interface ToolDef {
  description: string
  parameters: Record<string, unknown>
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>
}

const str = (v: unknown, max = 80): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined)
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined)

/** Compact product facts for lists (token budget!); `detailed` adds what is included and plant attributes. */
function summarise(p: ProductDto, detailed = false) {
  const price = effectivePrice(p)
  return {
    name: p.name,
    slug: p.slug,
    category: p.categoryId,
    occasions: p.occasions,
    about: p.shortDescription,
    price_lkr: price,
    ...(price < p.price ? { regular_price_lkr: p.price } : {}),
    in_stock: p.stock > 0,
    ...(p.stock > 0 && p.stock <= p.lowStockThreshold ? { low_stock: true } : {}),
    same_day: p.sameDay,
    colours: p.colours,
    flower_types: p.flowerTypes,
    ...(detailed ? { whats_included: p.details, ...(p.attributes ? { attributes: p.attributes } : {}) } : {}),
  }
}

/** Remembers a product so the chat can show its photo card if the reply names it. */
function remember(ctx: ToolContext, p: ProductDto) {
  const price = effectivePrice(p)
  ctx.seenProducts.set(p.slug, {
    slug: p.slug,
    name: p.name,
    price,
    ...(price < p.price ? { originalPrice: p.price } : {}),
    ...(p.images[0] ? { imageUrl: p.images[0] } : {}),
    url: `/product/${p.slug}`,
  })
}

const slugList = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, 120)).filter((x): x is string => Boolean(x)).slice(0, max) : []

const clockNow = () => {
  const { date, minutes } = colomboNow()
  return `${date} ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

const TOOLS: Record<string, ToolDef> = {
  search_products: {
    description:
      'Search the live product catalogue. Use for any question about available flowers, bouquets, hampers or plants, prices, colours, budgets, occasions or recommendations. Prices are in Sri Lankan rupees (LKR). Call it with filters; try again with fewer filters if nothing matches.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to match in name, description, flower type or colour, e.g. "red rose" or "lily".' },
        occasion: { type: 'string', description: 'Occasion slug from list_categories_and_occasions, e.g. "birthday".' },
        category: { type: 'string', description: 'Category slug from list_categories_and_occasions.' },
        max_price_lkr: { type: 'number', description: 'Budget ceiling in LKR.' },
        min_price_lkr: { type: 'number' },
        in_stock_only: { type: 'boolean', description: 'Default true.' },
        sort: { type: 'string', enum: ['featured', 'price-asc', 'price-desc', 'newest'] },
        limit: { type: 'number', description: 'Max results, default 6, max 8.' },
      },
    },
    async run(args, ctx) {
      const sortArg = str(args['sort'])
      const sort = sortArg === 'price-asc' || sortArg === 'price-desc' || sortArg === 'newest' ? sortArg : 'featured'
      const q = str(args['query'], 100)
      // The model sometimes sends a display name ("Birthday", "Bouquet") instead of the slug: accept either.
      const [categories, occasions] = await Promise.all([listCategories(), listOccasions()])
      const resolve = (given: string | undefined, options: { slug: string; name: string }[]) => {
        const g = given?.trim().toLowerCase()
        return g ? options.find((o) => o.slug.toLowerCase() === g || o.name.toLowerCase() === g)?.slug : undefined
      }
      const occasion = resolve(str(args['occasion']), occasions)
      const category = resolve(str(args['category']), categories)
      const ignored = [
        ...(str(args['occasion']) && !occasion ? ['occasion'] : []),
        ...(str(args['category']) && !category ? ['category'] : []),
      ]
      const limit = Math.min(Math.max(Math.round(num(args['limit']) ?? 6), 1), 8)
      const max = num(args['max_price_lkr'])
      const min = num(args['min_price_lkr'])
      const all = await listProducts({
        sort,
        ...(q ? { q } : {}),
        ...(occasion ? { occasion } : {}),
        ...(category ? { category } : {}),
        ...(args['in_stock_only'] === false ? {} : { inStock: true }),
      })
      const matches = all.filter((p) => (max === undefined || effectivePrice(p) <= max) && (min === undefined || effectivePrice(p) >= min))
      const shown = matches.slice(0, limit)
      for (const p of shown) remember(ctx, p)
      return {
        total_matches: matches.length,
        products: shown.map((p) => summarise(p)),
        ...(ignored.length > 0 ? { note: `Unknown ${ignored.join(' and ')} was ignored; call list_categories_and_occasions for valid names.` } : {}),
      }
    },
  },

  list_categories_and_occasions: {
    description: 'List the shop\'s product categories and occasions (with the slugs search_products accepts).',
    parameters: { type: 'object', properties: {} },
    async run() {
      const [categories, occasions] = await Promise.all([listCategories(), listOccasions()])
      return {
        categories: categories.map((c) => ({ slug: c.slug, name: c.name, description: c.description })),
        occasions: occasions.map((o) => ({ slug: o.slug, name: o.name })),
      }
    },
  },

  get_delivery_info: {
    description: 'Delivery districts with fees and same-day availability, delivery time slots, same-day cut-off time and the free-delivery threshold. Use for any delivery cost, area or timing question.',
    parameters: { type: 'object', properties: {} },
    async run() {
      const s = await getPublicSettings()
      return {
        currency: 'LKR',
        districts: s.deliveryZones.filter((z) => z.active).map((z) => ({ district: z.district, fee_lkr: z.fee, same_day: z.sameDay })),
        free_delivery_over_lkr: s.freeDeliveryOver > 0 ? s.freeDeliveryOver : null,
        same_day_order_before: s.sameDayCutoff,
        accepting_orders: s.acceptingOrders,
        time_slots: SLOT_KEYS.map((k) => {
          const slot = slotByKey(k)
          return { name: slot.label, hours: slot.hours, extra_fee_lkr: slot.extraFee, ...(slot.sameDayZonesOnly ? { same_day_districts_only: true } : {}) }
        }),
        page: '/delivery',
      }
    },
  },

  get_shop_info: {
    description: 'The shop\'s contact details, address, opening hours, current announcement and whether it is accepting orders.',
    parameters: { type: 'object', properties: {} },
    async run() {
      const s = await getPublicSettings()
      return {
        current_time_colombo: clockNow(),
        shop_name: s.shopName,
        tagline: s.tagline,
        phone: s.phone,
        whatsapp: formatPhone(s.whatsappNumber),
        email: s.email,
        address: s.address,
        opening_hours: s.openingHours,
        accepting_orders: s.acceptingOrders,
        announcement: s.announcement,
      }
    },
  },

  get_policy: {
    description: 'Verified shop policy text: payment methods, cancellation and changes, refunds and replacements, delivery rules, how to order, order tracking, custom orders, and flower/plant care instructions.',
    parameters: {
      type: 'object',
      properties: { topic: { type: 'string', enum: [...POLICY_TOPICS] } },
      required: ['topic'],
    },
    async run(args) {
      const topic = str(args['topic'])
      const policy = POLICY_TOPICS.includes(topic as PolicyTopic) ? POLICIES[topic as PolicyTopic] : undefined
      return policy ? { topic, policy: policy.text, page: policy.page } : { error: 'Unknown topic', topics: POLICY_TOPICS }
    },
  },

  get_site_pages: {
    description: 'The list of website pages the customer can be sent to, with a description of each.',
    parameters: { type: 'object', properties: {} },
    async run() {
      return Object.entries(SITE_PAGES).map(([path, about]) => ({ path, about }))
    },
  },

  get_product_details: {
    description: 'Everything about one product by its slug (from search_products): description, what is included, flower types, colours, plant attributes, price, stock and same-day availability.',
    parameters: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
    async run(args, ctx) {
      const slug = str(args['slug'], 120)
      if (!slug) return { error: 'slug is required' }
      const p = await getProductBySlug(slug).catch(() => null)
      if (!p) return { error: 'No active product with that slug.' }
      remember(ctx, p)
      return { ...summarise(p, true), long_description: p.description }
    },
  },

  compare_products: {
    description: 'Side-by-side facts for 2 to 4 products (by slug) so the customer can choose.',
    parameters: { type: 'object', properties: { slugs: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 } }, required: ['slugs'] },
    async run(args, ctx) {
      const slugs = slugList(args['slugs'], 4)
      if (slugs.length < 2) return { error: 'Give at least two product slugs.' }
      const found = await Promise.all(slugs.map((slug) => getProductBySlug(slug).catch(() => null)))
      const products = found.filter((p): p is ProductDto => p !== null)
      for (const p of products) remember(ctx, p)
      return { products: products.map((p) => summarise(p, true)), not_found: slugs.length - products.length }
    },
  },

  get_featured_products: {
    description: "The shop's featured picks or newest arrivals, for customers who have no specific request yet.",
    parameters: { type: 'object', properties: { kind: { type: 'string', enum: ['featured', 'newest'] }, limit: { type: 'number', description: 'Default 5, max 8.' } } },
    async run(args, ctx) {
      const newest = str(args['kind']) === 'newest'
      const limit = Math.min(Math.max(Math.round(num(args['limit']) ?? 5), 1), 8)
      const list = await listProducts({ sort: newest ? 'newest' : 'featured', inStock: true, ...(newest ? {} : { featured: true }), limit })
      for (const p of list) remember(ctx, p)
      return { products: list.map((p) => summarise(p)) }
    },
  },

  estimate_order_total: {
    description:
      'Estimate what an order costs: product prices (live), delivery fee for the district, and the total. Use for "how much will it be to <district>". Promo codes are NOT applied here (customers enter them at checkout).',
    parameters: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, quantity: { type: 'number' } }, required: ['slug'] }, minItems: 1, maxItems: 10 },
        district: { type: 'string', description: 'Delivery district, e.g. Colombo, Kandy.' },
        delivery_time_slot: { type: 'string', enum: [...SLOT_KEYS], description: 'Optional; the midnight slot has an extra fee.' },
      },
      required: ['items'],
    },
    async run(args) {
      const raw: unknown[] = Array.isArray(args['items']) ? args['items'].slice(0, 10) : []
      const lines: { productId: string; quantity: number; name: string; unit: number }[] = []
      for (const item of raw) {
        const entry = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
        const slug = str(entry['slug'], 120)
        if (!slug) continue
        const quantity = Math.min(Math.max(Math.round(num(entry['quantity']) ?? 1), 1), 20)
        const p = await getProductBySlug(slug).catch(() => null)
        if (p) lines.push({ productId: p.id, quantity, name: p.name, unit: effectivePrice(p) })
      }
      if (lines.length === 0) return { error: 'None of those products were found.' }
      const slot = SLOT_KEYS.find((k) => k === str(args['delivery_time_slot']))
      const district = str(args['district'], 60)
      const quote = await quoteOrder({
        items: lines.map(({ productId, quantity }) => ({ productId, quantity })),
        ...(district ? { district } : {}),
        ...(slot ? { deliverySlot: slot } : {}),
      })
      return {
        items: lines.map((l) => ({ name: l.name, quantity: l.quantity, unit_price_lkr: l.unit })),
        subtotal_lkr: quote.subtotal,
        delivery_fee_lkr: quote.deliveryFee,
        ...(quote.deliveryFee === null ? { delivery_note: 'Delivery fee unknown: the district is missing or we do not deliver there.' } : {}),
        estimated_total_lkr: quote.total,
        estimate_only: true,
      }
    },
  },

  check_delivery_availability: {
    description: 'For one district: whether we deliver there, the fee, the earliest delivery date, and which time slots are open on a date (default: the earliest date).',
    parameters: {
      type: 'object',
      properties: {
        district: { type: 'string' },
        date: { type: 'string', description: 'Optional YYYY-MM-DD.' },
      },
      required: ['district'],
    },
    async run(args) {
      const wanted = str(args['district'], 60)?.toLowerCase()
      if (!wanted) return { error: 'district is required' }
      const s = await getPublicSettings()
      const zone = s.deliveryZones.find((z) => z.active && z.district.toLowerCase() === wanted)
      if (!zone) {
        return {
          delivers: false,
          message: 'That district is not in our standard delivery list. We can often arrange a courier: contact the shop on WhatsApp.',
          districts: s.deliveryZones.map((z) => z.district),
        }
      }
      const earliest = earliestDeliveryDate(zone, s.sameDayCutoff)
      const asked = str(args['date'], 10)
      const valid = asked !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(asked) && asked >= earliest && asked <= addDays(colomboNow().date, MAX_DAYS_AHEAD)
      const date = valid ? asked : earliest
      return {
        delivers: true,
        district: zone.district,
        fee_lkr: zone.fee,
        free_delivery_over_lkr: s.freeDeliveryOver > 0 ? s.freeDeliveryOver : null,
        same_day_zone: zone.sameDay,
        accepting_orders: s.acceptingOrders,
        earliest_delivery_date: earliest,
        requested_date_unavailable: asked !== undefined && !valid,
        date_checked: date,
        open_time_slots: availableSlots(date, zone).map((sl) => ({ name: sl.label, hours: sl.hours, extra_fee_lkr: sl.extraFee })),
      }
    },
  },

  get_customer_reviews: {
    description: 'Published customer reviews and the average rating.',
    parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Default 4, max 8.' } } },
    async run(args) {
      const limit = Math.min(Math.max(Math.round(num(args['limit']) ?? 4), 1), 8)
      const r = await listPublishedReviews()
      return {
        average_rating: r.average,
        review_count: r.count,
        reviews: r.reviews.slice(0, limit).map((x) => ({ reviewer: x.initials, location: x.location, rating: x.rating, comment: x.message, ordered: x.orderedItem })),
      }
    },
  },

  get_my_orders: {
    description:
      'Status of the signed-in customer\'s own recent orders (newest first). Only works if the customer is signed in; otherwise it says so and the customer should use the Track order page. Never returns contact details or addresses.',
    parameters: { type: 'object', properties: {} },
    async run(_args, ctx) {
      if (!ctx.user) {
        return { signed_in: false, message: 'The customer is not signed in. They can sign in at /sign-in, or use /track-order with their order number and phone number.' }
      }
      const orders = (await listMyOrders(ctx.user.id)).slice(0, 5)
      return {
        signed_in: true,
        orders: orders.map((o) => ({
          order_number: o.orderNumber,
          status: o.status,
          payment_status: o.paymentStatus,
          delivery_date: o.deliveryDate,
          delivery_time: slotByKey(o.deliverySlot).hours,
          items: o.itemsSummary,
          total_lkr: o.total,
          page: `/account/orders`,
        })),
      }
    },
  },
}

/** Sent to the model: first sentence of each description and no per-parameter prose, to save tokens (the prompt already explains each tool). */
const slim = (schema: unknown): unknown => {
  if (Array.isArray(schema)) return schema.map(slim)
  if (schema && typeof schema === 'object') {
    return Object.fromEntries(Object.entries(schema).filter(([k]) => k !== 'description').map(([k, v]) => [k, slim(v)]))
  }
  return schema
}

/** The tool list in the OpenAI-compatible "tools" format. */
export const toolSpecs = Object.entries(TOOLS).map(([name, t]) => ({
  type: 'function' as const,
  function: { name, description: t.description.split(/(?<=\.)\s/)[0] ?? t.description, parameters: slim(t.parameters) },
}))

/** Runs one tool call. Failures come back as data so the model can apologise instead of crashing the chat. */
/** What a tool returns when its lookup failed; chat.ts stops asking the model to guess when every tool in a round returns this. */
export const TOOL_UNAVAILABLE = JSON.stringify({ error: 'That information is not available right now.' })

export async function runTool(name: string, rawArgs: string, ctx: ToolContext): Promise<string> {
  const tool = TOOLS[name]
  if (!tool) return JSON.stringify({ error: `Unknown tool ${name}` })
  try {
    const parsed: unknown = rawArgs.trim() ? JSON.parse(rawArgs) : {}
    const args = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    return JSON.stringify(await tool.run(args, ctx))
  } catch (error) {
    console.error(`chat tool ${name} failed:`, error instanceof Error ? error.message : error)
    return TOOL_UNAVAILABLE
  }
}
