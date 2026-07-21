// api/proxy.js
// Vercel Serverless Function — proxies IUB pages so they can be embedded
// in an iframe on this same site (no separate service to run).
//
// v2: keeps you logged in. Login-gated pages (Vouchers, Student Card,
// Clearance, My Documents, Time Table, etc.) now work through the embed.
//
// How the session survives across requests, without any external database:
// - Every response from IUB may include `Set-Cookie` (session id, csrf
//   token, etc). We collect those and store them in ONE first-party cookie
//   on *our own* domain, scoped per upstream host (so eportal / my / lms
//   don't clash with each other).
// - On every subsequent proxied request to that same host, we read that
//   cookie back and send it upstream as the `Cookie` header — so as far
//   as IUB's server is concerned, it's the same logged-in browser session
//   it was a moment ago.
// - Login forms POST through the proxy too now (method + body are
//   forwarded), and redirects (which is how most logins hand you off to
//   the dashboard) are followed manually so the new session cookie is
//   captured before the browser is sent to the next page.

const ALLOWED_HOSTS = [
  'www.iub.edu.pk',
  'iub.edu.pk',
  'eportal.iub.edu.pk',
  'my.iub.edu.pk',
  'lms.iub.edu.pk',
];

// Disable Vercel's automatic body parsing so we can read+forward the raw
// request body untouched (needed for login POSTs, file uploads, etc).
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function cookieNameFor(hostname) {
  return 'iub_sess_' + hostname.replace(/[^a-z0-9]/gi, '_');
}

function parseCookieHeader(header) {
  const out = {};
  (header || '').split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = v;
  });
  return out;
}

// Turn our stored blob back into a `name=value; name2=value2` Cookie header.
function decodeSessionBlob(blob) {
  if (!blob) return {};
  try {
    return JSON.parse(decodeURIComponent(blob));
  } catch {
    return {};
  }
}

function encodeSessionBlob(map) {
  return encodeURIComponent(JSON.stringify(map));
}

// Merge any Set-Cookie headers from the upstream response into our stored map.
function mergeSetCookies(existingMap, upstreamResp) {
  const map = { ...existingMap };
  let setCookies = [];
  if (typeof upstreamResp.headers.getSetCookie === 'function') {
    setCookies = upstreamResp.headers.getSetCookie();
  } else if (upstreamResp.headers.get('set-cookie')) {
    setCookies = [upstreamResp.headers.get('set-cookie')];
  }
  setCookies.forEach((raw) => {
    const firstPair = raw.split(';')[0];
    const idx = firstPair.indexOf('=');
    if (idx === -1) return;
    const name = firstPair.slice(0, idx).trim();
    const value = firstPair.slice(idx + 1).trim();
    if (name) map[name] = value;
  });
  return map;
}

function cookieMapToHeader(map) {
  return Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  const target = req.query.url;

  if (!target) {
    res.status(400).send('Missing ?url= parameter');
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    res.status(400).send('Invalid target URL');
    return;
  }

  if (!ALLOWED_HOSTS.includes(targetUrl.hostname)) {
    res.status(403).send(`Host "${targetUrl.hostname}" is not on the allowlist`);
    return;
  }

  const cookieName = cookieNameFor(targetUrl.hostname);
  const incomingCookies = parseCookieHeader(req.headers.cookie);
  let sessionMap = decodeSessionBlob(incomingCookies[cookieName]);

  const method = req.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  let body;
  if (hasBody) {
    body = await readRawBody(req);
  }

  const upstreamHeaders = {
    'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
    Accept: req.headers['accept'] || '*/*',
  };
  if (req.headers['content-type']) upstreamHeaders['Content-Type'] = req.headers['content-type'];
  const cookieHeader = cookieMapToHeader(sessionMap);
  if (cookieHeader) upstreamHeaders['Cookie'] = cookieHeader;

  let upstreamResp;
  try {
    upstreamResp = await fetch(targetUrl.toString(), {
      method,
      headers: upstreamHeaders,
      body: hasBody ? body : undefined,
      redirect: 'manual', // handle redirects ourselves so we can capture cookies first
    });
  } catch (err) {
    res.status(502).send('Upstream fetch failed: ' + err.message);
    return;
  }

  sessionMap = mergeSetCookies(sessionMap, upstreamResp);
  const newBlob = encodeSessionBlob(sessionMap);
  // First-party cookie on our own domain — httpOnly so page JS can't read
  // it, short-lived, scoped to this Vercel deployment only.
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=${newBlob}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7200`
  );

  // Logins (and most nav on this site) respond with a redirect — follow it
  // ourselves, pointed back through the proxy, now carrying the session
  // cookie we just captured.
  if (upstreamResp.status >= 300 && upstreamResp.status < 400) {
    const location = upstreamResp.headers.get('location');
    if (location) {
      let absolute;
      try {
        absolute = new URL(location, targetUrl).toString();
      } catch {
        absolute = location;
      }
      res.status(302);
      res.setHeader('Location', '/api/proxy?url=' + encodeURIComponent(absolute));
      res.send('');
      return;
    }
  }

  const contentType = upstreamResp.headers.get('content-type') || '';

  res.status(upstreamResp.status);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (contentType) res.setHeader('Content-Type', contentType);
  // Deliberately do NOT copy upstream's X-Frame-Options / CSP through —
  // that's the whole point of this proxy.

  if (contentType.includes('text/html')) {
    let html = await upstreamResp.text();

    // Rewrite href/src/action attributes so links/forms/assets stay
    // routed through the proxy instead of pointing straight at IUB.
    html = html.replace(
      /(href|src|action)=(["'])(.*?)\2/gi,
      (match, attr, quote, value) => {
        if (
          !value ||
          value.startsWith('#') ||
          value.startsWith('mailto:') ||
          value.startsWith('tel:') ||
          value.startsWith('javascript:') ||
          value.startsWith('data:')
        ) {
          return match;
        }
        try {
          const absolute = new URL(value, targetUrl).toString();
          return `${attr}=${quote}/api/proxy?url=${encodeURIComponent(absolute)}${quote}`;
        } catch {
          return match;
        }
      }
    );

    res.send(html);
    return;
  }

  // Non-HTML (images, CSS, JS, fonts, etc.) — pass through unchanged
  const buffer = Buffer.from(await upstreamResp.arrayBuffer());
  res.send(buffer);
};
