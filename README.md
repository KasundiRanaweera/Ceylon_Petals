# Ceylon Petals: online flower shop (Sri Lanka)

A complete online flower shop for a studio in Colombo. Customers browse bouquets, hampers and plants,
pay by card (PayHere), cash on delivery or WhatsApp, and track their order. The owner runs the shop
from a private dashboard: orders, products, photos, stock, customers, custom requests, reviews,
analytics and shop settings.

| Part | What it is | Read more |
| --- | --- | --- |
| [`frontend/`](frontend/) | The website and the owner dashboard (React) | [frontend/README.md](frontend/README.md) |
| [`backend/`](backend/) | The API and database (Node.js, Express, PostgreSQL) | [backend/README.md](backend/README.md) |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | How to put the shop online (Supabase, Render, Vercel) | |
| [`render.yaml`](render.yaml) | Render settings for the API | |

## How the pieces fit

```
 Customer / owner browser
          │
          ▼
  Website (frontend, Vercel) ──/api──►  API (backend, Render)  ──►  PostgreSQL database (Supabase)
                                              │
                                              ├──► PayHere (card payments)
                                              └──► Cloudinary (optional, product photos)
```

The browser only ever talks to the website's address. Requests to `/api/...` are forwarded to the
API, so the sign-in cookie works like a normal same-site cookie. Prices, stock, delivery fees and
promo codes are always worked out on the server, never trusted from the browser.

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
Render and the website on Vercel. The free Render plan sleeps after 15 minutes without visits, so the
first request after a quiet spell can take up to a minute. A free uptime monitor (for example
UptimeRobot) calling `https://<your-api>/api/health` every 5 minutes keeps it awake.

## Good to know

- **Forgotten customer passwords.** There is no reset-by-email yet, because the shop doesn't send
  email. "Forgot your password?" on the sign-in page opens WhatsApp with a message to the shop.
  Customers can change their password themselves while signed in (Account → Profile).
- **Secrets.** `backend/.env` holds the database password, the login secret and the owner password.
  It is never committed. Only `.env.example`, with placeholders, is.
- **Photos.** With Cloudinary set up, product photos go there. Without it, the owner can still
  upload photos. They are shrunk in the browser and stored in the shop's own database.
