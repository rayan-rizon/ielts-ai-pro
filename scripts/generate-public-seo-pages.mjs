import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDirectory = path.join(root, 'dist');
const sourcePage = readFileSync(path.join(distDirectory, 'index.html'), 'utf8');

const publicPages = [
  {
    path: 'ielts-writing-checker',
    title: 'Free IELTS Writing Checker – Task 1 & 2 Feedback | IELTS Ai Pro',
    description:
      'Paste your Academic IELTS Task 1 or Task 2 response and instantly receive an estimated band score with detailed feedback on all four writing criteria.',
    canonical: 'https://www.ieltsai.pro/ielts-writing-checker',
    imageAlt: 'Student practising Academic IELTS writing with a laptop and notebook',
  },
  {
    path: 'ielts-speaking-practice-ai',
    title: 'AI IELTS Speaking Practice with Feedback | IELTS Ai Pro',
    description:
      'Practise IELTS Speaking Parts 1–3 with an AI simulator, estimated band guidance, and focused feedback on fluency, vocabulary, grammar, and pronunciation.',
    canonical: 'https://www.ieltsai.pro/ielts-speaking-practice-ai',
    imageAlt: 'Adult IELTS learner practising a speaking response with a laptop',
  },
  {
    path: 'cambridge-ielts-practice-tests',
    title: 'Cambridge IELTS Practice Tests Online | IELTS Ai Pro',
    description:
      'Take Cambridge-style IELTS Reading and Listening practice tests online, review answers, estimate band scores, and track the mistakes that affect your result.',
    canonical: 'https://www.ieltsai.pro/cambridge-ielts-practice-tests',
    imageAlt: 'Adult IELTS learner reviewing a computer-based practice test',
  },
].map((page) => ({ ...page, image: 'https://www.ieltsai.pro/ielts-hero-student.webp' }));

function replaceTag(html, expression, replacement, label) {
  if (!expression.test(html)) throw new Error(`Could not find ${label} in the Vite output.`);
  return html.replace(expression, replacement);
}

function renderPublicPage(html, config) {
  const pageSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${config.canonical}#webpage`,
        url: config.canonical,
        name: config.title,
        description: config.description,
        inLanguage: 'en',
      },
      {
        '@type': 'SoftwareApplication',
        name: config.title.replace(' | IELTS Ai Pro', ''),
        url: config.canonical,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  });

  let page = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${config.title}</title>`, 'title');
  page = replaceTag(
    page,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${config.description}" />`,
    'description meta tag'
  );
  page = replaceTag(
    page,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${config.canonical}" />`,
    'canonical link'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${config.title}" />`,
    'Open Graph title'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${config.description}" />`,
    'Open Graph description'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${config.canonical}" />`,
    'Open Graph URL'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image" content="${config.image}" />`,
    'Open Graph image'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image:alt" content="${config.imageAlt}" />`,
    'Open Graph image alt text'
  );
  page = replaceTag(
    page,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${config.title}" />`,
    'Twitter title'
  );
  page = replaceTag(
    page,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${config.description}" />`,
    'Twitter description'
  );
  page = replaceTag(
    page,
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:image" content="${config.image}" />`,
    'Twitter image'
  );
  return replaceTag(
    page,
    /<script\s+data-static-seo\s+type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script data-static-seo type="application/ld+json">${pageSchema}</script>`,
    'static structured data'
  );
}

for (const page of publicPages) {
  const outputDirectory = path.join(distDirectory, page.path);
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(path.join(outputDirectory, 'index.html'), renderPublicPage(sourcePage, page));
}
