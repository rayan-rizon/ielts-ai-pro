import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDirectory = path.join(root, 'dist');
const sourcePage = readFileSync(path.join(distDirectory, 'index.html'), 'utf8');

const writingChecker = {
  path: 'ielts-writing-checker',
  title: 'Free IELTS Writing Checker – Task 1 & 2 Band Score & Feedback | IELTS Ai Pro',
  description:
    'Paste your Academic IELTS Task 1 or Task 2 response and instantly receive an estimated band score with detailed feedback on all four writing criteria.',
  canonical: 'https://www.ieltsai.pro/ielts-writing-checker',
  image: 'https://www.ieltsai.pro/ielts-hero-student.webp',
  imageAlt: 'Student practising Academic IELTS writing with a laptop and notebook',
};

function replaceTag(html, expression, replacement, label) {
  if (!expression.test(html)) throw new Error(`Could not find ${label} in the Vite output.`);
  return html.replace(expression, replacement);
}

function renderWritingCheckerPage(html) {
  const pageSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${writingChecker.canonical}#webpage`,
    url: writingChecker.canonical,
    name: 'Free IELTS Writing Checker for Task 1 & Task 2',
    description: writingChecker.description,
    mainEntity: {
      '@type': 'WebApplication',
      name: 'Free IELTS Writing Checker for Task 1 & Task 2',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  });

  let page = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${writingChecker.title}</title>`, 'title');
  page = replaceTag(
    page,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${writingChecker.description}" />`,
    'description meta tag'
  );
  page = replaceTag(
    page,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${writingChecker.canonical}" />`,
    'canonical link'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${writingChecker.title}" />`,
    'Open Graph title'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${writingChecker.description}" />`,
    'Open Graph description'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${writingChecker.canonical}" />`,
    'Open Graph URL'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image" content="${writingChecker.image}" />`,
    'Open Graph image'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image:alt" content="${writingChecker.imageAlt}" />`,
    'Open Graph image alt text'
  );
  page = replaceTag(
    page,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${writingChecker.title}" />`,
    'Twitter title'
  );
  page = replaceTag(
    page,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${writingChecker.description}" />`,
    'Twitter description'
  );
  page = replaceTag(
    page,
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:image" content="${writingChecker.image}" />`,
    'Twitter image'
  );
  return replaceTag(
    page,
    /<script\s+data-static-seo\s+type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script data-static-seo type="application/ld+json">${pageSchema}</script>`,
    'static structured data'
  );
}

const outputDirectory = path.join(distDirectory, writingChecker.path);
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(path.join(outputDirectory, 'index.html'), renderWritingCheckerPage(sourcePage));
