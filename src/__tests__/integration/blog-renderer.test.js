import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import process from 'node:process';
import blogHandler from '../../../api/blog.js';

const article = {
  id: 'post-1',
  title: 'IELTS Reading Strategy',
  description: 'A practical reading guide.',
  meta_description: 'A practical IELTS Reading strategy guide.',
  slug: 'ielts-reading-strategy',
  content:
    '<h2>Use evidence</h2><p>Read carefully. <a href="/reading">Practise</a>.</p><table><thead><tr><th scope="col">Time</th></tr></thead><tbody><tr><td>20 minutes</td></tr></tbody></table><script>alert(1)</script>',
  seo_tags: ['IELTS Reading'],
  category: 'Reading',
  reading_minutes: 6,
  published_at: '2026-07-18T08:00:00Z',
  created_at: '2026-07-18T08:00:00Z',
  updated_at: '2026-07-18T09:00:00Z',
  thumbnail_url: '/blog-images/reading-strategy.webp',
  featured: true,
};

function createResponse() {
  return {
    headers: {},
    statusCode: null,
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
  };
}

describe('server-rendered IELTS blog', () => {
  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'public-test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a crawlable blog index from published posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [article] }));
    const response = createResponse();

    await blogHandler({ query: {} }, response);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toContain('text/html');
    expect(response.body).toContain('<title>IELTS Preparation Blog');
    expect(response.body).toContain('/blog/ielts-reading-strategy');
    expect(response.body).toContain('CollectionPage');
  });

  it('renders Article schema and strips executable HTML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [article] }));
    const response = createResponse();

    await blogHandler({ query: { slug: article.slug } }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('"@type":"Article"');
    expect(response.body).toContain('Use evidence');
    expect(response.body).not.toContain('<script>alert(1)</script>');
    expect(response.body).toContain('href="/reading"');
    expect(response.body).toContain('<table>');
    expect(response.body).toContain(
      'property="og:image" content="https://www.ieltsai.pro/blog-images/reading-strategy.webp"'
    );
    expect(response.body).toContain(
      'alt="Reading practice guide: learner studying with a laptop and notebook"'
    );
    expect(response.body).toContain(
      'width="1200" height="675" decoding="async" fetchpriority="high"'
    );
  });

  it('returns an indexable-safe 404 when a published article is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    const response = createResponse();

    await blogHandler({ query: { slug: 'missing' } }, response);

    expect(response.statusCode).toBe(404);
    expect(response.body).toContain('Article not found');
    expect(response.body).toContain('/blog');
  });
});
