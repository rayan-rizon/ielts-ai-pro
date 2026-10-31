import blogHandler from '../api/blog.js';
import blogCssHandler from '../api/blog-css.js';
import feedHandler from '../api/feed.js';
import llmsHandler from '../api/llms.js';
import pricingHandler from '../api/pricing.js';
import sitemapHandler from '../api/sitemap.js';
import metaCapiHandler from '../api/meta-capi.js';
import config from './.generated/routes.json';
import { configuredHeaders, resolveRule } from './routing.mjs';
import { isMeasuredRequest } from './profile.mjs';
import { canReadPublicCache, canStorePublicResponse } from './public-cache.mjs';

interface LegacyRequest {
  method: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body?: object;
}

class LegacyResponse {
  statusCode = 200;
  headers = new Headers();
  body: string | null = null;
  headersSent = false;
  status(code: number) {
    this.statusCode = code;
    return this;
  }
  setHeader(name: string, value: string) {
    this.headers.set(name, value);
    return this;
  }
  send(body: string) {
    this.body = body;
    this.headersSent = true;
    return this;
  }
  json(body: unknown) {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    return this.send(JSON.stringify(body));
  }
  end() {
    this.headersSent = true;
    return this;
  }
  toResponse(method: string) {
    return new Response(method === 'HEAD' || this.statusCode === 204 ? null : this.body, {
      status: this.statusCode,
      headers: this.headers,
    });
  }
}

type LegacyHandler = (request: LegacyRequest, response: LegacyResponse) => unknown;
const handlers: Record<string, LegacyHandler> = {
  '/api/blog': blogHandler,
  '/api/blog-css': blogCssHandler,
  '/api/feed': feedHandler,
  '/api/llms': llmsHandler,
  '/api/pricing': pricingHandler,
  '/api/sitemap': sitemapHandler,
};

