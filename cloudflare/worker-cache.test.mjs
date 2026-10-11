import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

let upstream = 0;
const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{
  name: 'public-cache-fixture', modules: true,
  script: readFileSync(new URL('./.generated/test-bundle/worker.js', import.meta.url), 'utf8'),
  compatibilityDate: '2026-10-08', compatibilityFlags: ['nodejs_compat'],
  bindings: { DEPLOYMENT_STAGE: 'production', SUPABASE_URL: 'https://database.fixture', SUPABASE_ANON_KEY: 'public-fixture' },
  outboundService: async request => {
    assert.equal(new URL(request.url).hostname, 'database.fixture');
    upstream++;
    return Response.json([]);
  },
}] }));
try {
  const url = 'https://www.ieltsai.pro/sitemap.xml';
  const first = await mf.dispatchFetch(url);
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('x-ielts-cache'), 'MISS');
  const second = await mf.dispatchFetch(url);
  assert.equal(second.headers.get('x-ielts-cache'), 'HIT');
  assert.equal(upstream, 1);
  for (const headers of [{ authorization: 'Bearer fixture' }, { cookie: 'session=fixture' }]) {
    const response = await mf.dispatchFetch(url, { headers });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-ielts-cache'), 'BYPASS');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
  assert.equal(upstream, 3);
  assert.equal((await mf.dispatchFetch(url)).headers.get('x-ielts-cache'), 'HIT');
  for (const path of ['/api/geo', '/api/not-a-route']) {
    assert.match((await mf.dispatchFetch('https://www.ieltsai.pro' + path)).headers.get('cache-control'), /no-store/);
  }
  console.log('workerd: anonymous cache HIT, credential bypass, private APIs and zero external writes verified');
} finally { await mf.dispose(); }
