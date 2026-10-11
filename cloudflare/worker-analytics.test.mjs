import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const script = readFileSync(new URL('./.generated/test-bundle/worker.js', import.meta.url), 'utf8');
const forwards = [], checks = [];
const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{
  name: 'analytics-fixture', modules: true, script,
  compatibilityDate: '2026-10-08', compatibilityFlags: ['nodejs_compat'],
  bindings: { DEPLOYMENT_STAGE: 'production' },
  outboundService: async request => {
    const url = new URL(request.url);
    assert.ok(['www.googletagmanager.com', 'www.google-analytics.com'].includes(url.hostname));
    forwards.push({ url: request.url, method: request.method, body: await request.text(), headers: Object.fromEntries(request.headers) });
    return url.pathname === '/g/collect'
      ? new Response(null, { status: 204 })
      : new Response('/* fixture container */', { headers: { 'Content-Type': 'application/javascript' } });
  },
}] }));
try {
  for (const [path, expected] of [
    ['/mx/gtm.js?id=GTM-TR6XQ2R3&l=dataLayer', 'https://www.googletagmanager.com/gtm.js?id=GTM-TR6XQ2R3&l=dataLayer'],
    ['/mx/gtag/js?id=G-GF63SJZ9ZJ', 'https://www.googletagmanager.com/gtag/js?id=G-GF63SJZ9ZJ'],
    ['/mx/g/collect?v=2&tid=G-GF63SJZ9ZJ&en=page_view', 'https://www.google-analytics.com/g/collect?v=2&tid=G-GF63SJZ9ZJ&en=page_view'],
  ]) {
    const response = await mf.dispatchFetch('https://www.ieltsai.pro' + path);
    assert.equal(response.status, path.includes('collect') ? 204 : 200);
    assert.equal(forwards.at(-1).url, expected);
    checks.push({ name: path.split('?')[0] + ' GET forwards query', status: response.status });
  }
  const body = 'en=page_view&dl=https%3A%2F%2Fwww.ieltsai.pro%2Fpricing\nen=scroll&epn.percent_scrolled=90';
  const response = await mf.dispatchFetch('https://www.ieltsai.pro/mx/g/collect?v=2&tid=G-GF63SJZ9ZJ', {
    method: 'POST', body, headers: {
      'content-type': 'text/plain;charset=UTF-8', 'user-agent': 'Analytics-fixture',
      'accept-language': 'en', authorization: 'must-not-forward', cookie: 'must-not-forward',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(forwards.at(-1).method, 'POST');
  assert.equal(forwards.at(-1).body, body);
  assert.equal(forwards.at(-1).headers['content-type'], 'text/plain;charset=UTF-8');
  assert.equal(forwards.at(-1).headers['user-agent'], 'Analytics-fixture');
  assert.equal(forwards.at(-1).headers['accept-language'], 'en');
  assert.equal(forwards.at(-1).headers.authorization, undefined);
  assert.equal(forwards.at(-1).headers.cookie, undefined);
  checks.push({ name: 'GA4 POST preserves payload and allowed headers', status: response.status });
  const apex = await mf.dispatchFetch('https://ieltsai.pro/blog?qa=domain-parity', { redirect: 'manual' });
  assert.equal(apex.status, 308);
  assert.equal(apex.headers.get('location'), 'https://www.ieltsai.pro/blog?qa=domain-parity');
  checks.push({ name: 'apex canonical redirect preserves path and query', status: apex.status });
  const forwardedCount = forwards.length;
  for (const host of ['ielts-ai-cloudflare.rayan-rizon.workers.dev', 'ielts-ai-cloudflare-staging.rayan-rizon.workers.dev', 'www.ieltsai.pro.evil.test']) {
    const r = await mf.dispatchFetch('https://' + host + '/mx/g/collect?v=2', { method: 'POST', body: 'en=page_view' });
    assert.equal(r.status, 204);
    checks.push({ name: host + ' suppresses measurement', status: r.status });
  }
  assert.equal(forwards.length, forwardedCount);
  const report = { testedAt: new Date().toISOString(), runtime: 'workerd via Miniflare', checks, mockedGoogleForwards: forwards.length, externalWrites: 0, liveProviderReceiptVerified: false };
  writeFileSync(new URL('./verification/worker-analytics-tests.json', import.meta.url), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await mf.dispose(); }
