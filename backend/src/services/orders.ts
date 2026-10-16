import type { Prisma } from '../generated/prisma/client.js'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { notFound, unprocessable } from '../lib/errors.js'
import { addDays, colomboNow, dateOnly } from '../lib/colomboTime.js'
import {
  MAX_DAYS_AHEAD,
  availableSlots,
  earliestDeliveryDate,
  fromDbSlot,
  slotByKey,
  toDbSlot,
  type DbSlot,
  type SlotKey,
} from '../lib/deliverySlots.js'
import { priceHamper, type HamperSelection } from '../lib/hamper.js'
import { samePhone } from '../lib/phone.js'
import { applyPromo, deliveryFeeFor, effectivePrice } from '../lib/pricing.js'
import { signOrderToken, verifyOrderToken } from '../lib/tokens.js'
import { getSettingsRow } from './settings.js'
import type { UserDto } from './auth.js'

// Checkout and everything a customer does with an order.
//
// The rule that matters most: THE BROWSER NEVER DECIDES A PRICE. A cart line says "this product,
// this many" (or "this hamper recipe"); the server looks up the real price, delivery fee and
// discount itself. Stock is taken with a conditional update inside one transaction, so two
// customers can never both buy the last bouquet.

type Db = Prisma.TransactionClient

// ---------------------------------------------------------------- shapes

export type CartLineInput = { productId: string; quantity: number } | { hamper: HamperSelection; quantity: number }

export interface QuoteInput {
  items: CartLineInput[]
  district?: string | undefined
  deliverySlot?: SlotKey | undefined
  promoCode?: string | undefined
}

export interface CheckoutInput extends QuoteInput {
  customerName: string
  customerPhone: string
  customerEmail?: string | undefined
  recipientName: string
  recipientPhone: string
  address: string
  area: string
  district: string
  deliveryDate: string
  deliverySlot: SlotKey
  cardMessage?: string | undefined
  deliveryNotes?: string | undefined
  paymentMethod: 'CARD' | 'CASH_ON_DELIVERY' | 'WHATSAPP'
}

export interface OrderItemDto {
  productId?: string
  slug?: string
  name: string
  imageUrl?: string
  unitPrice: number
  quantity: number
  options?: string
}

/** Matches frontend/src/types/admin.ts (AdminOrder). */
export interface OrderDto {
  /** The order number as a string ("1049"). The public id of an order is its number. */
  id: string
  orderNumber: string
  createdAt: string
  customerId?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  isOverseas: boolean
  recipientName: string
  recipientPhone: string
  address: string
  area: string
  district: string
  deliveryDate: string
  deliverySlot: SlotKey
  items: OrderItemDto[]
  itemsSummary: string
  cardMessage?: string
  deliveryNotes?: string
  subtotal: number
  deliveryFee: number
  discount: number
  promoCode?: string
  total: number
  paymentMethod: 'CARD' | 'CASH_ON_DELIVERY' | 'WHATSAPP'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED'
  statusHistory: { status: OrderDto['status']; at: string }[]
}

