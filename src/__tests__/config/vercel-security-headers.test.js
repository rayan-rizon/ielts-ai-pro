import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const vercelConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'));
const globalHeaders = vercelConfig.headers.find((entry) => entry.source === '/(.*)');
const headerValues = Object.fromEntries(
  globalHeaders.headers.map(({ key, value }) => [key.toLowerCase(), value])
);

describe('Vercel security-header contract', () => {
  it('keeps the baseline browser hardening headers on every route', () => {
    expect(headerValues).toMatchObject({
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '0',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    });
  });

  it('keeps crawler directives and cache policy explicit for protected and root static paths', () => {
    const protectedRoutes = vercelConfig.headers.find((entry) => entry.source.includes('admin/'));
    const rootStaticAssets = vercelConfig.headers.find((entry) =>
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
    expect(vercelConfig.redirects).toContainEqual({
      source: '/feed.xml',
      destination: '/blog/feed.xml',
      permanent: true,
    });
  });

  it('keeps a same-origin CSP with explicit Supabase and payment connections', () => {
    const csp = headerValues['content-security-policy'];

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self' https://*.supabase.co");
    expect(csp).toContain('https://api.stripe.com');
  });
});
