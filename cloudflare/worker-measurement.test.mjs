import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const script = readFileSync(new URL('./.generated/test-bundle/worker.js', import.meta.url), 'utf8');
const upstream = [], checks = [];
const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: 'measurement-fixture', modules: true, script, compatibilityDate: '2026-10-08', compatibilityFlags: ['nodejs_compat'], bindings: { DEPLOYMENT_STAGE: 'production', META_CAPI_ACCESS_TOKEN: 'fixture-token' }, outboundService: async req => {
  assert.match(req.url, /^https:\/\/graph\.facebook\.com\//);
  upstream.push(JSON.parse(await req.text()));
  return Response.json({ events_received: 1 });
} }] }));
const send = (url, body, headers = {}) => mf.dispatchFetch(url, { method: 'POST', headers: { origin: 'https://www.ieltsai.pro', 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
try {
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
    ['candidate indexing suppressed', 'https://ielts-ai-cloudflare.rayan-rizon.workers.dev/api/geo', 200, true],
    ['candidate robots blocked', 'https://ielts-ai-cloudflare.rayan-rizon.workers.dev/robots.txt', 200, true],
    ['candidate GTM proxy suppressed', 'https://ielts-ai-cloudflare.rayan-rizon.workers.dev/mx/gtm.js?id=fixture', 200, true],
  ]) {
    const r = await mf.dispatchFetch(url);
    assert.equal(r.status, status, name);
    assert.equal(Boolean(r.headers.get('x-robots-tag')?.includes('noindex')), noindex, name);
    if (name.includes('robots')) assert.match(await r.text(), /Disallow: \/\s*$/);
    if (name.includes('GTM')) assert.equal(await r.text(), '');
    checks.push({ name, status: r.status });
  }
  assert.equal(upstream.length, beforeBoundaryChecks, 'candidate checks must not contact a provider');
  const report = { testedAt: new Date().toISOString(), runtime: 'workerd via Miniflare', checks, externalWrites: 0, mockedMetaForwards: upstream.length, deduplicationAndHashAndIpAssertions: true };
  writeFileSync(new URL('./verification/worker-measurement-tests.json', import.meta.url), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await mf.dispose(); }
