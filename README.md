# Ceylon Petals: Flower Shop (Sri Lanka)

A full-stack flower shop: customer storefront, checkout with card (PayHere), cash on delivery or
WhatsApp, customer accounts, and an owner console for orders, products, stock, customers, inquiries
and analytics.

## Structure
- `frontend/`: React 19 + Vite + TypeScript + Tailwind v4 + TanStack Query + Motion
- `backend/`: Node 22+ + Express 5 + TypeScript + Prisma 7 + PostgreSQL (Supabase)
- `docs/DEPLOYMENT.md`: how to put it online (Vercel + Render)
- `render.yaml`: Render blueprint for the API

## Run it on your computer
```bash
# 1. API (needs backend/.env, copy backend/.env.example and fill it in)
cd backend
npm install
npm run db:deploy      # create the tables
npm run db:seed        # sample catalogue, shop settings, owner account
npm run dev            # http://localhost:5000

# 2. Website (in a second terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173  (forwards /api to the API)
```

## Checks
```bash
cd backend && npm run typecheck && npm test
cd frontend && npx tsc -b && npm run lint && npm run build
```
