# IUB Portal Proxy (Cloudflare Worker)

# IUB Portal Proxy (Cloudflare Worker) — ALTERNATE PATH

> **If you're deploying to Vercel, ignore this folder.** The active proxy
> is `api/proxy.js` at the project root — see `DEPLOY.md` in the project
> root for that walkthrough. This Cloudflare version is kept here only in
> case you ever want to switch platforms later; it has a more complete
> session-cookie jar than the current Vercel version, at the cost of
> Cloudflare-specific APIs (`HTMLRewriter`) that Vercel doesn't support.

Lets the web app embed IUB pages in an iframe by fetching them server-side,
stripping the headers that normally block framing, and rewriting links so
navigation stays inside the proxy.

## Deploy it

1. Install Wrangler (Cloudflare's CLI) if you don't have it:
   ```
   npm install -g wrangler
   ```
2. Log in:
   ```
   wrangler login
   ```
3. From this folder, create the KV namespace used for session cookies:
   ```
   wrangler kv:namespace create SESSIONS
   ```
   Copy the `id` it prints into `wrangler.toml` (replace
   `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`).
4. Deploy:
   ```
   wrangler deploy
   ```
   Wrangler will print your Worker's URL, something like:
   ```
   https://iub-portal-proxy.<your-subdomain>.workers.dev
   ```
5. Open `app.js` in the web app and set:
   ```js
   const PROXY_BASE = 'https://iub-portal-proxy.<your-subdomain>.workers.dev';
   ```
   (It's currently an empty string, which means proxying is off and links
   fall back to opening in a new tab.)

## How it decides what to proxy

Only hosts in `ALLOWED_HOSTS` inside `worker.js` are proxied
(`www.iub.edu.pk`, `eportal.iub.edu.pk`, `my.iub.edu.pk`, `lms.iub.edu.pk`).
Anything else is rejected with a 403 — this is a safety allowlist, not a
general-purpose proxy.

## What actually works vs. what's shaky

**Reasonably solid:**
- Static/server-rendered pages: Admissions, Fee Structure, Contact,
  Announcements, Downloads.
- Basic navigation between pages via `<a>` links.
- Simple HTML `<form>` submissions (GET/POST).

**Likely to break or behave oddly:**
- Anything the page loads via JavaScript — `fetch()`/XHR calls to absolute
  URLs, single-page-app style navigation, dynamically inserted iframes.
  The rewriter only touches HTML attributes (`href`, `src`, `action`), not
  JavaScript logic, so these requests go straight to the real IUB domain
  and will likely be blocked by the browser (mixed content / CORS) or just
  silently fail.
- Multi-step login flows that redirect through a different domain.
- Anything using WebSockets.
- File uploads/downloads with complex flows (the mobile app's WebView has
  native download-manager integration; this proxy does not).

**Security/trust note:** this Worker sits between the student and IUB's
authentication system. Session cookies pass through code you wrote and
host. That's fine for your own personal use, but if this gets deployed for
other students, they should know their login traffic to IUB is passing
through a third-party server, not directly to IUB.

## Debugging

`wrangler tail` while testing shows live logs of every proxied request —
useful for seeing exactly which upstream URL failed or which cookie wasn't
forwarded correctly.
