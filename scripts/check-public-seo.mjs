import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { renderFeed } from '../api/feed.js';
import { renderLlmsTxt } from '../api/llms.js';
import { renderSitemap } from '../api/sitemap.js';

const root = process.cwd();
const siteUrl = 'https://www.ieltsai.pro';
const retiredRoutes = {
  '/ielts-speaking-practice-ai': '/speaking',
  '/ielts-mock-test-online': '/cambridge-tests',
  '/cambridge-ielts-practice-tests': '/cambridge-tests',
  '/free-ielts-practice-tests': '/cambridge-tests',
  '/ai-ielts-preparation': '/signup',
  '/ielts-band-score-feedback': '/analytics',
};
const removedStaticPagePaths = [
  '/about',
  '/ai-ielts-preparation',
  '/cambridge-ielts-practice-tests',
  '/contact',
  '/free-ielts-practice-tests',
  '/ielts-band-score-calculator',
  '/ielts-band-score-feedback',
  '/ielts-mock-test-online',
  '/ielts-speaking-practice-ai',
  '/ielts-writing-checker',
  '/privacy',
  '/terms',
];
const publicRoutes = [
  '/',
  '/ielts-writing-checker',
  '/ielts-band-score-calculator',
  '/blog',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

const fail = (message) => {
  throw new Error(`SEO check failed: ${message}`);
};

const staticSitemapPath = path.join(root, 'public/sitemap.xml');
if (existsSync(staticSitemapPath)) {
  fail('public/sitemap.xml shadows the dynamic /api/sitemap rewrite');
}
const staticLlmsPath = path.join(root, 'public/llms.txt');
if (existsSync(staticLlmsPath)) {
  fail('public/llms.txt shadows the dynamic /api/llms rewrite');
}
if (existsSync(path.join(root, 'public/blog/feed.xml'))) {
  fail('public/blog/feed.xml shadows the dynamic /api/feed rewrite');
}

const validationArticle = {
  title: 'SEO Validation Article',
  description: 'A validation article for public discovery routes.',
  slug: 'seo-validation-article',
  category: 'IELTS guide',
  reading_minutes: 5,
  published_at: '2026-07-27T00:00:00Z',
  updated_at: '2026-07-27T00:00:00Z',
};
const sitemap = renderSitemap([validationArticle]);
const llms = renderLlmsTxt([validationArticle]);
const feed = renderFeed([validationArticle]);
const robots = readFileSync(path.join(root, 'public/robots.txt'), 'utf8');
const vercel = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const appSource = readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const indexHtml = readFileSync(path.join(root, 'index.html'), 'utf8');

if (!appSource.includes("path: '/ielts-writing-checker'")) {
  fail('the public writing checker React route is missing');
}

for (const route of publicRoutes) {
  if (!sitemap.includes(`<loc>${siteUrl}${route}</loc>`)) {
    fail(`sitemap is missing ${route}`);
  }
}

const sitemapLocations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
if (new Set(sitemapLocations).size !== sitemapLocations.length) {
  fail('sitemap contains duplicate canonical URLs');
}
if (!sitemap.includes(`<loc>${siteUrl}/blog/seo-validation-article</loc>`)) {
  fail('dynamic sitemap does not include published article routes');
}

if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
  fail('robots.txt does not reference the canonical sitemap');
}

if (!llms.startsWith('# IELTS Ai Pro')) fail('llms.txt must start with an H1');
for (const route of publicRoutes.filter((route) => !['/privacy', '/terms'].includes(route))) {
  if (!llms.includes(`${siteUrl}${route}`)) fail(`llms.txt is missing ${route}`);
}
if (!llms.includes(`${siteUrl}/blog/seo-validation-article`)) {
  fail('dynamic llms.txt does not include published article routes');
}
if (
  !feed.includes('<rss version="2.0"') ||
  !feed.includes(`${siteUrl}/blog/seo-validation-article`)
) {
  fail('dynamic RSS feed does not include published article routes');
}
for (const crawler of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot']) {
  if (!robots.includes(crawler)) fail(`robots.txt does not document access for ${crawler}`);
}

const title = indexHtml.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
const description = indexHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/)?.[1]?.trim();
const canonical = indexHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1];
if (!title || title.length < 30 || title.length > 65) {
  fail('homepage title must be between 30 and 65 characters');
}
if (!description || description.length < 120 || description.length > 170) {
  fail('homepage description must be between 120 and 170 characters');
}
if (canonical !== `${siteUrl}/`) fail('homepage canonical is missing or incorrect');

const staticJsonLd = indexHtml.match(
  /<script[^>]*data-static-seo[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/
)?.[1];
if (!staticJsonLd) fail('homepage static structured data is missing');
try {
  JSON.parse(staticJsonLd);
} catch {
  fail('homepage static structured data is not valid JSON');
}

for (const route of Object.keys(retiredRoutes)) {
  if (sitemap.includes(`${siteUrl}${route}`)) fail(`sitemap still includes retired route ${route}`);
  if (robots.includes(`Allow: ${route}`)) fail(`robots still promotes retired route ${route}`);
  if (llms.includes(`${siteUrl}${route}`)) fail(`llms.txt still promotes retired route ${route}`);
}

for (const route of removedStaticPagePaths) {
  if (existsSync(path.join(root, 'public', route.slice(1), 'index.html'))) {
    fail(`removed static page still exists for ${route}`);
  }
}

const redirects = new Map(
  (vercel.redirects || []).map(({ source, destination }) => [source, destination])
);
for (const [source, destination] of Object.entries(retiredRoutes)) {
  if (redirects.get(source) !== destination)
    fail(`missing redirect from ${source} to ${destination}`);
  if (redirects.get(`${source}/`) !== destination) {
    fail(`missing trailing-slash redirect from ${source}/ to ${destination}`);
  }
}

const rewrites = new Map(
  (vercel.rewrites || []).map(({ source, destination }) => [source, destination])
);
const requiredRewrites = {
  '/sitemap.xml': '/api/sitemap',
  '/llms.txt': '/api/llms',
  '/blog/feed.xml': '/api/feed',
  '/blog': '/api/blog',
  '/blog/:slug': '/api/blog?slug=:slug',
};
for (const [source, destination] of Object.entries(requiredRewrites)) {
  if (rewrites.get(source) !== destination) {
    fail(`missing server-rendered rewrite from ${source} to ${destination}`);
  }
}

for (const rewrite of vercel.rewrites || []) {
  if (Object.hasOwn(retiredRoutes, rewrite.source))
    fail(`retired route ${rewrite.source} still rewrites`);
  if (
    rewrite.destination.includes('/index.html') &&
    !['/:path*', '/(.*)', '/:path(.*)'].includes(rewrite.source)
  ) {
    fail(`standalone static rewrite remains for ${rewrite.source}`);
  }
}

if (!indexHtml.includes('type="application/rss+xml"')) {
  fail('homepage does not advertise the published article feed');
}
if (!indexHtml.includes(`${siteUrl}/llms.txt`)) {
  fail('homepage does not advertise the dynamic llms.txt file');
}

console.log(
  `SEO check passed: ${publicRoutes.length} public routes, server-rendered blog, sitemap, llms.txt and RSS routes, valid homepage metadata/schema, ${Object.keys(retiredRoutes).length} retired routes redirected.`
);
