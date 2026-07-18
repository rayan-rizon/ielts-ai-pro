import sanitizeHtml from 'sanitize-html';
import process from 'node:process';

const SITE_URL = 'https://www.ieltsai.pro';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.webp`;
const ARTICLE_FIELDS = [
  'id',
  'title',
  'description',
  'meta_description',
  'slug',
  'content',
  'seo_tags',
  'category',
  'reading_minutes',
  'published_at',
  'created_at',
  'updated_at',
  'thumbnail_url',
  'featured',
].join(',');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function practicePath(category) {
  return (
    {
      Writing: '/writing',
      Speaking: '/speaking',
      Reading: '/reading',
      Listening: '/listening',
      'Study Planning': '/ielts-mock-test-online',
      'Exam Updates': '/ielts-mock-test-online',
    }[category] || '/signup'
  );
}

function practiceLabel(category) {
  if (category === 'Study Planning' || category === 'Exam Updates') return 'Start a mock test';
  return `Start ${category || 'IELTS'} practice`;
}

function slugifyHeading(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function prepareArticle(content) {
  const sanitized = sanitizeHtml(content || '', {
    allowedTags: [
      'p',
      'br',
      'h2',
      'h3',
      'h4',
      'strong',
      'em',
      'u',
      's',
      'blockquote',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'code',
      'pre',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'section',
      'aside',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      th: ['scope', 'colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
      section: ['data-guide-refresh'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { a: ['http', 'https', 'mailto'], img: ['http', 'https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: {
          ...attributes,
          rel: attributes.href?.startsWith('/') ? '' : 'noopener noreferrer',
        },
      }),
      img: (tagName, attributes) => ({
        tagName,
        attribs: { ...attributes, loading: 'lazy' },
      }),
    },
  });
  const seenIds = new Map();
  const toc = [];
  const html = sanitized.replace(/<h([23])>([\s\S]*?)<\/h\1>/gi, (match, level, inner) => {
    const text = sanitizeHtml(inner, { allowedTags: [], allowedAttributes: {} });
    const baseId = slugifyHeading(text) || 'section';
    const count = seenIds.get(baseId) || 0;
    const id = count ? `${baseId}-${count + 1}` : baseId;
    seenIds.set(baseId, count + 1);
    toc.push({ id, text, level: Number(level) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html, toc };
}

function absoluteImageUrl(path) {
  if (!path) return `${SITE_URL}/ielts-hero-student.webp`;
  try {
    return new URL(path, SITE_URL).toString();
  } catch {
    return `${SITE_URL}/ielts-hero-student.webp`;
  }
}

const CSS = `
  @font-face{font-family:"Plus Jakarta Sans";src:url('/fonts/plus-jakarta-sans-latin-normal.woff2') format('woff2');font-style:normal;font-display:swap;font-weight:200 800}
  :root{color-scheme:light;--page:#f7f9ff;--surface:#fff;--ink:#101936;--muted:#62708a;--indigo:#4f46e5;--violet:#7c3aed;--line:#e5e9f4;--soft:#eef2ff}
  *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--page);color:var(--ink);font-family:"Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;line-height:1.7}a{color:inherit}.skip{position:absolute;left:-999px;top:10px;background:#fff;padding:10px 14px;z-index:999}.skip:focus{left:10px}
  header{position:sticky;top:0;z-index:100;border-bottom:1px solid var(--line);background:rgba(255,255,255,.96);backdrop-filter:blur(16px)}.site-nav{max-width:1240px;height:72px;margin:auto;padding:0 22px;display:flex;align-items:center;justify-content:space-between;gap:22px}.brand{display:flex;align-items:center;gap:9px;font-weight:800;text-decoration:none;font-size:19px;white-space:nowrap}.brand img{width:32px;height:32px}.nav-center,.nav-actions{display:flex;align-items:center;gap:3px}.nav-center>a,.nav-center summary{display:flex;align-items:center;gap:4px;padding:9px 11px;border-radius:9px;text-decoration:none;color:#536078;font-size:13px;font-weight:700;cursor:pointer;list-style:none}.nav-center summary::-webkit-details-marker{display:none}.nav-center>a:hover,.nav-center summary:hover{background:#f5f7fb;color:var(--indigo)}.nav-center details{position:relative}.nav-center details[open] summary{background:var(--soft);color:var(--indigo)}.dropdown{position:absolute;left:50%;top:42px;min-width:215px;transform:translateX(-50%);padding:8px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 24px 60px -28px rgba(30,41,59,.45)}.dropdown a{display:block;padding:9px 10px;border-radius:8px;text-decoration:none;color:#536078;font-size:12px;font-weight:650}.dropdown a:hover{background:var(--soft);color:var(--indigo)}.login{padding:8px 14px;border:1px solid var(--line);border-radius:9px;text-decoration:none;font-size:13px;font-weight:700}.button{display:inline-flex;align-items:center;justify-content:center;border-radius:9px;background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;padding:9px 16px;text-decoration:none;font-size:13px;font-weight:750;white-space:nowrap}.mobile-menu{display:none;position:relative}.mobile-menu summary{display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:9px;cursor:pointer;list-style:none;font-weight:800}.mobile-menu summary::-webkit-details-marker{display:none}.mobile-menu .dropdown{left:auto;right:0;top:43px;transform:none;min-width:220px}
  main{min-height:70vh}.shell{max-width:1240px;margin:auto;padding-left:22px;padding-right:22px}.eyebrow,.category{display:inline-flex;width:max-content;align-items:center;border:1px solid #dfe3ff;border-radius:999px;background:#f5f6ff;color:var(--indigo);padding:5px 10px;font-size:11px;font-weight:750}.meta{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:12px}.hand{margin:5px 0 12px;color:#635bff;font-family:"Segoe Print","Bradley Hand",cursive;font-size:32px;font-weight:700;line-height:1.25}h1,h2,h3{letter-spacing:-.035em}h1{font-size:52px;line-height:1.09;margin:16px 0}h2{font-size:27px;line-height:1.25}h3{font-size:21px;line-height:1.35}.intro{max-width:670px;color:var(--muted);font-size:17px}
  .index-hero{position:relative;overflow:hidden;border-bottom:1px solid #e2e6ff;background:#fff;padding:50px 0}.index-hero:before{position:absolute;inset:0;content:"";background:radial-gradient(circle at 15% 20%,rgba(99,102,241,.09),transparent 28%),radial-gradient(circle at 90% 10%,rgba(45,212,191,.08),transparent 25%)}.hero-grid{position:relative;display:grid;grid-template-columns:.95fr 1.05fr;gap:46px;align-items:center}.hero-photo{position:relative;border:1px solid #dfe3ff;border-radius:28px;background:#f0f2ff;padding:7px;box-shadow:0 30px 70px -42px rgba(79,70,229,.55)}.hero-photo img{display:block;width:100%;aspect-ratio:16/10;border-radius:22px;object-fit:cover}.note{position:absolute;z-index:2;padding:10px 13px;border-radius:7px;background:#e9ddff;color:#5b21b6;font-size:11px;font-weight:700;box-shadow:0 12px 30px -14px rgba(76,29,149,.5)}.note.one{left:-14px;top:48px;transform:rotate(-5deg)}.note.two{right:-8px;bottom:42px;transform:rotate(5deg);background:#dff7e9;color:#047857}
  .category-rail{position:sticky;top:72px;z-index:30;border-bottom:1px solid var(--line);background:rgba(255,255,255,.96);box-shadow:0 8px 22px -20px #64748b}.category-rail .shell{display:flex;gap:7px;overflow:auto;padding-top:11px;padding-bottom:11px}.category-rail span{white-space:nowrap;border:1px solid transparent;border-radius:10px;padding:7px 13px;color:#59667e;font-size:12px;font-weight:700}.category-rail span:first-child{border-color:#a5b4fc;background:#eef2ff;color:var(--indigo)}
  .index-content{padding:40px 0 80px}.section-title{margin:0 0 18px;font-size:23px}.content-grid{display:grid;grid-template-columns:minmax(0,1fr) 285px;gap:22px;align-items:start}.featured{display:grid;grid-template-columns:.9fr 1.1fr;overflow:hidden;margin-bottom:30px;border:1px solid var(--line);border-radius:18px;background:#fff;text-decoration:none;box-shadow:0 18px 55px -42px rgba(15,23,42,.4)}.featured-image{position:relative;min-height:280px;overflow:hidden}.featured-image img{width:100%;height:100%;object-fit:cover;transition:transform .6s}.featured:hover .featured-image img{transform:scale(1.04)}.featured-image .category{position:absolute;left:16px;top:16px;background:var(--indigo);color:#fff}.featured-copy{display:flex;flex-direction:column;padding:30px}.featured-copy h2{margin:16px 0 10px;font-size:29px}.featured-copy p{margin:0;color:var(--muted);font-size:14px}.featured-copy .meta{margin-top:auto;padding-top:22px}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}.card{overflow:hidden;border:1px solid var(--line);border-radius:17px;background:#fff;text-decoration:none;transition:.25s}.card:hover{transform:translateY(-3px);border-color:#c7d2fe;box-shadow:0 18px 45px -36px rgba(79,70,229,.5)}.card-visual{height:138px;overflow:hidden;background:var(--soft)}.card-visual img{width:100%;height:100%;object-fit:cover;opacity:.88;transition:transform .5s}.card:hover img{transform:scale(1.05)}.card-copy{padding:17px}.card h2{font-size:17px;line-height:1.35;margin:12px 0 8px}.card p{display:-webkit-box;overflow:hidden;margin:0;color:var(--muted);font-size:12px;-webkit-line-clamp:3;-webkit-box-orient:vertical}.card .meta{margin-top:15px}.sidebar{position:sticky;top:135px;display:grid;gap:17px}.side-card{border:1px solid var(--line);border-radius:17px;background:#fff;padding:18px}.side-card h2{margin:0 0 13px;font-size:16px}.trend{display:flex;gap:10px;padding:9px 0;border-top:1px solid #f0f2f7;text-decoration:none}.trend:first-of-type{border-top:0}.trend b{display:flex;width:29px;height:29px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:50%;background:#eef2ff;color:var(--indigo);font-size:10px}.trend span{font-size:11px;font-weight:700;line-height:1.45}.practice-card{overflow:hidden;border-radius:17px;padding:22px;background:linear-gradient(145deg,#4f46e5,#8b5cf6);color:#fff}.practice-card h2{margin:10px 0 8px;font-size:20px}.practice-card p{margin:0 0 18px;color:#e7e7ff;font-size:13px}.practice-card .button{background:#fff;color:var(--indigo)}
  .article-hero{position:relative;overflow:hidden;border-bottom:1px solid #e2e6ff;background:#fff;padding:44px 0}.article-hero:before{position:absolute;inset:0;content:"";background:radial-gradient(circle at 12% 25%,rgba(99,102,241,.08),transparent 26%),radial-gradient(circle at 90% 10%,rgba(45,212,191,.08),transparent 24%)}.article-hero-grid{position:relative;display:grid;grid-template-columns:.95fr 1.05fr;gap:38px;align-items:center}.article-photo{border:1px solid #dfe3ff;border-radius:25px;background:#f0f2ff;padding:7px;box-shadow:0 28px 70px -42px rgba(79,70,229,.5)}.article-photo img{display:block;width:100%;aspect-ratio:16/10;border-radius:19px;object-fit:cover}.article-layout{display:grid;grid-template-columns:minmax(0,1fr) 285px;gap:22px;align-items:start;max-width:1120px;padding-top:30px;padding-bottom:70px}.article-card{border:1px solid var(--line);border-radius:18px;background:#fff;padding:34px 38px;box-shadow:0 18px 55px -45px rgba(15,23,42,.4)}.article{font-size:16.5px;line-height:1.78}.article h2,.article h3{scroll-margin-top:105px}.article h2{margin:1.8em 0 .6em;font-size:26px}.article h3{margin:1.6em 0 .5em;font-size:20px}.article p{margin:0 0 1.25em;color:#334155}.article li{margin:.4em 0}.article blockquote{margin:2em 0;padding:18px 22px;border-left:4px solid var(--indigo);background:linear-gradient(90deg,#eef2ff,#f7f3ff);border-radius:0 10px 10px 0;color:#4f46e5;font-size:17px;font-weight:650}.article a{color:var(--indigo);font-weight:700;text-underline-offset:4px}.article img{max-width:100%;height:auto;border-radius:14px}.tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:38px;padding-top:20px;border-top:1px solid var(--line)}.tag{border-radius:999px;background:#eef2ff;color:var(--indigo);padding:5px 9px;font-size:11px;font-weight:650}.toc-card{border:1px solid var(--line);border-radius:17px;background:#fff;padding:18px}.toc-card h2{margin:0 0 12px;font-size:15px}.toc-card a{display:block;padding:7px 8px;border-radius:7px;text-decoration:none;color:#5c6981;font-size:11px;font-weight:600}.toc-card a:hover{background:#eef2ff;color:var(--indigo)}.cta{margin-top:30px;border:1px solid #dfe3ff;border-radius:15px;padding:24px;background:linear-gradient(120deg,#eef2ff,#f6f0ff);display:flex;align-items:center;justify-content:space-between;gap:20px}.cta h2{margin:4px 0 5px;font-size:21px}.cta p{margin:0;color:var(--muted);font-size:12px}
  .article table{display:block;width:100%;overflow-x:auto;margin:1.8em 0;border-spacing:0;border-collapse:separate;border:1px solid var(--line);border-radius:12px;font-size:13px}.article th,.article td{min-width:125px;padding:12px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.article th{background:#eef2ff;color:#3730a3;font-weight:750}.article tr:last-child td{border-bottom:0}.article aside{margin:1.6em 0;padding:17px 19px;border:1px solid #c7d2fe;border-radius:12px;background:linear-gradient(120deg,#eef2ff,#f5f3ff)}.article aside p{margin:0;color:#3730a3}
  footer{border-top:1px solid var(--line);padding:32px 22px;background:#fff;color:var(--muted);font-size:12px}footer div{max-width:1240px;margin:auto;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
  @media(max-width:1000px){.nav-center{display:none}.mobile-menu{display:block}.hero-grid,.article-hero-grid{grid-template-columns:1fr 1fr}.content-grid,.article-layout{grid-template-columns:minmax(0,1fr) 250px}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}h1{font-size:43px}}
  @media(max-width:760px){.site-nav{height:64px}.category-rail{top:64px}.login{display:none}.hero-grid,.article-hero-grid,.content-grid,.article-layout,.featured{grid-template-columns:1fr}.index-hero,.article-hero{padding:38px 0}.hero-photo,.article-photo{margin-top:5px}.note{display:none}.sidebar{position:static}.cards{grid-template-columns:1fr}.featured-image{min-height:220px}.featured-copy{padding:23px}.article-card{padding:26px 20px}.article-layout{padding-top:22px}.hand{font-size:25px}h1{font-size:34px}.index-hero h1{font-size:38px}.cta{align-items:flex-start;flex-direction:column}}
`;

function layout({
  title,
  description,
  canonical,
  type = 'website',
  robots = 'index, follow, max-image-preview:large',
  body,
  structuredData,
  image = DEFAULT_IMAGE,
}) {
  const fullTitle = title.includes('IELTS Ai Pro') ? title : `${title} | IELTS Ai Pro`;
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <link rel="canonical" href="${escapeHtml(canonical)}"><link rel="icon" href="/favicon.webp" type="image/webp">
  <meta property="og:title" content="${escapeHtml(fullTitle)}"><meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="${type}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:site_name" content="IELTS Ai Pro"><meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(fullTitle)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}">
  ${structuredData.map((item) => `<script type="application/ld+json">${safeJson(item)}</script>`).join('')}
  <style>${CSS}</style>
</head><body>
  <a class="skip" href="#main">Skip to content</a>
  <header><nav class="site-nav" aria-label="Primary">
    <a class="brand" href="/"><img src="/favicon.webp" alt="">IELTS Ai Pro</a>
    <div class="nav-center">
      <a href="/#features">Platform</a>
      <a href="/#how-it-works">How it works</a>
      <a href="/blog">Blog</a>
      <a href="/ielts-band-score-calculator">Calculator</a>
      <a href="/#pricing">Pricing</a>
      <a href="/#faq">FAQ</a>
    </div>
    <div class="nav-actions"><a class="login" href="/login">Log in</a><a class="button" href="/signup">Start Free</a><details class="mobile-menu"><summary aria-label="Open navigation">☰</summary><div class="dropdown"><a href="/#features">Platform</a><a href="/#how-it-works">How it works</a><a href="/blog">Blog</a><a href="/ielts-band-score-calculator">Calculator</a><a href="/#pricing">Pricing</a><a href="/#faq">FAQ</a><a href="/login">Log in</a></div></details></div>
  </nav></header>
  ${body}
  <footer><div><span>© 2026 IELTS Ai Pro</span><span>Independent preparation platform. AI feedback and bands are practice estimates, not official IELTS results.</span></div></footer>
</body></html>`;
}

function renderIndex(posts) {
  const description =
    'Practical IELTS Writing, Speaking, Reading, and Listening guides with clear strategies, study plans, and direct links to online practice.';
  const featured = posts.find((post) => post.featured) || posts[0];
  const remainingPosts = featured ? posts.filter((post) => post.id !== featured.id) : posts;
  const featuredCard = featured
    ? `<a class="featured" href="/blog/${escapeHtml(featured.slug)}">
        <div class="featured-image"><img src="${escapeHtml(featured.thumbnail_url || '/ielts-hero-student.webp')}" alt="${escapeHtml(`${featured.title} - featured IELTS preparation guide`)}"><span class="category">Featured story</span></div>
        <div class="featured-copy"><span class="category">Featured · ${escapeHtml(featured.category || 'IELTS guide')}</span>
          <h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.description)}</p>
          <span class="meta"><span>${escapeHtml(formatDate(featured.published_at || featured.created_at))}</span><span>${Number(featured.reading_minutes) || 6} min read</span><span>Read featured article →</span></span>
        </div>
      </a>`
    : '';
  const cards = remainingPosts
    .map(
      (post) => `<a class="card" href="/blog/${escapeHtml(post.slug)}">
        <div class="card-visual"><img src="${escapeHtml(post.thumbnail_url || '/ielts-hero-student.webp')}" alt="${escapeHtml(`${post.title} - IELTS preparation guide`)}"></div>
        <div class="card-copy"><span class="category">${escapeHtml(post.category || 'IELTS guide')}</span>
          <h2>${escapeHtml(post.title)}</h2><p>${escapeHtml(post.description)}</p>
          <span class="meta"><span>${Number(post.reading_minutes) || 6} min read</span><span>Read guide →</span></span>
        </div>
      </a>`
    )
    .join('');
  const trending = posts
    .slice(0, 5)
    .map(
      (post, index) =>
        `<a class="trend" href="/blog/${escapeHtml(post.slug)}"><b>${String(index + 1).padStart(2, '0')}</b><span>${escapeHtml(post.title)}<small style="display:block;color:#8a94a8;font-weight:500">${Number(post.reading_minutes) || 6} min read</small></span></a>`
    )
    .join('');
  return layout({
    title: 'IELTS Preparation Blog: Practical Band Score Guides',
    description,
    canonical: `${SITE_URL}/blog`,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'IELTS Preparation Blog',
        url: `${SITE_URL}/blog`,
        description,
      },
    ],
    body: `<main id="main">
      <section class="index-hero"><div class="shell hero-grid"><div><span class="eyebrow">▣ IELTS blog library</span><h1>Insights and strategies for IELTS success</h1><p class="hand">Learn smarter. Score higher.</p><p class="intro">Expert guidance, focused study plans, and practical drills to help you prepare with confidence and improve the skills behind your target band.</p></div><div class="hero-photo"><span class="note one">Consistency builds excellence</span><img src="/ielts-hero-student.webp" alt="IELTS learner studying with a laptop and notebook"><span class="note two">Plan · Practise · Progress</span></div></div></section>
      <div class="category-rail"><div class="shell"><span>▦ All articles</span><span>✎ Writing</span><span>◉ Speaking</span><span>▤ Reading</span><span>◖ Listening</span><span>☆ Study planning</span><span>↻ Exam updates</span></div></div>
      <section class="index-content"><div class="shell"><h2 class="section-title">Fresh guidance for your next practice</h2><div class="content-grid"><div><h2 class="section-title" style="font-size:16px">Featured story</h2>${featuredCard}<h2 class="section-title" style="font-size:19px">Latest articles</h2><div class="cards" aria-label="IELTS articles">${cards}</div></div><aside class="sidebar"><div class="side-card"><h2>↗ Trending now</h2>${trending}</div><div class="practice-card"><span>◎</span><h2>Ready to turn insight into progress?</h2><p>Take a focused practice test and find the skill that needs your attention next.</p><a class="button" href="/signup">Start free practice →</a></div></aside></div></div></section>
    </main>`,
  });
}

function renderArticle(post, allPosts = []) {
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const description = post.meta_description || post.description;
  const publishedAt = post.published_at || post.created_at;
  const prepared = prepareArticle(post.content);
  const tags = (post.seo_tags || [])
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('');
  const imageUrl = post.thumbnail_url || '/ielts-hero-student.webp';
  const socialImageUrl = absoluteImageUrl(post.thumbnail_url);
  const toc = prepared.toc
    .map(
      (item) =>
        `<a href="#${item.id}"${item.level === 3 ? ' style="padding-left:18px;font-weight:500"' : ''}>${escapeHtml(item.text)}</a>`
    )
    .join('');
  const related = allPosts
    .filter((article) => article.id !== post.id)
    .slice(0, 3)
    .map(
      (article) =>
        `<a class="card" href="/blog/${escapeHtml(article.slug)}"><div class="card-visual"><img src="${escapeHtml(article.thumbnail_url || '/ielts-hero-student.webp')}" alt="${escapeHtml(`${article.title} - IELTS preparation guide`)}"></div><div class="card-copy"><span class="category">${escapeHtml(article.category || 'IELTS guide')}</span><h2>${escapeHtml(article.title)}</h2><span class="meta">${Number(article.reading_minutes) || 6} min read · Read guide →</span></div></a>`
    )
    .join('');
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description,
    datePublished: publishedAt,
    dateModified: post.updated_at || publishedAt,
    author: { '@type': 'Organization', name: 'IELTS Ai Pro' },
    publisher: { '@type': 'Organization', name: 'IELTS Ai Pro', url: SITE_URL },
    mainEntityOfPage: canonical,
    image: socialImageUrl,
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'IELTS Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
    ],
  };
  return layout({
    title: post.title,
    description,
    canonical,
    type: 'article',
    structuredData: [articleSchema, breadcrumbSchema],
    image: socialImageUrl,
    body: `<main id="main">
      <section class="article-hero"><div class="shell"><div class="meta" style="margin-bottom:24px"><a href="/blog">Blog library</a><span>/</span><span>${escapeHtml(post.category || 'Guide')}</span><span>/</span><span>${escapeHtml(post.title)}</span></div><div class="article-hero-grid"><div><span class="category">✎ ${escapeHtml(post.category || 'IELTS guide')}</span><h1>${escapeHtml(post.title)}</h1><p class="intro">${escapeHtml(post.description)}</p><div class="meta" style="margin-top:24px"><strong>IELTS Ai Pro team</strong><span>${escapeHtml(formatDate(publishedAt))}</span><span>${Number(post.reading_minutes) || 6} min read</span></div></div><div class="article-photo"><img src="${escapeHtml(imageUrl)}" alt="IELTS learner applying the article strategy"></div></div></div></section>
      <div class="shell article-layout"><div><article class="article-card article">${prepared.html}<div class="tags">${tags}</div><aside class="cta"><div><span class="eyebrow">Turn the strategy into a score</span><h2>Put this guide into practice</h2><p>Apply the steps while they are fresh, then review your feedback before your next attempt.</p></div><a class="button" href="${practicePath(post.category)}">${escapeHtml(practiceLabel(post.category))}</a></aside></article>${related ? `<h2 class="section-title" style="margin-top:26px">Related articles</h2><div class="cards">${related}</div>` : ''}</div><aside class="sidebar">${toc ? `<div class="toc-card"><h2>☷ On this page</h2>${toc}</div>` : ''}<div class="side-card"><h2>Share this article</h2><a class="button" style="width:100%" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}">Share on LinkedIn</a></div><div class="practice-card"><span>◎</span><h2>Put this strategy into practice</h2><p>Apply the steps while they are fresh and review your feedback.</p><a class="button" href="${practicePath(post.category)}">Practise now →</a></div><a class="login" style="display:block;text-align:center" href="/blog">← All IELTS articles</a></aside></div>
    </main>`,
  });
}

function getSupabaseCredentials() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase blog configuration is unavailable');
  return { supabaseUrl, anonKey };
}

async function fetchPosts(slug) {
  const { supabaseUrl, anonKey } = getSupabaseCredentials();

  const params = new URLSearchParams({
    select: ARTICLE_FIELDS,
    content_type: 'eq.blog',
    is_published: 'eq.true',
    order: 'published_at.desc.nullslast,created_at.desc',
  });
  if (slug) params.set('slug', `eq.${slug}`);

  const response = await fetch(`${supabaseUrl}/rest/v1/resources?${params}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
  return response.json();
}

function sendNotFound(response) {
  response.status(404).send(
    layout({
      title: 'Article not found',
      description: 'This IELTS article is no longer available.',
      canonical: `${SITE_URL}/blog`,
      robots: 'noindex, follow',
      structuredData: [],
      body: '<main id="main"><span class="eyebrow">404</span><h1>That article is no longer on the desk.</h1><p class="intro"><a href="/blog">Browse the latest IELTS preparation guides.</a></p></main>',
    })
  );
}

function sendError(response) {
  response.status(503).send(
    layout({
      title: 'IELTS blog temporarily unavailable',
      description: 'The IELTS preparation blog is temporarily unavailable.',
      canonical: `${SITE_URL}/blog`,
      robots: 'noindex, follow',
      structuredData: [],
      body: '<main id="main"><span class="eyebrow">Temporary interruption</span><h1>The article desk will be back shortly.</h1><p class="intro"><a href="/">Return to IELTS Ai Pro.</a></p></main>',
    })
  );
}

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  const slug = Array.isArray(request.query.slug) ? request.query.slug[0] : request.query.slug;
  try {
    const posts = await fetchPosts(slug);
    if (slug && posts.length === 0) return sendNotFound(response);
    const allPosts = slug ? await fetchPosts() : posts;
    response.status(200).send(slug ? renderArticle(posts[0], allPosts) : renderIndex(posts));
  } catch (error) {
    console.error('[blog-render]', error);
    sendError(response);
  }
}
