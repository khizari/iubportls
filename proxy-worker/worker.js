/**
 * IUB Portal Proxy — Cloudflare Worker
 * ------------------------------------
 * Fetches an IUB page server-side, strips the headers that block iframe
 * embedding, rewrites links/forms/assets to keep the visitor inside the
 * proxy, and keeps a per-visitor cookie jar in Workers KV so a login
 * session can survive across proxied requests.
 *
 * KNOWN LIMITATIONS (read before relying on this):
 * - Only rewrites URLs found in HTML attributes (href, src, action). Any
 *   navigation or data-fetching the target page does via JavaScript
 *   (fetch/XHR to absolute URLs, client-side routing) is NOT intercepted
 *   and will likely break or bypass the proxy.
 * - Only same-origin form posts are rewritten correctly; anything more
 *   exotic (multi-step auth redirects to a different domain, OAuth, etc.)
 *   may fall through.
 * - This is fragile by nature — it breaks whenever IUB changes markup,
 *   adds new domains, or changes their auth flow. Treat it as a best
 *   effort, not a guarantee.
 * - Deliberately routing a student's login session through a third-party
 *   server (this Worker) is a real trust boundary. Don't deploy this for
 *   other students without telling them their traffic passes through it.
 */

const ALLOWED_HOSTS = [
  'www.iub.edu.pk',
  'iub.edu.pk',
  'eportal.iub.edu.pk',
  'my.iub.edu.pk',
  'lms.iub.edu.pk',
  'library.iub.edu.pk',
];

const SESSION_COOKIE = 'iubproxy_sid';

export default {
  async fetch(request, env) {
    const reqUrl = new URL(request.url);

    // CORS preflight for fetch()-based calls from the front end, if ever needed
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const target = reqUrl.searchParams.get('url');
    if (!target) {
      return textResponse('Missing ?url= parameter', 400);
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return textResponse('Invalid target URL', 400);
    }

    if (!ALLOWED_HOSTS.includes(targetUrl.hostname)) {
      return textResponse(`Host "${targetUrl.hostname}" is not on the allowlist`, 403);
    }

    // ---- session / cookie jar -------------------------------------------
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    let sid = cookies[SESSION_COOKIE];
    let isNewSession = false;
    if (!sid) {
      sid = crypto.randomUUID();
      isNewSession = true;
    }

    const jarKey = `jar:${sid}`;
    let jar = {};
    if (env.SESSIONS) {
      const stored = await env.SESSIONS.get(jarKey, { type: 'json' });
      if (stored) jar = stored;
    }
    const cookieHeaderForUpstream = Object.entries(jar[targetUrl.hostname] || {})
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    // ---- fetch upstream ----------------------------------------------
    const upstreamReqInit = {
      method: request.method,
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
        'Accept': request.headers.get('Accept') || '*/*',
        'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
        ...(cookieHeaderForUpstream ? { Cookie: cookieHeaderForUpstream } : {}),
      },
      redirect: 'manual',
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      upstreamReqInit.body = await request.arrayBuffer();
    }

    let upstreamResp;
    try {
      upstreamResp = await fetch(targetUrl.toString(), upstreamReqInit);
    } catch (err) {
      return textResponse('Upstream fetch failed: ' + err.message, 502);
    }

    // ---- handle redirects by rewriting Location back through the proxy --
    if ([301, 302, 303, 307, 308].includes(upstreamResp.status)) {
      const loc = upstreamResp.headers.get('Location');
      if (loc) {
        const absolute = new URL(loc, targetUrl).toString();
        const proxied = `${reqUrl.origin}${reqUrl.pathname}?url=${encodeURIComponent(absolute)}`;
        const redirectResp = new Response(null, {
          status: upstreamResp.status,
          headers: { Location: proxied, ...corsHeaders() },
        });
        await persistSession(env, jarKey, jar, targetUrl.hostname, upstreamResp.headers);
        setSessionCookie(redirectResp.headers, sid, isNewSession);
        return redirectResp;
      }
    }

    // ---- update cookie jar from Set-Cookie ------------------------------
    await persistSession(env, jarKey, jar, targetUrl.hostname, upstreamResp.headers);

    // ---- build response headers -----------------------------------------
    const newHeaders = new Headers(upstreamResp.headers);
    newHeaders.delete('x-frame-options');
    newHeaders.delete('content-security-policy');
    newHeaders.delete('content-security-policy-report-only');
    newHeaders.delete('set-cookie'); // never forward upstream cookies to the browser directly
    Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v));
    setSessionCookie(newHeaders, sid, isNewSession);

    const contentType = upstreamResp.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const proxyBase = `${reqUrl.origin}${reqUrl.pathname}`;
      const rewriter = new HTMLRewriter()
        .on('a[href]', new AttrRewriter('href', targetUrl, proxyBase))
        .on('form[action]', new AttrRewriter('action', targetUrl, proxyBase))
        .on('img[src]', new AttrRewriter('src', targetUrl, proxyBase))
        .on('script[src]', new AttrRewriter('src', targetUrl, proxyBase))
        .on('link[href]', new AttrRewriter('href', targetUrl, proxyBase))
        .on('source[src]', new AttrRewriter('src', targetUrl, proxyBase))
        // Neutralize the target's own frame-busting JS if present (best effort)
        .on('head', new HeadInjector());

      return rewriter.transform(
        new Response(upstreamResp.body, { status: upstreamResp.status, headers: newHeaders })
      );
    }

    return new Response(upstreamResp.body, { status: upstreamResp.status, headers: newHeaders });
  },
};

