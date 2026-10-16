// Shared storefront + admin domain types.
// These are the shapes the backend API should return, so swapping the mock services in
// src/services for real HTTP calls should not require changes in any page.

export type OccasionSlug =
  | 'anniversary'
  | 'birthday'
  | 'love'
  | 'wedding'
  | 'sympathy'
  | 'get-well'
  | 'congratulations'
  | 'corporate'

export interface Occasion {
  slug: OccasionSlug
  name: string
  description: string
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
  sortOrder: number
  isActive: boolean
}

export interface Product {
  id: string
  slug: string
  name: string
  categoryId: string
  occasions: OccasionSlug[]
  shortDescription: string
  description: string
  images: string[]
  /** Regular price in LKR. */
  price: number
  /** Sale price in LKR, when the product is discounted. */
  discountPrice?: number
  stock: number
  lowStockThreshold: number
  isFeatured: boolean
  /** Hidden products stay in the admin but never show in the shop. */
  isActive: boolean
  badge?: string
  /** "What's included" bullet points on the product page. */
  details: string[]
  flowerTypes: string[]
  colours: string[]
  /** Short labels used for sub-collection filters, e.g. 'tea', 'low-light'. */
  tags: string[]
  sameDay: boolean
  /** Extra facts shown on the product page, e.g. { Light: 'Bright, indirect' } for plants. */
  attributes?: Record<string, string>
  createdAt: string
}

export interface HamperRecipe {
  /** Ids from the hamper builder, e.g. base 'roses', treats ['pralines'], keepsake 'candle'. */
  base: string
  treats: string[]
  keepsake: string | null
}

export interface CartItem {
  /** Line id. Same product + same options share a line. */
  id: string
  productId?: string
  slug?: string
  name: string
  imageUrl: string
  unitPrice: number
  quantity: number
  /** Free-text extras, e.g. the contents of a custom-built hamper. */
  options?: string
  /** For a custom-built hamper: the parts chosen. The server prices it; the browser never sends a price. */
  hamper?: HamperRecipe
  /** Most the customer can add (the product's stock). */
  maxQuantity?: number
}

export type Role = 'CUSTOMER' | 'OWNER'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  createdAt: string
}

export interface Address {
  id: string
  userId: string
  label: string
  recipientName: string
  phone: string
  line1: string
  city: string
  district: string
  isDefault: boolean
}

export type InquiryType = 'WEDDING' | 'BULK' | 'CORPORATE' | 'CUSTOM'
export type InquiryStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONFIRMED' | 'CLOSED'

export interface Inquiry {
  id: string
  reference: string
  type: InquiryType
  name: string
  email: string
  phone: string
  eventDate?: string
  location?: string
  budget?: string
  quantity?: string
  details: string
  /** Any other answers from the form, shown as label/value pairs to the owner. */
  extra?: Record<string, string>
  status: InquiryStatus
  ownerNotes?: string
  createdAt: string
}

export interface DeliveryZone {
  id: string
  district: string
  fee: number
  sameDay: boolean
  active: boolean
}

export interface PromoCode {
  id: string
  code: string
  type: 'PERCENT' | 'FIXED'
  value: number
  minOrder: number
  active: boolean
  description: string
}

export interface ShopSettings {
  shopName: string
  tagline: string
  /** International format without "+", e.g. 94771234567 — used for wa.me links. */
  whatsappNumber: string
  phone: string
  email: string
  address: string
  openingHours: string
  /** Same-day orders must be placed before this time, 24h "HH:MM". */
  sameDayCutoff: string
  acceptingOrders: boolean
  freeDeliveryOver: number
  deliveryZones: DeliveryZone[]
  promoCodes: PromoCode[]
}

export interface Testimonial {
  id: string
  name: string
  location: string
  rating: number
  message: string
  orderedItem: string
  initials: string
}
