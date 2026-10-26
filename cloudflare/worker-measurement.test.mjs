import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const script = readFileSync(new URL('./.generated/test-bundle/worker.js', import.meta.url), 'utf8');
const upstream = [], checks = [];
const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: 'measurement-fixture', modules: true, script, compatibilityDate: '2026-10-08', compatibilityFlags: ['nodejs_compat'], ratelimits: { META_CAPI_RATE_LIMITER: { namespace_id: '991226963', simple: { limit: 20, period: 60 } } }, bindings: { DEPLOYMENT_STAGE: 'production', META_CAPI_ACCESS_TOKEN: 'fixture-token' }, outboundService: async req => {
  assert.match(req.url, /^https:\/\/graph\.facebook\.com\//);
  upstream.push(JSON.parse(await req.text()));
  return Response.json({ events_received: 1 });
} }] }));
const send = (url, body, headers = {}) => mf.dispatchFetch(url, { method: 'POST', headers: { origin: 'https://www.ieltsai.pro', 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.10', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
try {
  for (const [raw, country] of [['BD', 'BD'], ['KZ', 'KZ'], ['XX', null], ['T1', null], ['', null], ['BANGLADESH', null], [undefined, null]]) {
    const response = await mf.dispatchFetch('https://www.ieltsai.pro/api/geo', {
      cf: { country: raw }, headers: { 'x-vercel-ip-country': 'US' },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { country }, 'country comes from Cloudflare metadata only');
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  const geoPost = await mf.dispatchFetch('https://www.ieltsai.pro/api/geo', { method: 'POST' });
  assert.equal(geoPost.status, 405);
  assert.equal(geoPost.headers.get('allow'), 'GET');
  checks.push({ name: 'geo uses Cloudflare country, rejects placeholders, bypasses cache and requires GET', status: 200 });
  const base = 'https://www.ieltsai.pro/api/meta-capi';
  const valid = { event_name: 'Purchase', event_id: 'worker-fixture-only', event_source_url: 'https://www.ieltsai.pro/pricing', value: 10, currency: 'BDT', user: { em: 'a'.repeat(64), external_id: 'b'.repeat(64) } };
  for (const [name, url, body, headers, status] of [
    ['production binding populated', base, { event_name: 'probe' }, {}, 400],
    ['lookalike origin denied', base, valid, { origin: 'https://www.ieltsai.pro.evil.test' }, 403],
    ['forwarded host cannot bypass host gate', 'https://preview.invalid/api/meta-capi', valid, { 'x-forwarded-host': 'www.ieltsai.pro' }, 204],
    ['raw identity denied', base, { ...valid, user: { email: 'fixture@example.com' } }, {}, 400],
    ['oversized body denied', base, ' '.repeat(65537), {}, 413],
    ['JSON malformed denied', base, '{', {}, 400],
    ['test-code forwarding', base + '?test_event_code=FIXTURE-LOCAL', valid, { 'cf-connecting-ip': '192.0.2.10', 'x-forwarded-for': '198.51.100.10' }, 202],
  ]) {
    const r = await send(url, body, headers); assert.equal(r.status, status, name); checks.push({ name, status: r.status });
  }
  assert.equal(upstream.length, 1);
  assert.equal(upstream[0].access_token, 'fixture-token');
  assert.equal(upstream[0].test_event_code, 'FIXTURE-LOCAL');
  assert.equal(upstream[0].data[0].event_id, valid.event_id);
  assert.equal(upstream[0].data[0].user_data.client_ip_address, '192.0.2.10');
  const beforeBoundaryChecks = upstream.length;
  for (const [name, url, status, noindex] of [
    ['production indexing restored', 'https://www.ieltsai.pro/api/geo', 200, false],
    ['candidate indexing suppressed', 'https://ielts-ai-pro.rayan-rizon.workers.dev/api/geo', 200, true],
    ['candidate robots blocked', 'https://ielts-ai-pro.rayan-rizon.workers.dev/robots.txt', 200, true],
    ['candidate GTM proxy suppressed', 'https://ielts-ai-pro.rayan-rizon.workers.dev/mx/gtm.js?id=fixture', 200, true],
  ]) {
    const r = await mf.dispatchFetch(url);
    assert.equal(r.status, status, name);
    assert.equal(Boolean(r.headers.get('x-robots-tag')?.includes('noindex')), noindex, name);
    if (name.includes('robots')) assert.match(await r.text(), /Disallow: \/\s*$/);
    if (name.includes('GTM')) assert.equal(await r.text(), '');
    checks.push({ name, status: r.status });
  }
  assert.equal(upstream.length, beforeBoundaryChecks, 'candidate checks must not contact a provider');
  // Invalid probes exercise the actual workerd rate counter without Meta events.
  const statuses = [];
  for (let i = 0; i < 21; i++) statuses.push((await send(base, { event_name: 'probe' }, {
    'cf-connecting-ip': '192.0.2.20', 'x-forwarded-for': `198.51.100.${i}`,
  })).status);
  assert.deepEqual(statuses.slice(0, 20), Array(20).fill(400));
  assert.equal(statuses[20], 429, 'changing forwarding headers must not reset edge IP limit');
  const blocked = await send(base + '/extra', {}, { 'cf-connecting-ip': '192.0.2.20' });
  assert.equal(blocked.status, 429, 'path-prefix rate limit covers subpaths');
  assert.equal(blocked.headers.get('retry-after'), '60');
  assert.match(blocked.headers.get('cache-control'), /no-store/);
  assert.equal((await send(base, { event_name: 'probe' }, { 'cf-connecting-ip': '192.0.2.21' })).status, 400);
  assert.equal((await mf.dispatchFetch(base)).status, 405, 'POST limit must not affect GET');
  assert.equal((await mf.dispatchFetch('https://www.ieltsai.pro/api/geo')).status, 200);
  assert.equal(upstream.length, beforeBoundaryChecks);
  checks.push({ name: 'native rate limit: trusted IP, 20/min, prefix, 429, method and API isolation', status: 429 });
  const report = { testedAt: new Date().toISOString(), runtime: 'workerd via Miniflare', checks, externalWrites: 0, mockedMetaForwards: upstream.length, deduplicationAndHashAndIpAssertions: true };
  writeFileSync(new URL('./verification/worker-measurement-tests.json', import.meta.url), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await mf.dispose(); }
