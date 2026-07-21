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
- **Should embed reasonably well:** Admissions, Fee Structure, Contact,
  Announcements, Downloads (public pages, no login needed).
- **Will likely still bounce to "Open in new tab":** Vouchers, Student
  Card, Clearance, My Documents, Time Table — these need you to be
  logged in, and this first version of the proxy doesn't keep a login
  session yet (see below).

## Part 4 — Making changes later

Any time you edit a file:
1. Go back to your GitHub repo in the browser.
2. Open the file, click the pencil (edit) icon, make your change,
   commit.
3. Vercel automatically redeploys within a minute — no extra steps.

## What's not done yet: staying logged in

Right now, `api/proxy.js` fetches each page fresh — it doesn't remember
that you logged in on a previous page. That's why login-gated pages will
show the login screen but won't progress past it.

Fixing that needs a small persistent storage layer (Vercel has one built
in, called **Vercel KV**) to remember your session cookies between
requests. It's a bigger, fussier change — cookies, redirects, and expiry
all have to be handled carefully — so it's worth confirming the basic
deploy works first. When you're ready for that step, just ask and we'll
add it on top of what's already deployed.
