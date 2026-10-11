import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import https from 'node:https';

const origin = 'https://www.ieltsai.pro';
const checks = [];
async function get(path, options = {}) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(30000), redirect: 'manual', ...options });
  const body = await response.text();
  const headers = Object.fromEntries([...response.headers].filter(([key]) => /^(?:cache-control|cf-cache-status|cf-ray|etag|location|server|x-ielts-cache|x-ielts-hosting|strict-transport-security|speculation-rules|x-robots-tag|content-type)$/.test(key)));
  checks.push({ path, status: response.status, headers });
  return { status: response.status, headers, body };
}

const dns = [];
for (const resolver of ['1.1.1.1', '8.8.8.8']) {
  for (const [name, type] of [['ieltsai.pro', 'NS'], ['ieltsai.pro', 'A'], ['www.ieltsai.pro', 'A'], ['www.ieltsai.pro', 'AAAA'], ['media.ieltsai.pro', 'A'], ['ieltsai.pro', 'MX']]) {
    const answers = execFileSync('dig', ['@' + resolver, name, type, '+short', '+time=5', '+tries=1'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    assert.ok(answers.length, `${resolver} ${name} ${type}`);
    dns.push({ resolver, name, type, answers });
  }
}
for (const version of ['TLSv1.2', 'TLSv1.3']) {
  await new Promise((resolve, reject) => {
    const req = https.get(origin, { minVersion: version, maxVersion: version, timeout: 15000 }, response => {
      assert.equal(response.statusCode, 200);
      checks.push({ tls: version, negotiated: response.socket.getProtocol(), status: response.statusCode });
      response.resume(); response.on('end', resolve);
    });
    req.on('timeout', () => req.destroy(Error('TLS timeout'))); req.on('error', reject);
  });
}
const home = await get('/');
assert.equal(home.status, 200);
assert.equal(home.headers['x-ielts-hosting'], 'cloudflare');
assert.equal(home.headers['speculation-rules'], undefined);
const apex = await get('https://ieltsai.pro/blog?cache-check=canonical');
assert.equal(apex.status, 308);
assert.equal(apex.headers.location, origin + '/blog?cache-check=canonical');
const http = await get('http://www.ieltsai.pro/');
assert.ok([301, 308].includes(http.status));
assert.equal(http.headers.location, origin + '/');
const asset = home.body.match(/(?:src|href)="(\/assets\/[^"?]+\.js)"/)?.[1];
assert.ok(asset);
const firstAsset = await get(asset);
const secondAsset = await get(asset);
assert.equal(secondAsset.status, 200);
assert.equal(secondAsset.headers['cf-cache-status'], 'HIT');
assert.match(secondAsset.headers['cache-control'], /max-age=31536000.*immutable/);
assert.equal(firstAsset.body, secondAsset.body);
assert.equal((await get(asset, { headers: { 'if-none-match': secondAsset.headers.etag } })).status, 304);
await get('/sitemap.xml');
const sitemap = await get('/sitemap.xml');
assert.equal(sitemap.status, 200);
assert.ok(['HIT', 'STALE'].includes(sitemap.headers['x-ielts-cache']));
for (const headers of [{ authorization: 'Bearer cloudflare-cache-fixture' }, { cookie: 'session=cloudflare-cache-fixture' }]) {
  const response = await get('/sitemap.xml', { headers });
  assert.equal(response.status, 200);
  assert.equal(response.headers['x-ielts-cache'], 'BYPASS');
  assert.equal(response.headers['cache-control'], 'private, no-store');
}
for (const path of ['/api/geo', '/api/not-a-real-api']) {
  assert.match((await get(path)).headers['cache-control'], /no-store/);
}
const forbidden = await get('/api/meta-capi', { method: 'POST', headers: { origin: 'https://untrusted.example', 'content-type': 'application/json' }, body: '{}' });
assert.equal(forbidden.status, 403);
const probe = await get('/api/meta-capi', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{"event_name":"probe"}' });
assert.equal(probe.status, 400); // Validation only: no conversion or payment is sent.
assert.equal((await get('/mx/gtm.js?id=GTM-TR6XQ2R3')).status, 200);
for (const path of ['/.env', '/.git/config', '/not-a-real-page-cloudflare-check']) assert.equal((await get(path)).status, 404);
const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
let cursor = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    const page = await get(url);
    assert.equal(page.status, 200, url);
    assert.ok(!page.headers['x-robots-tag']?.includes('noindex'), url);
    assert.ok(page.body.includes(`href="${url}"`), `canonical ${url}`);
  }
}));
mkdirSync(new URL('./verification/', import.meta.url), { recursive: true });
writeFileSync(new URL('./verification/final-dns-cdn-cache.json', import.meta.url), JSON.stringify({ checkedAt: new Date().toISOString(), dns, checks, sitemapPages: urls.length, externalConversionWrites: 0 }, null, 2));
console.log(`PASS: DNS on two resolvers, TLS 1.2/1.3, redirects, CDN HIT/304, auth cache bypass, API validation and ${urls.length} public sitemap pages`);
