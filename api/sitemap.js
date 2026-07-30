import process from 'node:process';

const SITE_URL = 'https://www.ieltsai.pro';
const CORE_ROUTES = [
  { path: '/', lastmod: '2026-07-30', changefreq: 'weekly', priority: '1.0' },
  {
    path: '/ielts-writing-checker',
    lastmod: '2026-07-26',
    changefreq: 'weekly',
    priority: '0.9',
  },
  {
    path: '/ielts-band-score-calculator',
    lastmod: '2026-07-26',
    changefreq: 'monthly',
    priority: '0.9',
  },
  { path: '/blog', lastmod: '2026-07-26', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', lastmod: '2026-07-26', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', lastmod: '2026-07-26', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy', lastmod: '2026-07-26', changefreq: 'yearly', priority: '0.2' },
  { path: '/terms', lastmod: '2026-07-26', changefreq: 'yearly', priority: '0.2' },
];

function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normalizeDate(value, fallback) {
  const parsed = new Date(value || '');
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString().slice(0, 10);
}

function renderUrl({ path, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
    `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
    `    <changefreq>${escapeXml(changefreq)}</changefreq>`,
    `    <priority>${escapeXml(priority)}</priority>`,
    '  </url>',
  ].join('\n');
}

function renderSitemap(posts = []) {
  const articleRoutes = posts
    .filter(({ slug }) => typeof slug === 'string' && slug.trim())
    .map((post) => ({
      path: `/blog/${encodeURIComponent(post.slug.trim())}`,
      lastmod: normalizeDate(
        post.updated_at || post.published_at || post.created_at,
        CORE_ROUTES[3].lastmod
      ),
      changefreq: 'monthly',
      priority: '0.7',
    }));

  const uniqueRoutes = new Map(
    [...CORE_ROUTES, ...articleRoutes].map((route) => [route.path, route])
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from(uniqueRoutes.values(), renderUrl),
    '</urlset>',
    '',
  ].join('\n');
}

function getSupabaseCredentials() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase sitemap configuration is unavailable');
  return { supabaseUrl, anonKey };
}

async function fetchPublishedPosts() {
  const { supabaseUrl, anonKey } = getSupabaseCredentials();
  const params = new URLSearchParams({
    select: 'slug,published_at,created_at,updated_at',
    content_type: 'eq.blog',
    is_published: 'eq.true',
    order: 'published_at.desc.nullslast,created_at.desc',
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/resources?${params}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
  return response.json();
}

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'application/xml; charset=utf-8');
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method && !['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).send('');
  }

  try {
    const posts = await fetchPublishedPosts();
    return response.status(200).send(request.method === 'HEAD' ? '' : renderSitemap(posts));
  } catch (error) {
    console.error('[sitemap-render]', error);
    return response.status(200).send(request.method === 'HEAD' ? '' : renderSitemap());
  }
}

export { renderSitemap };
