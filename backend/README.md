# Ceylon Petals: backend (API)

The API behind the shop website and the owner dashboard.

**Node.js 22+ · Express 5 · TypeScript · Prisma 7 · PostgreSQL (Supabase) · Zod · JWT in an httpOnly cookie**

## Setup

```bash
npm install
cp .env.example .env      # fill it in (see "Settings" below)
npm run db:deploy         # create the tables from prisma/migrations
npm run db:seed           # sample catalogue, shop settings, delivery zones, promo codes, reviews, owner
npm run dev               # http://localhost:5000  (restarts when you save a file)
```

To check it is running, open http://localhost:5000/api/health (the API) and
http://localhost:5000/api/health/db (the database connection).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and restarts it on every change |
| `npm run build` / `npm start` | Builds to `dist/` and runs the built version (used on Render) |
| `npm run db:deploy` | Applies any new migrations to the database. Safe; it never deletes data |
| `npm run db:migrate` | Creates a new migration after you change `prisma/schema.prisma` (development only) |
| `npm run db:seed` | Adds the starting data that is missing. Never overwrites changes |
| `npm run db:clean-tests` | Lists test orders and test accounts. Add `-- --apply` to remove them |
| `npm run owner:reset` | Sets the owner's password to `OWNER_PASSWORD` from `.env` |
| `npm run db:studio` | Opens Prisma Studio, a spreadsheet-like view of the tables |
| `npm run typecheck` | Type-checks the code |
| `npm test` | Runs the 282 tests |

## Settings (`.env`)

Copy `.env.example` to `.env`. Every setting is explained in that file. The important ones:

| Setting | What it is |
| --- | --- |
| `DATABASE_URL` | Supabase **Transaction pooler** address (port 6543), used by the running API |
| `DIRECT_URL` | Supabase **Session pooler** address (port 5432), used by migrations, seed and Studio |
| `JWT_SECRET` | A long random string (64+ characters) that signs the login cookies |
| `FRONTEND_URL` | The website's address(es). Requests from other sites are refused |
| `OWNER_EMAIL`, `OWNER_PASSWORD`, `OWNER_NAME` | The owner account created by `npm run db:seed` |
| `PAYHERE_MODE` | `simulated` (local testing, the default in development), `sandbox`, `live` or `disabled` (the default in production) |
| `CLOUDINARY_*` | Optional. Without them, uploaded photos are stored in the database |
| `BCRYPT_ROUNDS` | How slow password hashing is. 10 is a good balance on Render's free plan |

`.env` is private. Never commit it, and never paste its values into chats or screenshots. If a
secret leaks, change it at the source (Supabase password, a new `JWT_SECRET`) and update Render.

## Resetting the data

Pick the smallest option that does what you need. **Options 3 and 4 delete real orders and
customers**, so take a backup first if the shop is live (Supabase → Database → Backups, or
`pg_dump "<DIRECT_URL>" > backup.sql`).

### 1. Remove only the test data

Removes orders placed by the automated tests and customer accounts whose email starts with `e2e`.
Stock those orders were holding goes back on sale. Nothing else is touched.

```bash
npm run db:clean-tests              # shows what would be removed, changes nothing
npm run db:clean-tests -- --apply   # removes it
```

### 2. Put back sample data that is missing

```bash
npm run db:seed
```

Creates any sample category, product, occasion, delivery zone, promo code or shop setting that does
not exist, and the owner account if there is none. It **never changes** existing rows: prices,
stock and settings you edited stay as they are. Sample reviews are added only when there are no
reviews at all. You can run it as often as you like.

### 3. Set one product's stock or price back

Do it in the owner dashboard (Products or Inventory), or in Prisma Studio (`npm run db:studio`).
The seed won't do this, because it never overwrites.

### 4. Wipe everything and start fresh

Deletes **every** table's data (orders, customers, uploaded photos stored in the database, reviews,
settings, products), rebuilds the tables from the migrations, then loads the samples again:

```bash
npx prisma migrate reset   # asks you to confirm; drops and re-creates everything
npm run db:seed            # Prisma 7 does not seed automatically after a reset
```

