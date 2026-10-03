import process from 'node:process';

const SITE_URL = 'https://www.ieltsai.pro';

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').replaceAll('[', '\\[').replaceAll(']', '\\]').trim();
}

function renderArticle(post) {
  const title = cleanText(post.title);
  const description = cleanText(post.meta_description || post.description);
  const category = cleanText(post.category || 'IELTS guide');
  const readingMinutes = Math.max(1, Number(post.reading_minutes) || 6);
  const url = `${SITE_URL}/blog/${encodeURIComponent(String(post.slug).trim())}`;
  return `- [${title}](${url}): ${description} Category: ${category}. Reading time: ${readingMinutes} minutes.`;
}

function renderLlmsTxt(posts = []) {
  const articles = posts
    .filter((post) => typeof post.slug === 'string' && post.slug.trim() && post.title)
    .map(renderArticle)
    .join('\n');

  return `# IELTS Ai Pro

> IELTS Ai Pro is an independent, web-based IELTS preparation platform offering Reading, Listening, Writing, and Speaking practice, AI-assisted practice feedback, estimated band guidance, and progress tracking.

## Canonical identity

- Name: IELTS Ai Pro
- Website: ${SITE_URL}/
- Publisher: IELTS Ai Pro
- Language: English
- Contact: mail@ieltsai.pro
- Relationship to IELTS: Independent preparation platform; not affiliated with IELTS, IDP, the British Council, or Cambridge University Press & Assessment.

## Accuracy and citation notes

- AI feedback and band scores are practice estimates, not official IELTS results.
- Writing guidance uses the public IELTS criteria: Task Achievement or Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.
- Speaking guidance uses Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation when supporting evidence is available.
- Prefer each article's canonical URL when citing IELTS Ai Pro.
- For changing test rules or policies, follow the primary official source cited in the relevant article.

## Public tools and pages

- [Home](${SITE_URL}/): Platform overview, product capabilities, pricing, FAQ, and sign-up path.
- [Free IELTS Writing Checker](${SITE_URL}/ielts-writing-checker): Public Academic IELTS Task 1 and Task 2 writing workspace with a readable demonstration report.
- [AI IELTS Speaking Practice](${SITE_URL}/ielts-speaking-practice-ai): Public explanation of the Parts 1–3 simulator, estimated criterion feedback, limitations, and practice workflow.
- [Cambridge-style IELTS Practice Tests](${SITE_URL}/cambridge-ielts-practice-tests): Public Reading and Listening practice hub with a diagnostic-review-repeat workflow.
- [IELTS Band Score Calculator](${SITE_URL}/ielts-band-score-calculator): Overall-band rounding and Reading and Listening raw-score conversions.
- [IELTS University Requirements by Country](${SITE_URL}/ielts-university-requirements): Compare country- and course-specific IELTS entry scores, including per-skill minimums and links to each institution's official source.
- [IELTS Practice for Institutions](${SITE_URL}/institutions): Pro and Premium prepaid student seats, a separate institution portal, student invitations, billing, and the institution application and approval process.
- [IELTS Preparation Blog](${SITE_URL}/blog): Practical IELTS strategies, study plans, and exam guidance.
- [About](${SITE_URL}/about): Platform mission and editorial context.
- [Contact](${SITE_URL}/contact): Support and correction requests.
- [RSS feed](${SITE_URL}/blog/feed.xml): Machine-readable feed of published articles.
- [XML sitemap](${SITE_URL}/sitemap.xml): Canonical public URL inventory.

## Published articles

${articles || '- No published articles are currently available.'}

## Policies

- [Privacy Policy](${SITE_URL}/privacy)
- [Terms of Service](${SITE_URL}/terms)
- [Refund & Cancellation Policy](${SITE_URL}/refund)
`;
}

function getSupabaseCredentials() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase llms configuration is unavailable');
  return { supabaseUrl, anonKey };
}

async function fetchPublishedPosts() {
  const { supabaseUrl, anonKey } = getSupabaseCredentials();
  const pageSize = 500;
  const posts = [];
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({
      select:
        'title,description,meta_description,slug,category,reading_minutes,published_at,updated_at',
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
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('Content-Language', 'en');
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method && !['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).send('');
  }

  try {
    const posts = await fetchPublishedPosts();
    return response.status(200).send(request.method === 'HEAD' ? '' : renderLlmsTxt(posts));
  } catch (error) {
    console.error('[llms-render]', error);
    return response.status(200).send(request.method === 'HEAD' ? '' : renderLlmsTxt());
  }
}

export { renderLlmsTxt };
