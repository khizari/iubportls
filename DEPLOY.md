# Deploying to Vercel (step-by-step, zero backend experience needed)

Your site now has one extra piece: `api/proxy.js`. It's a small serverless
function — Vercel runs it for you automatically, you don't manage a server.
Both your site and this function deploy together as **one project**.

## Part 1 — Get the code onto GitHub

Vercel deploys from a GitHub repo, so the code needs to live there first.

1. Go to [github.com](https://github.com) and sign up (free) if you don't
   have an account.
2. Click the **+** in the top-right corner → **New repository**.
   - Name it something like `iub-webapp`.
   - Leave it **Public** or **Private**, either works.
   - Don't check any of the "initialize with..." boxes.
   - Click **Create repository**.
3. On the next page, click **uploading an existing file**.
4. Drag in *every file and folder* from this project
   (`index.html`, `styles.css`, `app.js`, `assets/`, `api/`, this
   `DEPLOY.md`) — keep the folder structure intact (GitHub preserves
   folders when you drag them in).
5. Scroll down, click **Commit changes**.

You now have the full project on GitHub.

## Part 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Sign Up**.
2. Choose **Continue with GitHub** — this links the two accounts, so
   Vercel can see your repos.
3. On your Vercel dashboard, click **Add New...** → **Project**.
4. Find `iub-webapp` in the list and click **Import**.
5. Vercel will show build settings — you don't need to change anything.
   (Framework Preset can stay as "Other". No build command needed.)
6. Click **Deploy**.
7. Wait about a minute. When it finishes, you'll get a live URL like:
   ```
   https://iub-webapp-yourname.vercel.app
   ```

That's it — open that URL and your dashboard, Quick Links, and the
in-app portal viewer are all live. `app.js` already points at `/api/proxy`
on the same domain, so there's nothing else to configure.

## Part 3 — Test it

Open the site, log in, and try a few Quick Links:
- **Public pages** (Admissions, Fee Structure, Contact, Announcements,
  Downloads) should embed reasonably well with no login needed.
- **Login-gated pages** (Vouchers, Student Card, Clearance, My Documents,
  Time Table) — log in through the embedded window itself. The proxy now
  remembers your session (via a cookie on your own domain) across
  proxied requests, so once you're logged in you should stay logged in
  while navigating between IUB pages inside the embed.
- If a page still bounces you back to login, it may be doing something
  the proxy doesn't handle yet (e.g. relying on JavaScript that checks
  the real hostname, or a CAPTCHA) — "Open in new tab" is always there
  as a fallback for those.

## Part 4 — Making changes later

Any time you edit a file:
1. Go back to your GitHub repo in the browser.
2. Open the file, click the pencil (edit) icon, make your change,
   commit.
3. Vercel automatically redeploys within a minute — no extra steps.

## Staying logged in

`api/proxy.js` now keeps you logged in without needing any extra Vercel
add-ons (no Vercel KV or database to set up). It stores your IUB session
cookie in one first-party, httpOnly cookie on your own site's domain
(scoped separately per IUB subdomain — eportal / my / lms don't clash),
and replays it on every proxied request. Login POSTs and the redirect
that follows a successful login are both handled, so submitting the
login form inside the embed should land you on the dashboard and keep
you there as you click around.

Known limitations:
- Sessions expire after 2 hours of the proxy cookie's lifetime (or
  whenever IUB's own session naturally expires — whichever comes first).
- Pages that rely on CAPTCHAs, or JavaScript that specifically checks
  it's running on the real `iub.edu.pk` domain, may still not work
  through the embed. "Open in new tab" is the fallback for those.
