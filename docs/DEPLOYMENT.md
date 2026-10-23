# Deploying Ceylon Petals

The website (`frontend/`) goes on **Vercel**. The API (`backend/`) goes on **Render**. The database
stays on **Supabase**; photos on **Cloudinary**; card payments through **PayHere**.

```
Visitor's browser ──► https://your-shop.vercel.app   (website)
                          │  /api/*  is forwarded by Vercel
                          ▼
                      https://ceylon-petals-api.onrender.com  (API) ──► Supabase
                          ▲
            PayHere ──────┘  (tells the API about payments directly)
```

Because Vercel forwards `/api/*`, the browser only ever talks to **one address**. The login cookie
is therefore a normal first-party cookie (works in Safari and Chrome with third-party cookies
blocked) and no CORS setup is needed.

---

## 0. Before you start

- [ ] Code is merged into `main` on GitHub and `npm run test` passes in `backend/`.
- [ ] **Use a separate Supabase project for the live shop** if you can. Your current database holds
      development data. If you reuse it, delete any test orders, customers and inquiries first.
- [ ] Decide the owner login (`OWNER_EMAIL`, a strong `OWNER_PASSWORD`).
- [ ] Replace sample data with real data (prices, stock, photos, WhatsApp number, delivery fees,
      promo codes) from the admin console once it is live.

## 1. Database (Supabase)

If this is a new project: Supabase -> *Connect* gives two URLs.

| Setting | Which one |
|---|---|
| `DATABASE_URL` | Transaction pooler, port **6543** |
| `DIRECT_URL` | Session pooler, port **5432** |

URL-encode special characters in the password (`%` becomes `%25`).

Create the tables and the first data **from your own computer** (once). Put the live project's two
URLs and the owner details in `backend/.env`, then:

```bash
cd backend
npm run db:deploy      # creates the tables
npm run db:seed        # adds categories, products, settings and the owner account
```

Afterwards put your development URLs back in `backend/.env`.

## 2. The API on Render

1. Render -> **New** -> **Blueprint** -> choose this repository. It reads `render.yaml`.
2. Fill in the values Render asks for:

| Variable | Value |
|---|---|
| `FRONTEND_URL` | your website address, e.g. `https://ceylon-petals.vercel.app` (https, no trailing `/`; list several with commas) |
| `DATABASE_URL`, `DIRECT_URL` | from step 1 |
| `PUBLIC_API_URL` | this service's address, e.g. `https://ceylon-petals-api.onrender.com` |
| `CLOUDINARY_*` | optional, see step 4 |
| `GROQ_API_KEY` | optional, the customer chatbot, see step 4b |
| `PAYHERE_MERCHANT_*` | leave empty until step 5 |

`JWT_SECRET` is generated for you. Keep `PAYHERE_MODE=disabled` for now (customers can still pay by
cash on delivery or WhatsApp). The server **refuses to start** in production with the fake
`simulated` gateway.

3. Wait for the deploy. Check `https://YOUR-API.onrender.com/api/health` shows `{"ok":true,...}`.

Use a paid instance. A free instance falls asleep, so the first visitor waits about a minute and a
PayHere payment callback can be missed while it sleeps.

## 3. The website on Vercel

1. Edit `frontend/vercel.json` and replace `YOUR-API-NAME.onrender.com` with your real Render address.
   Commit and push.
2. Vercel -> **Add New Project** -> import the repository -> set **Root Directory** to `frontend`.
   Framework: Vite (detected). No environment variables are needed: leave `VITE_API_URL` **empty**
   so the site calls `/api` on its own address.
3. Deploy. Then put the final site address into `FRONTEND_URL` on Render (if it was a guess) and redeploy.

Using your own domain (recommended): add `www.yourshop.lk` to Vercel, then set `FRONTEND_URL` on
Render to `https://www.yourshop.lk`.

### Alternative: separate domains without the rewrite
If you own a domain you can serve the API from `api.yourshop.lk` and the site from `www.yourshop.lk`
(same site, so cookies still work). Then: set `VITE_API_URL=https://api.yourshop.lk` in Vercel, set
`TRUST_PROXY_HOPS=1` on Render, and remove the `/api` rewrite from `vercel.json`. Do **not** use
`vercel.app` + `onrender.com` as two separate addresses: browsers block that kind of cookie.

## 4. Photos (Cloudinary)

Create a free account, then copy *Cloud name*, *API Key*, *API Secret* into the three `CLOUDINARY_*`
variables on Render and redeploy. In the admin, product forms can then upload photos directly. Without
them, the owner can still paste photo links.

## 4b. Chatbot (Groq, optional)

The chat button on the site is answered by an AI model on [Groq](https://console.groq.com). Create a
free API key, put it in `GROQ_API_KEY` on Render and redeploy. `GROQ_MODEL` is optional (the default
is `openai/gpt-oss-120b`). The key lives only on the server, never in the website code.

Without a key the chat window still opens, but every answer is the shop's contact details. If Groq is
slow or down, customers get the same message, so the chat can never block an order. Each visitor is
limited to 30 messages per 10 minutes, which also caps the AI bill.

## 5. Card payments (PayHere)

1. Create a PayHere merchant account and **add your website domain** under *Domains & Credentials*.
   PayHere must approve the domain before live payments work.
2. Copy the *Merchant ID* and *Merchant Secret* into Render (`PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`).
3. Test first: set `PAYHERE_MODE=sandbox` and pay with PayHere's test cards. Check that the order
   becomes **Paid** by itself in the admin (that proves PayHere reached `PUBLIC_API_URL/api/payments/payhere/notify`).
4. Go live: set `PAYHERE_MODE=live`. The merchant ID/secret must be the **live** ones.

## 6. Check it works (do all of these)

- [ ] Open the site: products and photos load; no red errors in the browser console.
- [ ] Register a customer account, sign out, sign in again. Reload the page: still signed in.
- [ ] Place a cash-on-delivery order as a guest. The confirmation page opens. Track it with the order number and phone.
- [ ] Sign in at `/admin/login` with the owner account. The order appears. Move it to *Confirmed*.
- [ ] Change a product's stock or price in the admin; the shop shows it.
- [ ] Upload a product photo (if Cloudinary is set up).
- [ ] Press the chat button and ask "How much is delivery to Kandy?" (if `GROQ_API_KEY` is set). The fee must match Settings.
- [ ] Card payment in sandbox: the order turns *Paid* without you doing anything.
- [ ] **Rate limits are per visitor, not shared:** from your phone, enter a wrong password 6 times at sign-in
      (you get locked out), then sign in from another device or network. If that also says "too many
      attempts", the proxy count is wrong: change `TRUST_PROXY_HOPS` between 1 and 2.
- [ ] As a customer (not the owner), open `/admin`: you are refused.
- [ ] Cleanup: delete your test orders and test customers; set the order count back with the owner (ask for the SQL if needed).

## 7. Day-two checklist

- Back up the database (Supabase -> Database -> Backups; paid plans have daily backups).
- Keep `JWT_SECRET` and `OWNER_PASSWORD` private. Changing `JWT_SECRET` signs everyone out.
- Updating the site: merge to `main`. Vercel and Render redeploy automatically; Render runs any new
  database migrations before the new version starts.
- Rolling back: Render and Vercel both keep previous deploys; click *Rollback* on the previous one.
  (Database migrations are not undone by a rollback, so make migrations additive.)
- Errors: Render -> *Logs* shows the API's log, including payment warnings that need the owner's attention
  (e.g. "paid after expiry and ... is short of stock").
