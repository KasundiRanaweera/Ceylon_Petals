# Ceylon Petals: frontend (website and owner dashboard)

The shop website customers use, and the owner dashboard at `/admin`. Both are in this one app.

**React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router 7 · TanStack Query · Motion · Axios**

## Tech stack

| Purpose | Package | Version |
| --- | --- | --- |
| UI | `react`, `react-dom` | 19.3 |
| Build and dev server | `vite` with `@vitejs/plugin-react` | 8.3 |
| Language | `typescript` | 6.0 |
| Styling | `tailwindcss` with `@tailwindcss/vite` | 4.3 |
| Pages and links | `react-router-dom` | 7.18 |
| Loading and caching API data | `@tanstack/react-query` | 5.103 |
| Animation | `motion` (`motion/react`) | 14.1 |
| Calls to the API | `axios` | 1.20 |
| Icons | `lucide-react` | 1.47 |
| Linting | `eslint` with `typescript-eslint` and the React Hooks rules | 10 |

Needs Node.js 22 or newer to build (Vercel uses Node 24).

## Setup

The API must be running first (see [../backend/README.md](../backend/README.md)).

```bash
npm install
npm run dev        # http://localhost:5173
```

While developing, every request to `/api` is forwarded to the API at `http://localhost:5000`
(`vite.config.ts`). To point at another API, set `DEV_API_TARGET`, for example in `.env.local`:
`DEV_API_TARGET=https://ceylon-petals-api.onrender.com`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with instant reload |
| `npm run build` | Type-checks, then builds the site into `dist/` |
| `npm run preview` | Serves the built `dist/` locally, to check a production build |
| `npm run lint` | ESLint |

## Settings

| Setting | When to use it |
| --- | --- |
| `VITE_API_URL` | Leave **empty** (recommended). The site calls `/api` on its own address and Vercel forwards it to the API (`vercel.json`). Set it only if the site must call the API on a different domain directly, for example `https://api.example.com`. The API then needs `COOKIE_SAME_SITE=none`. |
| `DEV_API_TARGET` | Development only: where `npm run dev` forwards `/api` (default `http://localhost:5000`). |

When the API's address changes in production, update the `/api/:path*` rewrite in `vercel.json`.

## Pages

| Address | Page |
| --- | --- |
| `/` | Home: a lily that closes from full bloom to a bud as you scroll, then the bouquet feature, products, occasions and reviews |
| `/shop`, `/products/:category`, `/product/:slug` | Shop, category listings with filters, product page |
| `/products/occasions`, `/products/luxury-hampers`, `/products/indoor-plants`, `/wedding-events` | Special collections |
| `/cart`, `/checkout`, `/payment/:orderNumber`, `/order-confirmation/:orderNumber` | Buying: card (PayHere), cash on delivery, or WhatsApp |
| `/track-order` | Track an order with its number and phone number |
| `/custom-order` | Request a custom arrangement |
| `/sign-in`, `/register`, `/reset-password`, `/account/*` | Customer accounts: sign-in, sign-up, forgotten password, orders, saved addresses, profile and password |
| `/delivery`, `/care-guide`, `/faq`, `/refund-policy`, `/privacy`, `/about` | Information pages |
| `/admin/login`, `/admin/*` | Owner dashboard: overview, orders, products, categories, inventory, customers, custom inquiries, reviews, analytics, settings |

The dashboard is loaded only when someone opens it, so customers never download it. It checks the
owner role, and the API checks it again on every request.

## How it works

- **Data.** Every page gets its data through `src/services/*`, which call the API with one Axios
  client (`src/lib/api.ts`). TanStack Query caches the answers, so moving between pages is instant.
- **Errors.** API errors turn into an `ApiError` whose message is ready to show. Forms show it under
  the form. Owner actions show a red message on the page or a pop-up. Toasts are pop-ups at the top
  of the screen (`components/ui/ToastProvider.tsx`) that close themselves after 4 seconds. If the
  server can't be reached, the shop, product and home pages say "We couldn't load…" with a
  **Try again** button (`components/ui/LoadError.tsx`), rather than pretending something is missing.
  Screen readers read error pop-ups out straight away (`role="alert"`) and other pop-ups when free.
- **Crash screen.** If a page ever crashes, `components/ErrorBoundary.tsx` shows a friendly screen
  with **Reload the page** and **Go to the home page** instead of a blank page. When the cause is a
  new version replacing the code files, it says the site was just updated.
- **Sign-in.** The login cookie is httpOnly, so the site can't read it. It asks the API who is
  signed in (`/api/auth/me`).
- **Prices.** The cart shows prices for convenience, but the API works out the real total, stock,
  delivery fee and promo discount at checkout.
- **Light and dark mode.** The toggle in the header (and in the dashboard) is remembered on the
  device. The colours are defined once in `src/index.css`. The home hero is always dark.
- **Motion.** Animations use Motion and respect the device's "reduce motion" setting. With it on,
  the hero shows the open lily without the scroll animation.
- **Photos.** Product photos the owner uploads are shrunk in the browser first (to WebP, max 1600 px;
  iPhone HEIC photos are converted), then sent to Cloudinary or to the shop's own database.

## Forgotten password

The shop sends no email, so the owner sends a one-time link on WhatsApp:

1. "Forgot your password?" (`pages/AuthPage.tsx`) opens WhatsApp with a request to the shop,
   including the email the customer typed.
2. The owner presses the **key button** on **Customers** (`pages/admin/Customers.tsx`). The dialog
   (`components/admin/ResetLinkDialog.tsx`) shows the link with **Copy link** and **Send on WhatsApp**.
3. The link opens `/reset-password#<token>` (`pages/ResetPassword.tsx`). The page checks the link,
   greets the customer by name, saves the new password and signs them in. An expired, used or cut-off
   link shows a clear message and a button to ask the shop for a new one.

A link works once, for 30 minutes. Signed-in customers can also change their password under
Account → Profile.

## Folders

```
public/              images, the hero bloom frames (images/home/bloom), videos, icons
src/
  pages/             one file per page; account/ customer area; admin/ owner dashboard
  components/        building blocks, grouped by area (home, shop, catalog, admin, layout, ui…)
  services/          the calls to the API, one file per area
  hooks/, context/   shared state: cart, sign-in, shop settings, toasts
  data/              fixed content: occasions, default shop settings, decorative photos, photo credits
  lib/               helpers: api client, prices, delivery slots, dates, WhatsApp messages, theme
  types/             TypeScript types shared by the pages
  index.css          Tailwind setup, colours for light and dark mode
```

## Deploying

The site is hosted on Vercel (`vercel.json`). Build command `npm run build`, output folder `dist`.
See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md).
