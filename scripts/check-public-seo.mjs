import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { renderFeed } from '../api/feed.js';
import { renderLlmsTxt } from '../api/llms.js';
import { renderSitemap } from '../api/sitemap.js';

const root = process.cwd();
const siteUrl = 'https://www.ieltsai.pro';
const retiredRoutes = {
  '/ielts-mock-test-online': '/cambridge-ielts-practice-tests',
  '/free-ielts-practice-tests': '/cambridge-ielts-practice-tests',
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
  '/ielts-speaking-practice-ai',
  '/cambridge-ielts-practice-tests',
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
const faviconSvg = readFileSync(path.join(root, 'public/favicon.svg'), 'utf8');
const notFoundPath = path.join(root, 'public/404.html');
if (!existsSync(notFoundPath)) fail('public/404.html is missing');
const notFoundHtml = readFileSync(notFoundPath, 'utf8');
// Every route here gets a pre-rendered head from generate-public-seo-pages.mjs.
// Routes rewritten straight to the bare shell inherit the homepage's canonical,
// which makes them self-disowning duplicates and turns any sitemap entry for them
// into an error, so a new public route belongs in the generator and in this map.
const generatedSeoPages = {
  '/ielts-writing-checker': {
    path: path.join(root, 'dist/ielts-writing-checker/index.html'),
    title: 'Free IELTS Writing Checker – Task 1 & 2 | IELTS Ai Pro',
  },
  '/ielts-speaking-practice-ai': {
    path: path.join(root, 'dist/ielts-speaking-practice-ai/index.html'),
    title: 'AI IELTS Speaking Practice with Feedback | IELTS Ai Pro',
  },
  '/cambridge-ielts-practice-tests': {
    path: path.join(root, 'dist/cambridge-ielts-practice-tests/index.html'),
    title: 'Cambridge IELTS Practice Tests Online | IELTS Ai Pro',
  },
  '/about': {
    path: path.join(root, 'dist/about/index.html'),
    title: 'About IELTS Ai Pro - AI-Powered IELTS Preparation Platform',
  },
  '/contact': {
    path: path.join(root, 'dist/contact/index.html'),
    title: 'Contact Support & Help Desk - IELTS Ai Pro',
  },
  '/ielts-band-score-calculator': {
    path: path.join(root, 'dist/ielts-band-score-calculator/index.html'),
    title: 'IELTS Band Score Calculator (Overall + Raw Score) | IELTS Ai Pro',
  },
  '/privacy': {
    path: path.join(root, 'dist/privacy/index.html'),
    title: 'Privacy Policy & Data Security | IELTS Ai Pro',
  },
  '/terms': {
    path: path.join(root, 'dist/terms/index.html'),
    title: 'Terms of Service & Usage Policy | IELTS Ai Pro',
  },
};

for (const route of Object.keys(generatedSeoPages)) {
  if (!appSource.includes(`path: '${route}'`)) fail(`the public React route ${route} is missing`);
}

// Every URL the sitemap advertises must be served by a page that names itself as
// canonical; otherwise the sitemap is nominating pages that point elsewhere.
for (const [route, config] of Object.entries(generatedSeoPages)) {
  if (!sitemap.includes(`<loc>${siteUrl}${route}</loc>`)) continue;
  const rewrite = (vercel.rewrites || []).find((entry) => entry.source === route);
  if (rewrite?.destination === '/index.html') {
    fail(`${route} is in the sitemap but rewrites to the shell, inheriting the homepage canonical`);
  }
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
if (!title || title.length < 30 || title.length > 60) {
  fail('homepage title must be between 30 and 60 characters');
}
if (!description || description.length < 120 || description.length > 170) {
  fail('homepage description must be between 120 and 170 characters');
}
if (canonical !== `${siteUrl}/`) fail('homepage canonical is missing or incorrect');
if (!indexHtml.includes('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />')) {
  fail('homepage must declare the stable crawler-safe favicon');
}
if (!existsSync(path.join(root, 'public/favicon.ico'))) {
  fail('public/favicon.ico is missing for clients that request the conventional favicon URL');
}
if (!faviconSvg.includes('<path fill="#0B0E2A"')) {
  fail('the crawler-safe favicon must keep the original high-contrast light-surface monogram');
}
if (faviconSvg.includes('prefers-color-scheme') || faviconSvg.includes('var(--')) {
  fail('the crawler-safe favicon must not depend on the crawler color scheme');
}
if (!indexHtml.includes('<h1>IELTS Practice. Smarter with AI.</h1>')) {
  fail('homepage static H1 is missing or does not match the visible search intent');
}
if (!notFoundHtml.includes('<meta name="robots" content="noindex, follow"')) {
  fail('custom 404 page must be noindex, follow');
}
if (!notFoundHtml.includes('<h1>Page not found</h1>')) {
  fail('custom 404 page is missing a clear H1');
}

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
  if (route === '/ielts-writing-checker') continue;
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
  '/ielts-writing-checker': '/ielts-writing-checker/index.html',
  '/ielts-speaking-practice-ai': '/ielts-speaking-practice-ai/index.html',
  '/cambridge-ielts-practice-tests': '/cambridge-ielts-practice-tests/index.html',
};
for (const [source, destination] of Object.entries(requiredRewrites)) {
  if (rewrites.get(source) !== destination) {
    fail(`missing server-rendered rewrite from ${source} to ${destination}`);
  }
}

const catchAllSources = new Set(['/:path*', '/(.*)', '/:path(.*)']);
for (const source of catchAllSources) {
  if (rewrites.has(source)) {
    fail(`catch-all SPA rewrite ${source} creates soft 404 responses`);
  }
}

const appRoutes = Array.from(appSource.matchAll(/\bpath:\s*'([^']+)'/g), (match) => match[1]);
for (const route of appRoutes) {
  if (route === '/' || route === '*') continue;
  if (!rewrites.has(route) && !redirects.has(route)) {
    fail(`React route ${route} has no direct-request rewrite or redirect`);
  }
}

for (const rewrite of vercel.rewrites || []) {
  if (Object.hasOwn(retiredRoutes, rewrite.source))
    fail(`retired route ${rewrite.source} still rewrites`);
  if (
    rewrite.destination.includes('/index.html') &&
    !appRoutes.includes(rewrite.source) &&
    !Object.keys(generatedSeoPages).includes(rewrite.source)
  ) {
    fail(`index rewrite ${rewrite.source} does not correspond to a React route`);
  }
}

for (const [route, config] of Object.entries(generatedSeoPages)) {
  if (!existsSync(config.path)) continue;
  const html = readFileSync(config.path, 'utf8');
  if (!html.includes(`<title>${config.title}</title>`)) {
    fail(`generated ${route} page is missing its page-specific title`);
  }
  if (!html.includes(`href="${siteUrl}${route}"`)) {
    fail(`generated ${route} page is missing its canonical URL`);
  }
}

if (!indexHtml.includes('type="application/rss+xml"')) {
  fail('homepage does not advertise the published article feed');
}
if (!indexHtml.includes(`${siteUrl}/llms.txt`)) {
  fail('homepage does not advertise the dynamic llms.txt file');
}

// The crawler fallback in index.html is the only internal link graph a
// non-rendering crawler ever sees, so it has to point at the canonical routes
// and never at a retired URL that 301s into a robots-disallowed page.
const staticDirectory = indexHtml.match(
  /<nav aria-label="Static Site Directory">([\s\S]*?)<\/nav>/
)?.[1];
if (!staticDirectory) fail('index.html is missing the static crawler directory');

const staticDirectoryHrefs = Array.from(
  staticDirectory.matchAll(/href="([^"]+)"/g),
  (match) => match[1]
);
for (const route of Object.keys(retiredRoutes)) {
  if (staticDirectoryHrefs.includes(route)) {
    fail(`static crawler directory still links retired route ${route}`);
  }
}
for (const route of publicRoutes) {
  if (!staticDirectoryHrefs.includes(route)) {
    fail(`static crawler directory is missing canonical route ${route}`);
  }
}

// A logo URL that falls through the SPA rewrite resolves to HTML, which makes
// the Organization markup unusable, so the file has to exist in public/.
const staticLogoPath = JSON.parse(staticJsonLd)['@graph']?.find(
  (node) => node['@type'] === 'Organization'
)?.logo?.url;
if (!staticLogoPath?.startsWith(`${siteUrl}/`)) {
  fail('homepage Organization markup is missing a same-origin logo URL');
}
if (!existsSync(path.join(root, 'public', staticLogoPath.slice(`${siteUrl}/`.length)))) {
  fail(`homepage Organization logo ${staticLogoPath} does not exist in public/`);
}

console.log(
  `SEO check passed: ${publicRoutes.length} public routes, server-rendered blog, sitemap, llms.txt and RSS routes, valid homepage metadata/schema, ${Object.keys(retiredRoutes).length} retired routes redirected.`
);
