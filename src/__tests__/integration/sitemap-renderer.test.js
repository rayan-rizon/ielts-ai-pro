import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import process from 'node:process';
import sitemapHandler, { renderSitemap } from '../../../api/sitemap.js';

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

describe('dynamic public sitemap', () => {
  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'public-test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes canonical public routes and published blog articles', () => {
    const sitemap = renderSitemap([
      {
        slug: 'ielts-reading-paraphrase-traps',
        updated_at: '2026-07-25T09:30:00Z',
      },
    ]);

    expect(sitemap).toContain('<loc>https://www.ieltsai.pro/</loc>');
    expect(sitemap).toContain('<loc>https://www.ieltsai.pro/ielts-speaking-practice-ai</loc>');
    expect(sitemap).toContain('<loc>https://www.ieltsai.pro/cambridge-ielts-practice-tests</loc>');
    expect(sitemap).toContain('<loc>https://www.ieltsai.pro/ielts-university-requirements</loc>');
    expect(sitemap).toContain(
      '<loc>https://www.ieltsai.pro/blog/ielts-reading-paraphrase-traps</loc>'
    );
    expect(sitemap).toContain('<lastmod>2026-07-25</lastmod>');
  });

  it('serves XML from the published-post query', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            slug: 'ielts-writing-task-2-structure',
            published_at: '2026-07-24T10:00:00Z',
          },
        ],
      })
    );
    const response = createResponse();

    await sitemapHandler({ method: 'GET' }, response);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toContain('application/xml');
    expect(response.body).toContain('/blog/ielts-writing-task-2-structure');
  });

  it('falls back to core canonical routes when the content service is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const response = createResponse();

    await sitemapHandler({ method: 'GET' }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('<loc>https://www.ieltsai.pro/blog</loc>');
    expect(response.body).not.toContain('/blog/ielts-writing-task-2-structure');
  });
});