Afterwards:
- The owner account is created again from `OWNER_EMAIL` / `OWNER_PASSWORD`.
- Everyone who was signed in has to sign in again.
- Photos stored on Cloudinary are not deleted there.

These commands act on the database in `DIRECT_URL`. **Check that `.env` points at the database you
mean to reset** before running them, and never reset the live database unless that's what you want.

### Owner password

```bash
# change OWNER_PASSWORD in .env, then:
npm run owner:reset
```

This also signs the owner out on every other device. It creates the owner account if it is missing.
On Render, run it from the Render Shell, or locally with `.env` pointing at the live database.

### Customer passwords

There is no reset-by-email yet, because the shop doesn't send email. A customer who forgot their
password contacts the shop on WhatsApp (the "Forgot your password?" link does this). While signed in,
customers can change their own password under Account → Profile, which signs out their other devices.

## API

Everything is under `/api`. Answers are JSON. Errors look like
`{ "error": { "code": "…", "message": "…" } }`, and the message is written to be shown to the customer.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health`, `GET /health/db` |
| Sign-in | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/logout-all`, `GET /auth/me` |
| My account (signed in) | `PATCH /me`, `POST /me/password`, `GET/POST /me/addresses`, `PUT/DELETE /me/addresses/:id`, `GET /me/orders` |
| Catalogue | `GET /products`, `/products/:slug`, `/categories`, `/occasions` |
| Orders | `POST /orders/quote`, `POST /orders`, `POST /orders/track`, `GET /orders/:orderNumber` |
| Payments | `POST /payments/payhere/start`, `POST /payments/payhere/notify` (called by PayHere), `POST /payments/dev/simulate` (simulated mode only) |
| Shop | `GET /settings`, `GET /reviews`, `POST /inquiries`, `GET /images/:id` |
| Owner only (`/admin`) | products, categories, photo uploads, orders and their status/payment, reviews, settings, inquiries, customers, analytics |

### Security built in

- Passwords are hashed with bcrypt. The login cookie is httpOnly, `Secure` in production, and
  invalidated on password change or "sign out everywhere".
- Every `/admin` route checks the owner role on the server.
- Requests that change data must come from the shop's own website (Origin check and CORS).
- Prices, discounts, delivery fees and stock are worked out on the server. Stock is taken inside a
  database transaction, so two customers can't buy the last item twice.
- Rate limits (per address): 10 failed sign-ins per 15 minutes, 10 sign-ups per hour, 20 orders per
  hour, 15 wrong tracking lookups per 15 minutes, 5 wrong password changes per 15 minutes. A blocked
  request gets `429` and a "please wait" message.
- Uploaded photos are checked by their actual content (JPEG, PNG, WebP or AVIF only, max 5 MB).
- Unpaid card orders are cancelled after `PAYMENT_WINDOW_MINUTES`, and their stock returns. Photos
  nothing uses are cleaned up after 24 hours.

## Tests

```bash
npm test
```

The tests run against a real PostgreSQL that lives **in memory** (PGlite), built from the same
migrations. They never touch your Supabase database or your `.env` secrets, and need nothing installed.

## Folders

```
prisma/
  schema.prisma        the tables
  migrations/          every change to the tables, applied in order by db:deploy
scripts/               clean-test-data, reset-owner-password
src/
  index.ts, app.ts     start-up and the Express app
  config/              reads and checks .env
  routes/              the HTTP endpoints (admin/ for the owner)
  services/            the business rules (pricing, orders, payments, stock…)
  middleware/          sign-in checks, rate limits, origin check, error handler
  jobs/                timers: cancel unpaid card orders, clean up unused photos
  lib/                 small helpers (Colombo time, phone numbers, PayHere signing…)
  seed/                seed.ts and the starting data in seed/data/*.json
  __tests__/           the tests
```

## Deploying

See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md). On Render (`render.yaml`) the build runs
`npm ci --include=dev && npm run build && npm run db:deploy`, so new migrations are applied on every
deploy, and the start command is `npm start`.
