import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeConfig = JSON.parse(
  readFileSync(resolve(process.cwd(), 'cloudflare/routes.json'), 'utf8')
);
const globalHeaders = routeConfig.headers.find((entry) => entry.source === '/(.*)');
const headerValues = Object.fromEntries(
  globalHeaders.headers.map(({ key, value }) => [key.toLowerCase(), value])
);

describe('Cloudflare security-header contract', () => {
  it('keeps the baseline browser hardening headers on every route', () => {
    expect(headerValues).toMatchObject({
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '0',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      'permissions-policy':
        'camera=(), microphone=(self), geolocation=(), payment=(self "https://js.stripe.com"), display-capture=(), browsing-topics=()',
    });
  });

  it('keeps crawler directives and cache policy explicit for protected and root static paths', () => {
    const protectedRoutes = routeConfig.headers.find((entry) => entry.source.includes('admin/'));
    const rootStaticAssets = routeConfig.headers.find((entry) =>
      entry.source.includes('og\\.webp')
    );

    expect(protectedRoutes.headers).toContainEqual({
      key: 'X-Robots-Tag',
      value: 'noindex, nofollow, noarchive',
    });
    expect(rootStaticAssets.headers).toContainEqual({
      key: 'Cache-Control',
      value: 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400',
    });
    expect(routeConfig.redirects).toContainEqual({
      source: '/feed.xml',
      destination: '/blog/feed.xml',
      permanent: true,
    });
  });

  it('revalidates the SPA shell while keeping fingerprinted assets immutable', () => {
    const rootDocument = routeConfig.headers.find((entry) => entry.source === '/');
    const indexDocument = routeConfig.headers.find((entry) => entry.source === '/index.html');
    const fingerprintedAssets = routeConfig.headers.find(
      (entry) => entry.source === '/assets/(.*)'
    );
    const revalidate = {
      key: 'Cache-Control',
      value: 'public, max-age=0, must-revalidate',
    };

    expect(rootDocument.headers).toContainEqual(revalidate);
    expect(indexDocument.headers).toContainEqual(revalidate);
    expect(fingerprintedAssets.headers).toContainEqual({
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    });
  });

  it('keeps a same-origin CSP with pinned Supabase and payment connections', () => {
    const csp = headerValues['content-security-policy'];

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self' https://zvrmvycajimjxghrnpgy.supabase.co");
    expect(csp).toContain('https://api.stripe.com');
    const imageSources = csp.match(/img-src ([^;]+)/)[1];

    expect(imageSources).not.toMatch(/(?:^|\s)https:(?:\s|$)/);
    expect(csp).not.toContain('https://*.supabase.co');
    expect(csp).not.toMatch(/vercel|https:\/\/\*\.on\.aws|https:\/\/\*\.run\.app|capi-automation/);
  });
});
