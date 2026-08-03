import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import process from 'node:process';
import feedHandler, { renderFeed } from '../../../api/feed.js';
import llmsHandler, { renderLlmsTxt } from '../../../api/llms.js';

const article = {
  title: 'IELTS Speaking Part 2 Structure',
  description: 'A practical IELTS Speaking structure guide.',
  meta_description: 'Plan and deliver a clear IELTS Speaking Part 2 answer.',
  slug: 'ielts-speaking-part-2-structure',
  category: 'Speaking',
  reading_minutes: 7,
  published_at: '2026-07-27T08:00:00Z',
  updated_at: '2026-07-27T09:00:00Z',
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

describe('AI and feed discovery routes', () => {
  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'public-test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a citation-ready llms.txt with published article canonicals', () => {
    const llms = renderLlmsTxt([article]);

    expect(llms).toContain('# IELTS Ai Pro');
    expect(llms).toContain('AI feedback and band scores are practice estimates');
    expect(llms).toContain('https://www.ieltsai.pro/ielts-speaking-practice-ai');
    expect(llms).toContain('https://www.ieltsai.pro/cambridge-ielts-practice-tests');
    expect(llms).toContain('https://www.ieltsai.pro/blog/ielts-speaking-part-2-structure');
    expect(llms).toContain('https://www.ieltsai.pro/blog/feed.xml');
  });

  it('renders an RSS feed with canonical article metadata', () => {
    const feed = renderFeed([article]);

    expect(feed).toContain('<rss version="2.0"');
    expect(feed).toContain('<language>en</language>');
    expect(feed).toContain(
      '<guid isPermaLink="true">https://www.ieltsai.pro/blog/ielts-speaking-part-2-structure</guid>'
    );
    expect(feed).toContain('<category>Speaking</category>');
  });

  it.each([
    ['llms.txt', llmsHandler, 'text/plain', '/blog/ielts-speaking-part-2-structure'],
    ['RSS feed', feedHandler, 'application/rss+xml', '<rss version="2.0"'],
  ])('serves the dynamic %s from published posts', async (_name, handler, type, marker) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [article] }));
    const response = createResponse();

    await handler({ method: 'GET' }, response);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toContain(type);
    expect(response.headers['Content-Language']).toBe('en');
    expect(response.body).toContain(marker);
  });
});
