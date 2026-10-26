import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolveRule } from './routing.mjs';

const candidate = process.argv[2] || 'https://ielts-ai-pro-staging.rayan-rizon.workers.dev';
const production = 'https://www.ieltsai.pro';
const config = JSON.parse(readFileSync(new URL('./routes.json', import.meta.url)));
const results = [];
const get = async (origin, pathname) => {
  const start = performance.now();
  const response = await fetch(origin + pathname, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  return { status: response.status, headers: Object.fromEntries(response.headers), body: await response.text(), ms: Math.round(performance.now() - start) };
};
const signature = body => ({
  title: body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
  canonical: body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1],
  h1: body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g, '').trim(),
  description: body.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1],
  article: body.match(/<article class="article-card article">([\s\S]*?)<\/article>/i)?.[1],
  schema: [...body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n'),
});
const sitemap = await get(production, '/sitemap.xml');
const locations = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
const blog = locations.filter(p => p.startsWith('/blog/'));
const sample = blog[0]?.split('/').at(-1) || 'not-real';
const specimen = source => source.replace(/:slug/g, sample).replace(/:sessionId/g, 'session-123').replace(/:kitSlug/g, 'academic').replace(/:guideSlug/g, 'articles').replace(/:id/g, 'test-123');
const paths = [...new Set(['/', ...locations, ...config.rewrites.filter(r => !r.destination.startsWith('https:')).map(r => specimen(r.source)), '/blog?q=writing', '/blog?page=2', '/robots.txt', '/api/geo', '/api/meta-capi', '/api/unknown', '/does-not-exist', '/blog/not-a-real-article'])];
for (const pathname of paths) {
  try {
    const [live, cf] = await Promise.all([get(production, pathname), get(candidate, pathname)]);
    const differences = [];
    const expectedDifference = ['/robots.txt', '/api/meta-capi'].includes(pathname);
    if (!expectedDifference && live.status !== cf.status) differences.push('status');
    if (!expectedDifference && live.status === 200 && /text\/html/.test(live.headers['content-type'])) {
      for (const [key, value] of Object.entries(signature(live.body))) if (value !== signature(cf.body)[key]) differences.push(key);
    }
    if (pathname.startsWith('/blog/') && pathname !== '/blog/feed.xml' && cf.status === 200 && !cf.body.includes('application/ld+json')) differences.push('missing schema');
    if (!cf.headers['x-robots-tag']?.includes('noindex')) differences.push('missing preview noindex');
    results.push({ pathname, liveStatus: live.status, cloudflareStatus: cf.status, cloudflareMs: cf.ms, cache: cf.headers['x-ielts-cache'], differences, expectedDifference });
  } catch (error) { results.push({ pathname, error: error.message }); }
  if (results.length % 20 === 0) console.log(`Compared ${results.length}/${paths.length} routes`);
}
for (const rule of config.redirects) {
  const pathname = specimen(rule.source) + '?cf-test=1';
  const response = await get(candidate, pathname);
  const expected = resolveRule(config.redirects, pathname.split('?')[0]);
  results.push({ pathname, cloudflareStatus: response.status, redirect: response.headers.location, differences: response.status === (expected.permanent ? 308 : 307) && response.headers.location === expected.destination + '?cf-test=1' ? [] : ['redirect'] });
}
const failures = results.filter(r => r.error || r.differences.length);
const report = { testedAt: new Date().toISOString(), candidate, production, publishedBlogPages: blog.length, comparedRoutes: paths.length, redirects: config.redirects.length, failures, results };
mkdirSync(new URL('./verification/', import.meta.url), { recursive: true });
writeFileSync(new URL('./verification/comparison.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ candidate, publishedBlogPages: blog.length, comparedRoutes: paths.length, redirects: config.redirects.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