class AttrRewriter {
  constructor(attr, baseUrl, proxyBase) {
    this.attr = attr;
    this.baseUrl = baseUrl;
    this.proxyBase = proxyBase;
  }
  element(el) {
    const val = el.getAttribute(this.attr);
    if (!val) return;
    if (
      val.startsWith('#') ||
      val.startsWith('mailto:') ||
      val.startsWith('tel:') ||
      val.startsWith('javascript:') ||
      val.startsWith('data:')
    ) {
      return;
    }
    try {
      const absolute = new URL(val, this.baseUrl).toString();
      el.setAttribute(this.attr, `${this.proxyBase}?url=${encodeURIComponent(absolute)}`);
    } catch {
      // leave malformed URLs untouched
    }
  }
}

// Best-effort: strip inline "if (top !== self) top.location = self.location"
// style frame-busters some sites still ship. This is a simple heuristic,
// not a guarantee — plenty of frame-busting patterns will slip through.
class HeadInjector {
  element(el) {
    el.append(
      '<script>window.top===window.self||(window.top=window.self);</script>',
      { html: true }
    );
  }
}

function parseCookies(header) {
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = v;
  });
  return out;
}

function parseSetCookie(setCookieHeaderValues) {
  // Cloudflare Workers exposes multiple Set-Cookie via headers.entries() only
  // when using getAll; the Headers object here may fold them. We handle both.
  const results = [];
  for (const raw of setCookieHeaderValues) {
    const firstPart = raw.split(';')[0];
    const idx = firstPart.indexOf('=');
    if (idx === -1) continue;
    results.push([firstPart.slice(0, idx).trim(), firstPart.slice(idx + 1).trim()]);
  }
  return results;
}

async function persistSession(env, jarKey, jar, hostname, upstreamHeaders) {
  if (!env.SESSIONS) return; // KV not bound — session persistence disabled
  const setCookies =
    typeof upstreamHeaders.getAll === 'function'
      ? upstreamHeaders.getAll('set-cookie')
      : upstreamHeaders.get('set-cookie')
      ? [upstreamHeaders.get('set-cookie')]
      : [];
  if (!setCookies.length) return;
  const pairs = parseSetCookie(setCookies);
  if (!pairs.length) return;
  jar[hostname] = { ...(jar[hostname] || {}), ...Object.fromEntries(pairs) };
  await env.SESSIONS.put(jarKey, JSON.stringify(jar), { expirationTtl: 60 * 60 * 4 }); // 4h
}

function setSessionCookie(headers, sid, isNew) {
  if (!isNew) return;
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${sid}; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=14400`
  );
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

function textResponse(msg, status) {
  return new Response(msg, { status, headers: { 'Content-Type': 'text/plain', ...corsHeaders() } });
}
