# Ceylon Petals: online flower shop (Sri Lanka)

**Live site:** [ceylon-petals.vercel.app](https://ceylon-petals.vercel.app)

A complete online flower shop for a studio in Colombo. Customers browse bouquets, hampers and plants,
pay by card (PayHere), cash on delivery or WhatsApp, and track their order. The owner runs the shop
from a private dashboard: orders, products, photos, stock, customers, custom requests, reviews,
analytics and shop settings.

| Part | What it is | Read more |
| --- | --- | --- |
| [`frontend/`](frontend/) | The website and the owner dashboard (React) | [frontend/README.md](frontend/README.md) |
| [`backend/`](backend/) | The API and database (Node.js, Express, PostgreSQL) | [backend/README.md](backend/README.md) |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | How to put the shop online (Supabase, Render, Vercel) | |
| [`docs/chatbot-lab.ipynb`](docs/chatbot-lab.ipynb) | The chatbot step by step in a Jupyter notebook: tools, prompt, chat loop and safety tests | |
| [`docs/HERO-FILM.md`](docs/HERO-FILM.md) | How to make the bouquet-making film for the home page (AI video prompts) | |
| [`render.yaml`](render.yaml) | Render settings for the API | |

## What customers can do

- **Browse and search** bouquets, roses, hampers, plants and wedding flowers. Filter by price, flower, colour and occasion.
- **Build their own gift:** design a hamper in the hamper builder, or write a card message in the card studio.
- **Order** as a guest or with an account. Choose the delivery date and time slot, add a card message and a promo code, then pay by **card (PayHere)**, **cash on delivery** or **WhatsApp**. Prices, delivery fees and stock are checked on the server.
- **Track an order** with its order number and phone number, no account needed.
- **Chat with the Ceylon Petals Assistant:** an AI chatbot answers questions about flowers, prices, stock, delivery and policies, suggests bouquets for a budget and shows product cards. Signed-in customers can ask about their own orders. See [The chatbot](#the-chatbot).
- **Ask for something special:** weddings, events, corporate or bulk orders, or a custom design, through the custom order form.
- **With an account:** see past orders and their status, save delivery addresses, update their name and phone, and change their password.
- **Forgot the password?** Tap "Forgot your password?" to ask the shop on WhatsApp. The shop sends back a one-time reset link.

## What the owner can do

Everything is in the owner dashboard at `/admin`. The full page-by-page guide is in [frontend/README.md](frontend/README.md#owner-dashboard).

| Page | What it's for |
| --- | --- |
| **Overview** | Today at a glance: orders to prepare, out for delivery, delivered, and a "Needs your attention" list (orders to confirm, payment problems, low stock, new requests) |
| **Orders** | Every order, as a board by delivery slot or as a table. Change the status, mark cash and WhatsApp orders as paid, mark refunds, message the customer, print a delivery slip, export to a spreadsheet |
| **Products** | Add, edit, hide or delete products. Upload photos from the phone or computer, and set prices, sale prices, stock and badges |
| **Categories** | The groups shown in the shop menu: names, photos, order, show or hide |
| **Inventory** | A quick morning stock count for every product |
| **Customers** | Everyone who has ordered, with what they've spent. Message them, export the list, or send a **password reset link** |
| **Custom inquiries** | Wedding, corporate, bulk and custom-design requests, with a status and private notes for each |
| **Reviews** | The customer reviews shown on the home page: add, edit, hide, reorder, delete |
| **Analytics** | Sales over time, best sellers, best customers, sales by category, delivery area and payment method |
| **Settings** | Shop details, opening hours, the announcement bar, social links, delivery zones and fees, the free-delivery amount, the same-day cut-off and promo codes |

The **Accepting orders** switch at the top of the dashboard pauses online checkout at once, for example on a holiday. Customers are then asked to order on WhatsApp.

## How the pieces fit

```
 Customer / owner browser
          │
          ▼
  Website (frontend, Vercel) ──/api──►  API (backend, Render)  ──►  PostgreSQL database (Supabase)
                                              │
                                              ├──► Groq (AI model for the chatbot)
                                              ├──► PayHere (card payments)
                                              └──► Cloudinary (optional, product photos)
```

The browser only ever talks to the website's address. Requests to `/api/...` are forwarded to the
API, so the sign-in cookie works like a normal same-site cookie. Prices, stock, delivery fees and
promo codes are always worked out on the server, never trusted from the browser.

## The chatbot

The round chat button (bottom right on the home page, and in the phone navigation bar on other
pages) opens the **Ceylon Petals Assistant**. It is built to help without being able to do harm:

- **Facts come from the shop, not from the AI.** The model (Groq, `openai/gpt-oss-120b`) can only call
  13 small **read-only tools**: search products, product details, compare, featured picks, delivery
  fees and slots per district, an order cost estimate, shop contact details and hours, policies,
  reviews, site pages and the signed-in customer's own orders. Prices, stock, fees and hours are read
  from the live database every time, so they cannot be invented or out of date.
- **It cannot change anything.** No tool places, edits, cancels or refunds an order, and none returns
  another customer's name, phone, e-mail or address. Messages that try to override the rules are
  treated as data, not instructions.
- **Product cards.** A photo card appears only for products the answer actually names.
- **It fails safely.** No API key, a slow model, a rate limit or a database error all give the same
  friendly message with the shop's WhatsApp number, e-mail and hours. The chat never blocks an order.
- **Protected.** Only user and assistant messages are accepted, each up to 1000 characters, the last
  12 turns are used, and each visitor gets 30 messages per 10 minutes.

Set `GROQ_API_KEY` in `backend/.env` to switch it on (see [backend/README.md](backend/README.md#the-chatbot)
and [frontend/README.md](frontend/README.md#chatbot)). [`docs/chatbot-lab.ipynb`](docs/chatbot-lab.ipynb)
walks through the same bot step by step in Python.

## Tech stack

| Layer | Technology |
| --- | --- |
| Website | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, TanStack Query 5, Motion 14, Axios, Lucide icons |
| API | Node.js 22+, Express 5, TypeScript, Zod 4, Helmet, express-rate-limit |
| Database | PostgreSQL on Supabase, through Prisma 7 |
| Sign-in | JWT in an httpOnly cookie, bcrypt password hashing |
| Chatbot | Groq (OpenAI-compatible API) with tool calling over the shop's own services |
| Payments | PayHere (simulated, sandbox or live) |
| Photos | Cloudinary, or stored in the shop's own database |
| Tests | Vitest and Supertest against an in-memory PostgreSQL (PGlite); ESLint for the website |
| Hosting | Vercel (website), Render (API), Supabase (database) |

Versions and details: [frontend/README.md](frontend/README.md#tech-stack) and [backend/README.md](backend/README.md#tech-stack).

## Run it on your computer

You need **Node.js 22 or newer** and a **PostgreSQL database**. A free Supabase project works.

```bash
# 1. The API (first terminal)
cd backend
npm install
cp .env.example .env    # then open .env and fill in the database and owner details
npm run db:deploy       # creates the tables
npm run db:seed         # adds the sample catalogue, shop settings and the owner account
npm run dev             # http://localhost:5000

# 2. The website (second terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

The chatbot is optional: add a free `GROQ_API_KEY` to `backend/.env` to enable it. Without one, the
chat window replies with the shop's contact details.

Then open:

- **Shop:** http://localhost:5173
- **Owner dashboard:** http://localhost:5173/admin/login. Sign in with the `OWNER_EMAIL` and
  `OWNER_PASSWORD` you set in `backend/.env`.

While developing, card payments run in **simulated** mode: a test page where you choose "pay" or
"fail". No real money is involved and you don't need a PayHere account.

## Common tasks

| I want to… | Do this (in `backend/`) |
| --- | --- |
| Change the owner's password, or I forgot it | Set `OWNER_PASSWORD` in `.env`, then `npm run owner:reset` |
| A customer forgot their password | Dashboard → Customers → key button → Send on WhatsApp |
| Remove test orders and test accounts | `npm run db:clean-tests`, then `npm run db:clean-tests -- --apply` |
| Add back sample data that is missing | `npm run db:seed` (never overwrites your changes) |
| Wipe everything and start again | See [Resetting the data](backend/README.md#resetting-the-data) |
| Look at the database tables | `npm run db:studio` |

## Checks before you push

```bash
cd backend  && npm run typecheck && npm test          # the tests use their own in-memory database
cd frontend && npm run lint && npm run build          # build also type-checks
```

## Putting it online

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). In short: the database goes on Supabase, the API on
Render and the website on Vercel. `render.yaml` asks for a paid instance. On Render's free plan the API sleeps after 15 minutes
without visits, so the first request after a quiet spell can take up to a minute. The GitHub workflow
[`.github/workflows/keep-api-awake.yml`](.github/workflows/keep-api-awake.yml) calls
`/api/health` every 10 minutes to keep it awake (change the address in it if your API moves). An
uptime monitor such as UptimeRobot does the same job if you prefer.

## Good to know

- **Forgotten customer passwords.** The shop sends no email, so resets go through WhatsApp:
  1. "Forgot your password?" on the sign-in page opens WhatsApp with a request to the shop.
  2. The owner opens **Customers** in the dashboard, presses the **key button** next to the customer
     and sends the one-time link with **Send on WhatsApp**.
  3. The customer opens the link, chooses a new password and is signed in.

  A link works once, for 30 minutes. Making a new one cancels the old one. Signed-in customers can
  also change their password under Account → Profile.
- **Secrets.** `backend/.env` holds the database password, the login secret and the owner password.
  It is never committed. Only `.env.example`, with placeholders, is.
- **Photos.** With Cloudinary set up, product photos go there. Without it, the owner can still
  upload photos. They are shrunk in the browser and stored in the shop's own database.
