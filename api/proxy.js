// api/proxy.js
// Vercel Serverless Function — proxies IUB pages so they can be embedded
// in an iframe on this same site (no separate service to run).
//
// v1: no login-session persistence yet. This means public/informational
// pages (Admissions, Fee Structure, Contact, Announcements, Downloads)
// should work. Pages that require being logged in (Vouchers, Student Card,
// Clearance, My Documents, Time Table, etc.) will load the login page but
// won't stay logged in across proxied requests yet — that needs a
// server-side session store (Vercel KV), which is a good "phase 2" once
// this basic version is confirmed working. See DEPLOY.md.

const ALLOWED_HOSTS = [
  'www.iub.edu.pk',
  'iub.edu.pk',
  'eportal.iub.edu.pk',
  'my.iub.edu.pk',
  'lms.iub.edu.pk',
];

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

  let upstreamResp;
  try {
    upstreamResp = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        Accept: req.headers['accept'] || '*/*',
      },
      redirect: 'follow',
    });
  } catch (err) {
    res.status(502).send('Upstream fetch failed: ' + err.message);
    return;
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
