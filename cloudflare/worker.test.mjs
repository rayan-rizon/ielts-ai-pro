import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchSource, resolveRule, configuredHeaders } from './routing.mjs';

const config = JSON.parse(readFileSync(new URL('./routes.json', import.meta.url)));
test('all configured redirects and rewrites resolve without changing destinations', () => {
  for (const rule of [...config.redirects, ...config.rewrites]) {
    const pathname = rule.source.replace(/:slug/g, 'cambridge-ielts-20').replace(/:sessionId/g, 'session-123').replace(/:kitSlug/g, 'academic').replace(/:guideSlug/g, 'articles').replace(/:id/g, 'test-123');
    const found = resolveRule([rule], pathname);
    assert.ok(found, rule.source);
    assert.equal(found.destination, rule.destination.replace(/:slug/g, 'cambridge-ielts-20'));
  }
});
test('headers preserve CSP, private-route robots and asset cache semantics', () => {
  const csp = configuredHeaders(config.headers, '/blog/example').get('Content-Security-Policy');
  assert.equal(csp, config.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value);
  assert.ok(!csp.includes('https://*.on.aws') && !csp.includes('https://*.run.app'));
  assert.equal(configuredHeaders(config.headers, '/admin/panel').get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
  assert.equal(configuredHeaders(config.headers, '/assets/test.js').get('Cache-Control'), 'public, max-age=31536000, immutable');
  assert.equal(configuredHeaders(config.headers, '/login').get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
});
test('route matching rejects extra segments and distinguishes feed from an article', () => {
  assert.deepEqual(matchSource('/blog/:slug', '/blog/example'), { slug: 'example' });
  assert.equal(matchSource('/blog/:slug', '/blog/example/extra'), null);
  assert.equal(resolveRule(config.rewrites, '/blog/feed.xml').destination, '/api/feed');
  assert.equal(resolveRule(config.rewrites, '/not-a-route'), null);
  assert.equal(resolveRule(config.redirects, '/blog/example/').destination, '/blog/example');
});