export const orderInclude = {
  items: { orderBy: { position: 'asc' } },
  history: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>

export function toOrderDto(o: OrderRow): OrderDto {
  const items: OrderItemDto[] = o.items.map((i) => ({
    ...(i.productId ? { productId: i.productId } : {}),
    ...(i.slug ? { slug: i.slug } : {}),
    name: i.name,
    ...(i.imageUrl ? { imageUrl: i.imageUrl } : {}),
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    ...(i.options ? { options: i.options } : {}),
  }))

  return {
    id: String(o.number),
    orderNumber: `CP-${o.number}`,
    createdAt: o.createdAt.toISOString(),
    ...(o.userId ? { customerId: o.userId } : {}),
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    ...(o.customerEmail ? { customerEmail: o.customerEmail } : {}),
    isOverseas: o.isOverseas,
    recipientName: o.recipientName,
    recipientPhone: o.recipientPhone,
    address: o.address,
    area: o.area,
    district: o.district,
    deliveryDate: o.deliveryDate.toISOString().slice(0, 10),
    deliverySlot: fromDbSlot(o.deliverySlot as DbSlot),
    items,
    itemsSummary: items.map((i) => (i.quantity > 1 ? `${i.name} × ${i.quantity}` : i.name)).join(', '),
    ...(o.cardMessage ? { cardMessage: o.cardMessage } : {}),
    ...(o.deliveryNotes ? { deliveryNotes: o.deliveryNotes } : {}),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    discount: o.discount,
    ...(o.promoCode ? { promoCode: o.promoCode } : {}),
    total: o.total,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    statusHistory: o.history.map((h) => ({ status: h.status, at: h.createdAt.toISOString() })),
  }
}

// ---------------------------------------------------------------- pricing

interface PricedLine {
  productId: string | null
  slug: string | null
  name: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  options: string | null
  /** Custom hampers need time to assemble, so they are never same-day. */
  sameDay: boolean
}

async function priceOrder(db: Db, input: QuoteInput, opts: { checkStock: boolean }) {
  const settings = await getSettingsRow(db)

  // Total wanted per product (the same product may appear on two cart lines).
  const wanted = new Map<string, number>()
  for (const line of input.items) {
    if ('productId' in line) wanted.set(line.productId, (wanted.get(line.productId) ?? 0) + line.quantity)
  }

  const found = wanted.size
    ? await db.product.findMany({
        where: { id: { in: [...wanted.keys()] }, isActive: true, category: { isActive: true } },
        include: { images: { orderBy: { position: 'asc' }, take: 1, select: { url: true } } },
      })
    : []
  const products = new Map(found.map((p) => [p.id, p]))

  for (const [id, quantity] of wanted) {
    const product = products.get(id)
    if (!product) throw unprocessable('An item in your cart is no longer available. Please remove it and try again.')
    if (opts.checkStock && product.stock < quantity) {
      throw unprocessable(
        product.stock === 0
          ? `${product.name} has just sold out. Please remove it from your cart.`
          : `Only ${product.stock} of ${product.name} left. Please lower the quantity.`
      )
    }
  }

  const lines: PricedLine[] = input.items.map((line) => {
    if ('productId' in line) {
      const p = products.get(line.productId)!
      return {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        imageUrl: p.images[0]?.url ?? null,
        unitPrice: effectivePrice(p),
        quantity: line.quantity,
        options: null,
        sameDay: p.sameDay,
      }
    }
    const hamper = priceHamper(line.hamper)
    return { productId: null, slug: null, name: hamper.name, imageUrl: null, unitPrice: hamper.unitPrice, quantity: line.quantity, options: hamper.options, sameDay: false }
  })

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)

  const zone = input.district ? await db.deliveryZone.findFirst({ where: { district: input.district, active: true } }) : null
  const slotFee = input.deliverySlot ? slotByKey(input.deliverySlot).extraFee : 0
  const deliveryFee = zone ? deliveryFeeFor(zone, subtotal, settings.freeDeliveryOver) + slotFee : null

  let discount = 0
  let promoCode: string | null = null
  let promoError: string | undefined
  const code = input.promoCode?.trim().toUpperCase()
  if (code) {
    const result = applyPromo(await db.promoCode.findUnique({ where: { code } }), subtotal)
    if (result.ok) {
      discount = result.discount
      promoCode = code
    } else {
      promoError = result.error
    }
  }

  return {
    settings,
    zone,
    lines,
    wanted,
    products,
    subtotal,
    deliveryFee,
    discount,
    promoCode,
    promoError,
    total: subtotal - discount + (deliveryFee ?? 0),
  }
}

export interface QuoteDto {
  subtotal: number
  /** null while the district is unknown or not delivered to. */
  deliveryFee: number | null
  discount: number
  total: number
  promoError?: string
}

/** The checkout summary. Same maths as createOrder, so what is shown is what gets charged. */
export async function quoteOrder(input: QuoteInput): Promise<QuoteDto> {
  const priced = await priceOrder(prisma, input, { checkStock: false })
  return {
    subtotal: priced.subtotal,
    deliveryFee: priced.deliveryFee,
    discount: priced.discount,
    total: priced.total,
    ...(priced.promoError ? { promoError: priced.promoError } : {}),
  }
}

// ---------------------------------------------------------------- checkout

export interface CreatedOrder {
  order: OrderDto
  /** Lets the person who just ordered (even a guest) open this one order. Valid for 24 hours. */
  accessToken: string
}

