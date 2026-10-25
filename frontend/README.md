# Ceylon Petals: frontend (website and owner dashboard)

The shop website customers use, and the owner dashboard at `/admin`. Both are in this one app.

**React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router 7 · TanStack Query · Motion · Axios**

Includes the customer chatbot window (see [Chatbot](#chatbot)).

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
| `/` | Home: a lily that closes from full bloom to a bud as you scroll (with loose petals drifting behind it on wider screens), then the bouquet feature, products, occasions and reviews |
| `/shop`, `/products/:category`, `/product/:slug` | Shop, category listings with filters, product page |
| `/products/occasions`, `/products/luxury-hampers`, `/products/indoor-plants`, `/wedding-events` | Special collections |
| `/cart`, `/checkout`, `/payment/:orderNumber`, `/order-confirmation/:orderNumber` | Buying: card (PayHere), cash on delivery, or WhatsApp |
| `/track-order` | Track an order with its number and phone number |
| `/custom-order` | Request a custom arrangement |
| `/sign-in`, `/register`, `/reset-password`, `/account/*` | Customer accounts: sign-in, sign-up, forgotten password, orders, saved addresses, profile and password |
| `/delivery`, `/care-guide`, `/faq`, `/refund-policy`, `/privacy`, `/about` | Information pages |
| `/admin/login`, `/admin/*` | Owner dashboard (see [Owner dashboard](#owner-dashboard) below) |

The dashboard is loaded only when someone opens it, so customers never download it. It checks the
owner role, and the API checks it again on every request.

## Chatbot

The **Ceylon Petals Assistant** is a chat window on the shop pages (not in the owner dashboard). The
answers come from the API (`POST /api/chat`, see [../backend/README.md](../backend/README.md#the-chatbot)).

- **Opening it.** A round chat button floats above the WhatsApp button. On phones, the home page
  shows the same two round buttons and every other page has chat and WhatsApp buttons in the bottom
  navigation bar. All of them open one shared window (`lib/chatLauncher.ts`).
- **The window** (`components/chat/ChatWidget.tsx`): a welcome message, five suggested questions, a
  typing indicator, a **new conversation** button, a 1000 character limit, Enter to send and
  Shift+Enter for a new line. On phones it fills the screen. Escape closes it.
- **Product cards.** When an answer names a product, a card with its photo and price links to the
  product page. Page paths in answers (such as `/track-order`) become links.
- **Errors.** If the server can't be reached, a red message appears in the chat suggesting WhatsApp.
  Too many messages in a short time gives a "please wait a minute" note.
- **Privacy.** The conversation lives only in the open tab. Nothing is saved in the browser.

## Owner dashboard

Sign in at `/admin/login` with the owner account (`OWNER_EMAIL` and `OWNER_PASSWORD` in `backend/.env`). Customers who open `/admin` are sent away, and the API checks the owner role on every request too. The sidebar can be collapsed, and the dashboard has its own light and dark switch.

**Top bar, on every page:**
- **Accepting orders** switch. Turning it off stops online checkout straight away and shows customers a banner asking them to order on WhatsApp.
- Live Colombo clock, and a link to view the shop as a customer.

**Overview** (`/admin`)
- A greeting with the number of deliveries still to go out today.
- **Needs your attention:** orders waiting to be confirmed, failed or unpaid payments, products low on stock and new custom requests. Each one opens the right page. These always show what needs doing now, whatever period is chosen.
- **Period picker** and **Download** button (see [Periods and downloads](#periods-and-downloads)).
- **Headline cards** for the chosen period: sales, orders, average order and money still to collect from cash and WhatsApp orders. Each has a small trend line and says how it changed against the same number of days before ("Up 12% on the 7 days before"), with an arrow and words so the change never relies on colour.
- **Sales per day** chart with the previous period as a dashed line, a hover tooltip and a table view.
- **What the numbers say:** short sentences worked out from the orders, such as the sales change, the best day, the best seller, the area that orders most, the most chosen delivery slot, money still to collect and a high cancellation rate. The ones that need action link to the right page.
- **Order progress** (pending to delivered, plus cancelled or failed), **best sellers**, and **how customers pay** with the delivery slots chosen.
- The latest orders, a low-stock watch list and new customers.

**Orders** (`/admin/orders`)
- Two views: a **board** with one column per delivery slot (morning, afternoon, evening, midnight), so you can see what to prepare and when it goes out, or a **table**.
- Filter by delivery date (today, tomorrow, upcoming, this week, this month or all), by payment (paid, unpaid, failed, refunded) and by search.
- Move an order along: pending, confirmed, preparing, out for delivery, delivered. Cancelling asks first, then puts the stock back on sale.
- **Mark as paid** for cash-on-delivery and WhatsApp orders once you have the money, and **mark as refunded** for a paid order you cancelled. Card payments update by themselves from PayHere.
- Reminders: marking an unpaid cash order as delivered reminds you to collect the money, and cancelling a paid order reminds you to refund it.
- WhatsApp the customer in one tap, and **export** the list to a spreadsheet (CSV).

**Order detail** (`/admin/orders/:id`)
- Customer, recipient, address, delivery date and slot, items, totals and the payment.
- The card message, with a **Copy** button, and the full status history.
- **Print delivery slip**, call or WhatsApp the customer, and change the status or payment.

**Products** (`/admin/products`)
- Search and filter by category, or by visible, hidden, featured, sold out and low stock.
- **Add or edit a product:** name, descriptions, category, price, sale price, stock and the low-stock warning level. Also a badge (such as "Bestseller"), flowers, colours, occasions, collection tags, featured, and show or hide.
- **Photos:** upload straight from the phone or computer (iPhone HEIC photos work), or paste a link. Photos are shrunk before upload.
- View the product in the shop, or delete it. Deleted products also lose photos that nothing else uses.

**Categories** (`/admin/categories`)
- The groups in the shop menu: name, description, photo (upload or link), menu order, and show or hide. Hiding a category also hides its products.

**Inventory** (`/admin/inventory`)
- A fast morning stock count: type today's number for each product. Sold-out products stay in the shop marked "Sold out".

**Customers** (`/admin/customers`)
- Registered customers and guests who ordered, matched by phone number, with orders, total paid and last order.
- Filter (registered, guests, repeat customers), sort, and search by name, email or phone.
- WhatsApp or email a customer, and **export** the list.
- **Password reset link** (the key button, registered customers only): makes a one-time link that lasts 30 minutes, to send with **Copy link** or **Send on WhatsApp**. See [Forgotten password](#forgotten-password).

**Custom inquiries** (`/admin/inquiries`)
- Wedding, event, corporate, bulk and custom-design requests sent from the website, with budget, quantity, date and venue.
- Give each one a status (new, contacted, quote sent, confirmed, closed) and keep private notes, for example "Quoted Rs. 58,000 on WhatsApp, follow up Friday".

**Reviews** (`/admin/reviews`)
- The reviews shown on the home page: add, edit, hide or show, choose the order, delete. The star rating in the home hero comes from these.

**Analytics** (`/admin/analytics`)
- For the chosen period: sales, orders, average order, amount paid, amount still to collect, refunded, and cancelled or failed.
- A chart of sales per day, orders per day, delivery slots, best sellers, best customers, and sales by category, delivery area and payment method.
- The same period picker and Download button as Overview.

**Periods and downloads** <a id="periods-and-downloads"></a>
- **Period picker** (`components/admin/PeriodPicker.tsx`): today, last 7 days, last 30 days, last 90 days, this month, last month, or a **custom range** with From and To dates (up to 366 days, no future dates). Every number is compared with the same number of days just before (`lib/period.ts`). Periods shorter than a week still chart the 7 days around them. The choice is shared by Overview and Analytics and kept until the tab is closed (`hooks/usePeriod.ts`).
- **Download** (`components/admin/ExportMenu.tsx`):
  - **Orders as CSV:** one row per order in the period, with customer, delivery, items, amounts, payment and status. Opens in Excel with Sinhala and Tamil text intact.
  - **Full report as Excel (.xlsx):** six sheets: *Summary* (each measure against the period before, with the change), *Orders*, *Sales per day*, *Best sellers*, *Delivery areas* and *Stock*. Amounts are real numbers formatted as rupees, and the header row stays in view while scrolling.
  - Files are named after the dates, for example `ceylon-petals-report-2026-10-01-to-2026-10-15.xlsx`. They are made in the browser (`lib/reportExport.ts`, `lib/spreadsheet.ts`), so no data is sent anywhere and no extra package is needed.
- **Charts** are plain SVG (`components/admin/charts/`): thin marks, light gridlines, hover tooltips, and labels or a legend beside every colour. Chart colours are a fixed blue, gold and green (`--chart-1` to `--chart-3` in `index.css`), checked for colour-blind readers in light and dark mode.

**Settings** (`/admin/settings`)
- **Shop details:** name, tagline, phone, WhatsApp number, email, studio address and opening hours.
- **Storefront:** the announcement bar and the Instagram, Facebook and TikTok links.
- **Ordering:** accept online orders, the same-day cut-off time, and the order amount that gets free delivery.
- **Delivery zones and fees:** each district's fee and whether it gets same-day delivery.
- **Promo codes:** percentage or fixed amount, a minimum order, a note, and on or off.

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
  the hero shows the open lily without the scroll animation and without the drifting petals. The
  petals are simple CSS loops (`.hero-drift-petal` in `index.css`) shown on tablet and desktop only.
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
  services/          the calls to the API, one file per area (chat.ts for the chatbot)
  hooks/, context/   shared state: cart, sign-in, shop settings, toasts, the owner's report period
  data/              fixed content: occasions, default shop settings, decorative photos, photo credits
  lib/               helpers: api client, prices, delivery slots, dates, WhatsApp messages, theme, chat launcher,
                     owner reports (orderStats, period, reportExport, spreadsheet)
  types/             TypeScript types shared by the pages
  index.css          Tailwind setup, colours for light and dark mode
```

## Deploying

The site is hosted on Vercel (`vercel.json`). Build command `npm run build`, output folder `dist`.
See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md).
