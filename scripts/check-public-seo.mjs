import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const siteUrl = 'https://www.ieltsai.pro';
const retiredRoutes = {
  '/ielts-writing-checker': '/writing',
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

const sitemap = readFileSync(path.join(root, 'public/sitemap.xml'), 'utf8');
const robots = readFileSync(path.join(root, 'public/robots.txt'), 'utf8');
const llms = readFileSync(path.join(root, 'public/llms.txt'), 'utf8');
const vercel = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));

for (const route of publicRoutes) {
  if (!sitemap.includes(`<loc>${siteUrl}${route}</loc>`)) {
    fail(`sitemap is missing ${route}`);
  }
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

const redirects = new Map((vercel.redirects || []).map(({ source, destination }) => [source, destination]));
for (const [source, destination] of Object.entries(retiredRoutes)) {
  if (redirects.get(source) !== destination) fail(`missing redirect from ${source} to ${destination}`);
  if (redirects.get(`${source}/`) !== destination) {
    fail(`missing trailing-slash redirect from ${source}/ to ${destination}`);
  }
}

for (const rewrite of vercel.rewrites || []) {
  if (Object.hasOwn(retiredRoutes, rewrite.source)) fail(`retired route ${rewrite.source} still rewrites`);
  if (rewrite.destination.includes('/index.html') && rewrite.source !== '/((?!assets/|.*\\.|api/).*)') {
    fail(`standalone static rewrite remains for ${rewrite.source}`);
  }
}

console.log(
  `SEO check passed: ${publicRoutes.length} public routes, ${Object.keys(retiredRoutes).length} retired routes redirected, ${removedStaticPagePaths.length} static pages removed.`
);
