import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import process from 'node:process';
import blogHandler from '../../../api/blog.js';
import { getBlogCoverAlt } from '../../features/learning/utils/blogCoverMeta.js';

const article = {
  id: 'post-1',
  title: 'IELTS Reading Strategy',
  description: 'A practical reading guide.',
  meta_description: 'A practical IELTS Reading strategy guide.',
  slug: 'ielts-reading-paraphrase-traps',
  content:
    '<h2>Use evidence</h2><p>Read carefully. <a href="/reading">Practise</a>.</p><img src="/blog-images/ielts-reading-sentence-completion-four-checks.webp" alt="Four checks for IELTS Reading sentence completion" width="1200" height="675" loading="lazy"><table><thead><tr><th scope="col">Time</th></tr></thead><tbody><tr><td>20 minutes</td></tr></tbody></table><script>alert(1)</script>',
  seo_tags: ['IELTS Reading'],
  category: 'Reading',
  reading_minutes: 6,
  published_at: '2026-07-18T08:00:00Z',
  created_at: '2026-07-18T08:00:00Z',
  updated_at: '2026-07-18T09:00:00Z',
  thumbnail_url: '/blog-images/ielts-reading-paraphrase-traps.webp',
  featured: true,
  view_count: 1234,
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
    expect(response.body).toContain('/blog/ielts-reading-paraphrase-traps');
    expect(response.body).toContain('CollectionPage');
    expect(response.body).toContain('1.2K reads');
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
    expect(response.body).toContain(
      'src="/blog-images/ielts-reading-sentence-completion-four-checks.webp"'
    );
    expect(response.body).toContain('alt="Four checks for IELTS Reading sentence completion"');
    expect(response.body).toContain('width="1200" height="675" loading="lazy"');
    expect(response.body).toContain('<table>');
    expect(response.body).toContain(
      'property="og:image" content="https://www.ieltsai.pro/blog-images/ielts-reading-paraphrase-traps.webp"'
    );
    expect(response.body).toContain(
      'alt="IELTS learner matching highlighted paraphrases between a reading passage and a laptop"'
    );
    expect(response.body).toContain('1.2K reads');
    expect(response.body).toContain(
      'width="1200" height="675" decoding="async" fetchpriority="high"'
    );
  });

  it('provides descriptive cover alt text for each new daily guide', () => {
    expect(getBlogCoverAlt({ slug: 'ielts-speaking-part-3-stop-rambling' })).toBe(
      'IELTS learner practising a clear Part 3 answer with a microphone and sequenced prompt cards'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-listening-spelling-plurals-word-limits' })).toBe(
      'IELTS learner typing a Listening answer while using headphones and an accuracy checklist'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-reading-paraphrase-traps' })).toBe(
      'IELTS learner matching highlighted paraphrases between a reading passage and a laptop'
    );
    expect(getBlogCoverAlt({ slug: 'cambridge-ielts-21-academic-2026-practice-tests' })).toBe(
      'Cambridge IELTS 21 Academic 2026 title above a learner planning four practice sets'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-listening-multiple-choice-part-3' })).toBe(
      'IELTS learner tracking two speakers and multiple-choice decisions with headphones'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-writing-task-1-overview-key-features' })).toBe(
      'IELTS learner selecting key trends from charts before writing a Task 1 overview'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-overall-band-score-rounding-calculator' })).toBe(
      'IELTS learner comparing four skill score cards with a calculator on a bright study desk'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-writing-task-2-examples' })).toBe(
      'IELTS learner planning a Task 2 paragraph from an idea through explanation to an example'
    );
    expect(getBlogCoverAlt({ slug: 'ai-ielts-speaking-score-accuracy' })).toBe(
      'IELTS learner recording a speaking answer while reviewing four AI feedback indicators'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-writing-task-1-process-diagram' })).toBe(
      'IELTS learner tracing a process diagram on paper beside a matching stage flow on a laptop'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-reading-sentence-completion' })).toBe(
      'IELTS learner comparing a highlighted reading passage with sentence-completion gaps on a laptop'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-listening-part-4-note-completion' })).toBe(
      'IELTS learner using headphones to complete lecture notes beside an audio waveform'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-speaking-pronunciation-accent' })).toBe(
      'IELTS learner speaking into a microphone beside a pronunciation waveform display'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-speaking-part-1-answer-length' })).toBe(
      'IELTS learner practising a short Part 1 answer with prompt cards, a timer, and speech bubbles'
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
