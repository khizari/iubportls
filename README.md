# ZAZ Collection Store — Product Admin Panel

A Next.js admin panel for managing products, backed entirely by **Vercel Blob**
(used both as file storage for product images and as the JSON "database" for
product records — no separate database service required).

## What's included

- `/admin/login` — single-password admin login (signed, httpOnly session cookie)
- `/admin/products` — list all products
- `/admin/products/new` — create a product (name, slug, price, sale price,
  category, stock, sizes, colors, description, featured flag, multiple images)
- `/admin/products/[id]` — edit or delete a product
- REST API under `/api/products` (public `GET`, auth-required `POST/PUT/DELETE`)
  and `/api/upload` for image uploads — usable from your existing storefront
  pages once you wire them up to read from `GET /api/products`.
- Your original site's `css/`, `fonts/`, `images/`, `vendor/` folders are
  copied into `public/` as-is, plus the original `js/` under `public/legacy-js/`,
  so the visual assets are ready to reuse when you migrate the storefront
  pages themselves into this project (not included in this pass — this pass
  is scoped to the admin panel only).

## 1. Create a Vercel Blob store

In your Vercel project dashboard → **Storage** tab → **Create Database** →
**Blob**. Connect it to this project. Vercel will provide a
`BLOB_READ_WRITE_TOKEN` environment variable automatically once connected.

## 2. Set environment variables

Locally, copy `.env.local.example` to `.env.local` and fill in:

```
BLOB_READ_WRITE_TOKEN=   # auto-filled if you run `vercel env pull`
ADMIN_PASSWORD=          # the password you'll use to log into /admin
ADMIN_SESSION_SECRET=    # any long random string (used to sign the session cookie)
```

On Vercel, add `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` under
**Settings → Environment Variables** (Blob token is added automatically when
you connect the store).

## 3. Install & run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/admin/login`.

## 4. Deploy

```bash
vercel deploy
```

or just push to the Git branch connected to your Vercel project.

## How the data model works

Since Vercel Blob has no query engine, all products are stored as a single
JSON file at `data/products.json` inside your Blob store, read/written in
full on every request (`src/lib/blob.js`). This is simple and fine for a
boutique catalog (tens to low-thousands of products). If you outgrow it —
need concurrent multi-admin writes, complex filtering, or very large
catalogs — swap `src/lib/blob.js` for a real database (Vercel Postgres,
Supabase, etc.) without changing any of the admin UI or API route shapes.

## Security notes

- Only one admin account (a single shared password) — good enough for a
  solo/small-team store. Ask if you need multiple named admin accounts later.
- The session cookie is httpOnly, signed with HMAC-SHA256, and expires after
  12 hours.
- Product images are uploaded directly to Vercel Blob with public read access
  (needed so the storefront can display them) but deletes/writes always go
  through the authenticated API.
