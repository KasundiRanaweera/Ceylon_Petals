# Ceylon Petals — frontend

React 19 + Vite + TypeScript + Tailwind v4, React Router 7 and TanStack Query.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
npm run lint
```

## Running without a backend

Every page talks to `src/services/*`. Until the Express API exists, those functions read and
write a small mock database in `localStorage` (`src/services/mockDb.ts`, seeded from `src/data/`).
That is why everything is connected end-to-end: an order placed at checkout shows up in the
customer's account, in Track Order and in the owner's Orders page.

Demo accounts (shown on the login pages while the mock is in use):

| Role     | Email                    | Password       | Login page     |
| -------- | ------------------------ | -------------- | -------------- |
| Owner    | owner@ceylonpetals.lk    | `Owner@123`    | `/admin/login` |
| Customer | customer@example.com     | `Customer@123` | `/sign-in`     |

The public Register page always creates a `CUSTOMER`; there is no way to sign up as an owner.
Admin → Settings → **Reset demo data** restores the samples (handy when the sample delivery dates
are out of date).

## Moving to the real backend

Replace the body of each service function with an axios call. Pages and hooks don't change,
because they already work with the async functions and the types in `src/types/`.

| Service file             | Endpoints it stands in for                                                  |
| ------------------------ | --------------------------------------------------------------------------- |
| `services/catalog.ts`    | `GET /api/products`, `/api/products/:slug`, `/api/categories`, admin CRUD   |
| `services/orders.ts`     | `POST /api/orders`, `POST /api/orders/track`, `/api/me/orders`, admin PATCH |
| `services/auth.ts`       | `/api/auth/*`, `/api/me`, `/api/me/addresses`                               |
| `services/shop.ts`       | `/api/settings`, `/api/inquiries`, `/api/admin/customers`                   |

Each file lists its endpoints at the top. Things that must move to the server:

- **Prices and totals.** `createOrder` re-prices the cart, checks stock, delivery zone, date, slot
  and promo code. The API must do the same and never trust prices sent by the browser.
- **PayHere.** `/payment/:orderNumber` (`pages/PayHerePayment.tsx`) is a test stand-in. The real
  flow is described at the top of that file: signed form, then the `notify_url` callback marks the order paid.
- **Roles.** `RequireRole` only hides pages. Every `/api/admin/*` route needs an `OWNER` check.
- **Passwords.** The mock stores them as plain text. The backend must hash them (bcrypt).
- **Images.** Product photos are resized in the browser to data URLs (`lib/images.ts`). Upload
  them to Cloudinary instead.

The order, payment and status enums in `src/types/admin.ts` should match the Prisma schema.

## Where things live

- `src/pages/` — storefront pages; `pages/account/` customer area; `pages/admin/` owner console (lazy-loaded)
- `src/components/shop/ProductCard.tsx` — the one product card used on every listing
- `src/lib/pricing.ts`, `lib/deliverySlots.ts` — price, promo, delivery-fee and slot rules
- `src/lib/whatsapp.ts` — pre-filled WhatsApp order messages (the number comes from Settings)
