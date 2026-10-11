import { writeFileSync } from 'node:fs';
const prod = 'https://www.ieltsai.pro';
const preview = 'https://ielts-ai-cloudflare-staging.rayan-rizon.workers.dev';
const get = async (url, options = {}) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: 'manual', ...options });
  return { status: r.status, headers: Object.fromEntries(r.headers), body: await r.text() };
};
const attr = (s, name) => s.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
const meta = (html, name) => [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]).find(s => attr(s, 'name') === name || attr(s, 'property') === name);
const value = (html, name) => attr(meta(html, name) || '', 'content');
const canonical = html => [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).filter(s => attr(s, 'rel') === 'canonical').map(s => attr(s, 'href'));
const sitemap = await get(prod + '/sitemap.xml');
const urls = [...sitemap.body.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1]);
const pages = [], images = new Set(); let cursor = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < urls.length) {
    const url = urls[cursor++], path = new URL(url).pathname;
    try {
      const [p, c] = await Promise.all([get(url), get(preview + path)]);
      const issues = [];
      for (const [host, r] of [['production', p], ['preview', c]]) {
        if (r.status !== 200) issues.push(`${host} status ${r.status}`);
        if (JSON.stringify(canonical(r.body)) !== JSON.stringify([url])) issues.push(`${host} canonical`);
        if (!/<title>[^<]+<\/title>/.test(r.body) || !value(r.body, 'description') || !/<h1\b/i.test(r.body)) issues.push(`${host} metadata`);
        for (const s of r.body.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
          try { JSON.parse(s[1]); } catch { issues.push(`${host} invalid JSON-LD`); }
        }
      }
      if (!c.headers['x-robots-tag']?.includes('noindex')) issues.push('preview noindex missing');
      if ((p.headers['x-robots-tag'] || '').includes('noindex') || (value(p.body, 'robots') || '').includes('noindex')) issues.push('production noindex');
      const image = value(c.body, 'og:image');
      if (!image) issues.push('missing og:image'); else images.add(image);
      pages.push({ path, issues, ogImage: image, twitterCard: value(c.body, 'twitter:card') });
    } catch (e) { pages.push({ path, issues: [e.message] }); }
  }
}));
const imageResults = await Promise.all([...images].map(async url => {
  const u = new URL(url); const r = await get(u.hostname === 'www.ieltsai.pro' ? preview + u.pathname : url);
  return { url, status: r.status, contentType: r.headers['content-type'] };
}));
const endpoints = {};
for (const host of [prod, preview]) {
  endpoints[host] = {};
  for (const path of ['/robots.txt', '/llms.txt', '/blog/feed.xml', '/favicon.svg', '/this-page-does-not-exist-seo-test']) {
    const r = await get(host + path); endpoints[host][path] = { status: r.status, contentType: r.headers['content-type'], robots: r.headers['x-robots-tag'], ...(path === '/robots.txt' ? { body: r.body } : {}) };
  }
  const probe = await get(host + '/api/meta-capi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'probe' }) });
  endpoints[host].capiNonWritingProbe = { status: probe.status, body: probe.body };
}
const gtm = await get(prod + '/mx/gtm.js?id=GTM-TR6XQ2R3');
const report = { testedAt: new Date().toISOString(), sitemapStatus: sitemap.status, sitemapEntries: urls.length, uniqueEntries: new Set(urls).size, pages, imageResults, endpoints, gtm: { status: gtm.status, bytes: gtm.body.length, containsPixel: gtm.body.includes('991226963227159'), containsGaId: gtm.body.includes('G-GF63SJZ9ZJ'), containsClarityProject: gtm.body.includes('xq6eu7owe1') }, failures: pages.filter(x => x.issues.length) };
writeFileSync(new URL('./verification/seo-tracking-live.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, pages: undefined, endpoints: Object.fromEntries(Object.entries(endpoints).map(([k,v])=>[k,{capiNonWritingProbe:v.capiNonWritingProbe}])), imageResults: imageResults.filter(x=>x.status!==200 || !x.contentType?.startsWith('image/')) }, null, 2));
