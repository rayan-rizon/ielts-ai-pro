import process from 'node:process';
import { getBlogModifiedAt } from '../src/features/learning/utils/blogDates.js';

const SITE_URL = 'https://www.ieltsai.pro';

function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function rssDate(value) {
  const parsed = new Date(value || '');
  return Number.isNaN(parsed.getTime()) ? null : parsed.toUTCString();
}

function renderFeed(posts = []) {
  const validPosts = posts.filter(
    (post) => typeof post.slug === 'string' && post.slug.trim() && post.title
  );
  const latestArticleTime = validPosts.reduce((latest, post) => {
    const modifiedTime = Date.parse(getBlogModifiedAt(post));
    return Number.isFinite(modifiedTime) ? Math.max(latest, modifiedTime) : latest;
  }, 0);
  const lastBuildDate =
    (latestArticleTime && rssDate(latestArticleTime)) || 'Sun, 26 Jul 2026 00:00:00 GMT';
  const items = validPosts
    .map((post) => {
      const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug.trim())}`;
      const publishedAt = rssDate(post.published_at || post.created_at) || lastBuildDate;
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${escapeXml(publishedAt)}</pubDate>`,
        `      <description>${escapeXml(post.meta_description || post.description || '')}</description>`,
        `      <category>${escapeXml(post.category || 'IELTS guide')}</category>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>IELTS Ai Pro Preparation Guides</title>
    <link>${SITE_URL}/blog</link>
    <description>Practical IELTS Writing, Speaking, Reading, and Listening guidance.</description>
    <language>en</language>
    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function getSupabaseCredentials() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase feed configuration is unavailable');
  return { supabaseUrl, anonKey };
}

async function fetchPublishedPosts() {
  const { supabaseUrl, anonKey } = getSupabaseCredentials();
  const pageSize = 500;
  const posts = [];
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({
      select:
        'title,description,meta_description,slug,category,published_at,created_at,content_updated_at',
      content_type: 'eq.blog',
      is_published: 'eq.true',
      order: 'published_at.desc.nullslast,created_at.desc',
      limit: String(pageSize),
      offset: String(offset),
    });
    const response = await fetch(`${supabaseUrl}/rest/v1/resources?${params}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
    const page = await response.json();
    posts.push(...page);
    if (page.length < pageSize) return posts;
  }
}

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  response.setHeader('Content-Language', 'en');
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method && !['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).send('');
  }

  try {
    const posts = await fetchPublishedPosts();
    return response.status(200).send(request.method === 'HEAD' ? '' : renderFeed(posts));
  } catch (error) {
    console.error('[feed-render]', error);
    return response.status(200).send(request.method === 'HEAD' ? '' : renderFeed());
  }
}

export { renderFeed };