function applyHeaders(response: Response, url: URL, env: Env, method: string) {
  const headers = configuredHeaders(config.headers, url.pathname);
  // Handler-specific cache and content-type headers take precedence.
  for (const [name, value] of response.headers) headers.set(name, value);
  headers.set(
    'Content-Security-Policy',
    config.headers[0].headers.find((h) => h.key === 'Content-Security-Policy')!.value
  );
  if (!isMeasuredRequest(url, env.DEPLOYMENT_STAGE))
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('X-Ielts-Hosting', 'cloudflare');
  headers.delete('x-cf-stored-at');
  return new Response(method === 'HEAD' ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function invoke(handler: LegacyHandler, request: Request, routed: URL) {
  const headers = Object.fromEntries(request.headers.entries());
  // The URL, not caller-supplied forwarding headers, is authoritative on Workers.
  const actual = new URL(request.url);
  headers.host = actual.host;
  headers['x-forwarded-host'] = actual.host;
  headers['x-forwarded-for'] = request.headers.get('cf-connecting-ip') || '';
  const legacy: LegacyRequest = {
    method: request.method,
    query: Object.fromEntries(routed.searchParams),
    headers,
  };
  if (request.method === 'POST') {
    if (Number(request.headers.get('content-length') || 0) > 65536)
      return new Response('Payload too large', { status: 413 });
    const reader = request.body?.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 65536) {
          await reader.cancel();
          return new Response('Payload too large', { status: 413 });
        }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    try {
      legacy.body = JSON.parse(new TextDecoder().decode(bytes) || '{}');
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }
  const result = new LegacyResponse();
  await handler(legacy, result);
  return result.toResponse(request.method);
}

async function publicHtml(
  handler: LegacyHandler,
  request: Request,
  routed: URL,
  ctx: ExecutionContext
) {
  if (request.method !== 'GET') return invoke(handler, request, routed);
  if (!canReadPublicCache(request)) {
    const response = await invoke(handler, request, routed);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Ielts-Cache', 'BYPASS');
    return response;
  }
  // The request key retains pagination/filter parameters. Only anonymous public
  // content is stored; no auth, geo, payment, or measurement response enters here.
  const key = new Request(routed.href, { method: 'GET' });
  const cached = await caches.default.match(key);
  const refresh = async () => {
    const response = await invoke(handler, request, routed);
    if (canStorePublicResponse(response)) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=86700');
      headers.set('x-cf-stored-at', String(Date.now()));
      await caches.default.put(key, new Response(response.clone().body, { status: 200, headers }));
    } else {
      // Do not keep an older public entry after a response becomes private.
      await caches.default.delete(key);
    }
    return response;
  };
  if (cached) {
    const age = Date.now() - Number(cached.headers.get('x-cf-stored-at') || 0);
    if (age < 86700000) {
      if (age >= 300000)
        ctx.waitUntil(
          refresh()
            .then(() => undefined)
            .catch(() => console.warn('[cloudflare-public-cache] Refresh failed'))
        );
      const headers = new Headers(cached.headers);
      headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
      headers.set('X-Ielts-Cache', age < 300000 ? 'HIT' : 'STALE');
      return new Response(cached.body, { status: cached.status, headers });
    }
  }
  const response = await refresh();
  response.headers.set('X-Ielts-Cache', 'MISS');
  return response;
}

async function route(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);
  // Apply the path-prefix + POST rule using trusted Cloudflare edge IPs.
  // The native counter is local to each Cloudflare location, not a global quota.
  if (
    isMeasuredRequest(url, env.DEPLOYMENT_STAGE) &&
    request.method === 'POST' &&
    url.pathname.startsWith('/api/meta-capi')
  ) {
    const ip = request.headers.get('cf-connecting-ip');
    if (!ip)
      return Response.json(
        { error: 'Client address unavailable' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    const { success } = await env.META_CAPI_RATE_LIMITER.limit({ key: `meta-capi:${ip}` });
    if (!success)
      return Response.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': '60', 'Cache-Control': 'private, no-store' },
        }
      );
  }
  // Redirect the apex to the canonical www host, preserving path and query.
  if (isMeasuredRequest(url, env.DEPLOYMENT_STAGE) && url.hostname === 'ieltsai.pro') {
    const canonical = new URL(url);
    canonical.hostname = 'www.ieltsai.pro';
    return new Response(null, { status: 308, headers: { Location: canonical.href } });
  }
  const redirect = resolveRule(config.redirects, url.pathname);
  if (redirect)
    return new Response(null, {
      status: redirect.permanent ? 308 : 307,
      headers: {
        Location: `${redirect.destination}${url.search}`,
      },
    });
  if (url.pathname === '/robots.txt' && !isMeasuredRequest(url, env.DEPLOYMENT_STAGE)) {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  if (url.pathname === '/api/geo') {
    if (request.method !== 'GET')
      return Response.json(
        { error: 'Method not allowed' },
        { status: 405, headers: { Allow: 'GET' } }
      );
    const value = request.cf?.country;
    const country =
      typeof value === 'string' && /^[A-Z]{2}$/.test(value) && value !== 'XX' ? value : null;
    return Response.json({ country }, { headers: { 'Cache-Control': 'no-store, private' } });
  }
  if (url.pathname === '/api/meta-capi') {
    if (!isMeasuredRequest(url, env.DEPLOYMENT_STAGE))
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    return invoke(metaCapiHandler, request, url);
  }
  const rewrite = resolveRule(config.rewrites, url.pathname);
  const routed = rewrite ? new URL(rewrite.destination, url) : new URL(url);
  if (routed.pathname === '/') routed.pathname = '/index.html';
  if (rewrite)
    for (const [name, value] of url.searchParams)
      if (!routed.searchParams.has(name)) routed.searchParams.append(name, value);
  if (routed.origin !== url.origin) {
    // Existing first-party GA/GTM proxy is disabled on staging so test traffic
    // never reaches production measurement. Production uses the same fixed map.
    if (!isMeasuredRequest(url, env.DEPLOYMENT_STAGE)) {
      return new Response(request.method === 'GET' ? '' : null, {
        status: request.method === 'GET' ? 200 : 204,
        headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' },
      });
    }
    const headers = new Headers();
    for (const name of ['content-type', 'user-agent', 'accept', 'accept-language']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    return fetch(routed, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
    });
  }
  const handler = handlers[routed.pathname];
  if (handler) {
    if (!['GET', 'HEAD'].includes(request.method))
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    if (routed.pathname === '/api/blog-css') return invoke(handler, request, routed);
    return publicHtml(handler, request, routed, ctx);
  }
  if (url.pathname.startsWith('/api/'))
    return Response.json(
      { error: 'Not found' },
      { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
    );
  if (!['GET', 'HEAD'].includes(request.method))
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const asset = await env.ASSETS.fetch(new Request(routed, request));
  if (asset.status !== 404) return asset;
  const missing = await env.ASSETS.fetch(new Request(new URL('/404.html', url), request));
  return new Response(missing.body, { status: 404, headers: missing.headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    try {
      return applyHeaders(await route(request, env, ctx), url, env, request.method);
    } catch {
      console.error('[cloudflare-router] Request failed');
      return applyHeaders(
        new Response('Service temporarily unavailable', {
          status: 503,
          headers: { 'Cache-Control': 'private, no-store' },
        }),
        url,
        env,
        request.method
      );
    }
  },
} satisfies ExportedHandler<Env>;