export async function createOrder(input: CheckoutInput, user?: UserDto): Promise<CreatedOrder> {
  const row = await prisma.$transaction(
    async (tx) => {
      const priced = await priceOrder(tx, input, { checkStock: true })
      const { settings, zone } = priced

      if (!settings.acceptingOrders) {
        throw unprocessable('We are not taking online orders right now. Please message us on WhatsApp.')
      }
      if (!zone) {
        throw unprocessable(`We don't deliver to ${input.district} yet. Message us on WhatsApp and we'll try to help.`)
      }
      if (input.paymentMethod === 'CARD' && env.payhere.mode === 'disabled') {
        throw unprocessable('Card payment is not available right now. Please choose cash on delivery or order on WhatsApp.')
      }
      if (priced.promoError) throw unprocessable(priced.promoError)

      // Delivery rules, in Sri Lankan time.
      const now = new Date()
      const today = colomboNow(now).date
      if (input.deliveryDate < earliestDeliveryDate(zone, settings.sameDayCutoff, now)) {
        throw unprocessable('That delivery date is no longer available. Please pick a later date.')
      }
      if (input.deliveryDate > addDays(today, MAX_DAYS_AHEAD)) {
        throw unprocessable(`We take online orders up to ${MAX_DAYS_AHEAD} days ahead. For bigger events, please use the custom order form.`)
      }
      if (!availableSlots(input.deliveryDate, zone, now).some((s) => s.key === input.deliverySlot)) {
        throw unprocessable('That delivery time is no longer available. Please choose another slot.')
      }
      if (input.deliveryDate === today) {
        const slow = priced.lines.find((l) => !l.sameDay)
        if (slow) throw unprocessable(`${slow.name} cannot be delivered on the same day. Please choose a later date.`)
      }

      // Take the stock. The condition `stock >= quantity` is checked by the database itself in the
      // same statement, so two customers racing for the last item cannot both succeed.
      for (const [productId, quantity] of priced.wanted) {
        const taken = await tx.product.updateMany({
          where: { id: productId, isActive: true, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        })
        if (taken.count === 0) {
          const name = priced.products.get(productId)?.name ?? 'An item'
          throw unprocessable(`${name} was just bought by another customer. Please check your cart and try again.`)
        }
      }

      return tx.order.create({
        data: {
          userId: user?.role === 'CUSTOMER' ? user.id : null,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail ?? null,
          isOverseas: !input.customerPhone.startsWith('94'),
          recipientName: input.recipientName,
          recipientPhone: input.recipientPhone,
          address: input.address,
          area: input.area,
          district: input.district,
          deliveryDate: dateOnly(input.deliveryDate),
          deliverySlot: toDbSlot(input.deliverySlot),
          cardMessage: input.cardMessage || null,
          deliveryNotes: input.deliveryNotes || null,
          subtotal: priced.subtotal,
          deliveryFee: priced.deliveryFee ?? 0,
          discount: priced.discount,
          promoCode: priced.promoCode,
          total: priced.total,
          paymentMethod: input.paymentMethod,
          items: {
            create: priced.lines.map((l, position) => ({
              productId: l.productId,
              slug: l.slug,
              name: l.name,
              imageUrl: l.imageUrl,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              options: l.options,
              position,
            })),
          },
          history: { create: { status: 'PENDING' } },
        },
        include: orderInclude,
      })
    },
    { maxWait: 10_000, timeout: 20_000 }
  )

  return { order: toOrderDto(row), accessToken: signOrderToken(row.number) }
}

// ---------------------------------------------------------------- looking orders up

/** "CP-1049", "cp-1049", "#1049" and "1049" all mean order 1049. */
export function parseOrderNumber(input: string): number | null {
  const match = input.trim().toUpperCase().replace(/^#/, '').match(/^(?:CP-)?(\d{1,9})$/)
  return match ? Number(match[1]) : null
}

const NOT_FOUND_MESSAGE = "We couldn't find an order with that number and phone number. Please check both and try again."

/** Guests can find their order with the order number plus the phone number used for it. */
export async function trackOrder(orderNumber: string, phone: string): Promise<OrderDto> {
  const number = parseOrderNumber(orderNumber)
  const order = number === null ? null : await prisma.order.findUnique({ where: { number }, include: orderInclude })
  // The same message for "no such order" and "wrong phone", so numbers cannot be probed.
  if (!order || !(samePhone(order.customerPhone, phone) || samePhone(order.recipientPhone, phone))) {
    throw notFound(NOT_FOUND_MESSAGE)
  }
  return toOrderDto(order)
}

export interface Viewer {
  user?: UserDto | undefined
  /** The accessToken returned at checkout. */
  token?: string | undefined
}

/**
 * One order, for someone who may be allowed to see it: the owner, the signed-in customer who
 * placed it, or whoever holds the checkout token. Everyone else gets a plain 404.
 */
export async function findOrderRowForViewer(orderNumber: string, viewer: Viewer): Promise<OrderRow> {
  const number = parseOrderNumber(orderNumber)
  const order = number === null ? null : await prisma.order.findUnique({ where: { number }, include: orderInclude })
  const allowed =
    order !== null &&
    (viewer.user?.role === 'OWNER' ||
      (order.userId !== null && viewer.user?.id === order.userId) ||
      (viewer.token !== undefined && verifyOrderToken(viewer.token, order.number)))
  if (!order || !allowed) throw notFound('Order not found')
  return order
}

export async function getOrderForViewer(orderNumber: string, viewer: Viewer): Promise<OrderDto> {
  return toOrderDto(await findOrderRowForViewer(orderNumber, viewer))
}

export async function listMyOrders(userId: string): Promise<OrderDto[]> {
  const rows = await prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: orderInclude })
  return rows.map(toOrderDto)
}
