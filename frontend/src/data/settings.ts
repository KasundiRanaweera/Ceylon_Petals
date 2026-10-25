import type { ShopSettings } from '../types'

// All 25 districts of Sri Lanka, grouped by province order.
export const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara',
  'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota',
  'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu',
  'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam',
  'Anuradhapura', 'Polonnaruwa',
  'Badulla', 'Monaragala',
  'Ratnapura', 'Kegalle',
]

// Defaults the owner can change in Admin → Settings.
export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Ceylon Petals',
  tagline: 'Sri Lankan flower studio',
  whatsappNumber: '94771234567',
  phone: '+94 11 234 5678',
  email: 'hello@ceylonpetals.lk',
  address: '42 Flower Road, Colombo 07, Sri Lanka',
  openingHours: '8:00 AM – 9:00 PM, every day',
  sameDayCutoff: '14:00',
  acceptingOrders: true,
  freeDeliveryOver: 25000,
  announcement: '',
  instagramUrl: 'https://www.instagram.com/ceylonpetals',
  facebookUrl: '',
  tiktokUrl: 'https://www.tiktok.com/@ceylonpetals',
  deliveryZones: [
    { id: 'z-colombo', district: 'Colombo', fee: 500, sameDay: true, active: true },
    { id: 'z-gampaha', district: 'Gampaha', fee: 900, sameDay: true, active: true },
    { id: 'z-kalutara', district: 'Kalutara', fee: 1000, sameDay: true, active: true },
    { id: 'z-kandy', district: 'Kandy', fee: 1800, sameDay: false, active: true },
    { id: 'z-galle', district: 'Galle', fee: 1800, sameDay: false, active: true },
    { id: 'z-matara', district: 'Matara', fee: 2200, sameDay: false, active: true },
    { id: 'z-kurunegala', district: 'Kurunegala', fee: 1800, sameDay: false, active: true },
    { id: 'z-nuwara-eliya', district: 'Nuwara Eliya', fee: 2200, sameDay: false, active: true },
  ],
  promoCodes: [
    { id: 'promo-welcome', code: 'WELCOME10', type: 'PERCENT', value: 10, minOrder: 10000, active: true, description: '10% off your first order' },
    { id: 'promo-avurudu', code: 'AVURUDU1000', type: 'FIXED', value: 1000, minOrder: 15000, active: false, description: 'Rs. 1,000 off for Avurudu' },
  ],
}
