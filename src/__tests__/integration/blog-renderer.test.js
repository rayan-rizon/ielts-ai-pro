import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import process from 'node:process';
import { signupAttributionScript } from '../../../shared/signupAttributionCapture.js';
import blogHandler from '../../../api/blog.js';
import cssHandler, { BLOG_CSS, BLOG_CSS_VERSION } from '../../../api/blog-css.js';
import { getBlogCoverAlt } from '../../features/learning/utils/blogCoverMeta.js';

const article = {
  id: 'post-1',
  title: 'IELTS Reading Strategy',
  description: 'A practical reading guide.',
  meta_description: 'A practical IELTS Reading strategy guide.',
  slug: 'ielts-reading-paraphrase-traps',
  content:
    '<h2>Use evidence</h2><p>Read carefully. <a href="/reading">Practise</a>. Check the <a href="https://ielts.org/take-a-test/test-types/ielts-academic-test">official IELTS test format</a>.</p><img src="/blog-images/ielts-reading-sentence-completion-four-checks.webp" alt="Four checks for IELTS Reading sentence completion" width="1200" height="675" loading="lazy"><table><thead><tr><th scope="col">Time</th></tr></thead><tbody><tr><td>20 minutes</td></tr></tbody></table><script>alert(1)</script>',
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
    expect(response.body).toContain(`<script>${signupAttributionScript}</script>`);
    expect(response.headers['Content-Type']).toContain('text/html');
    expect(response.body).toContain('<title>IELTS Preparation Tips &amp; Expert Guides');
    expect(response.body).toContain('/blog/ielts-reading-paraphrase-traps');
    expect(response.body).toContain('CollectionPage');
    expect(response.body).toContain('"@type":"ItemList"');
    expect(response.body).toContain('type="application/rss+xml"');
    expect(response.body).toContain('1.2K reads');
    expect(response.body).toContain('class="site-footer"');
    expect(response.body).toContain('class="brand-light" width="300" height="72"');
    expect(response.body).toContain(
      'src="/ielts-hero-student.webp" alt="IELTS learner studying with a laptop and notebook" width="1200" height="900" loading="eager" decoding="async" fetchpriority="high"'
    );
    expect(response.body).toContain(
      '<a class="footer-email" href="mailto:mail@ieltsai.pro"><span aria-hidden="true"><svg'
    );
    expect(response.body).toContain(
      'class="footer-socials"><a href="https://www.facebook.com/ieltsaipro" aria-label="Follow us on Facebook"><svg'
    );
    expect(response.body).toContain('class="category-tabs"');
    expect(response.body).toContain('IELTS tips for higher band scores');
    expect(response.body).toContain('Latest IELTS guidance');
    expect(response.body).toContain('Practical strategies you can use today');
    expect(response.body).toContain('Search IELTS skills, questions, or goals');
    expect(response.body).toContain('href="/blog?category=Mock%20Tests"');
    expect(response.body).toContain('data-featured-carousel');
    expect(response.body).toContain('data-featured-slide');
    expect(response.body).toContain('class="category-chip category-chip-default"');
    expect(response.body).toContain('Ready to put your knowledge into action?');
    expect(response.body).toContain("classList.toggle('is-scrolled',scrollY>20)");
    expect(response.body).toContain("carousel.querySelector('.carousel-next')");
    expect(response.body).toContain('data-theme-toggle');
    expect(response.body).toContain("localStorage.setItem('vite-ui-theme'");
    expect(response.body).toContain('data-practice-card');
    expect(response.body).toContain('side-card-title-icon');
    expect(response.body).toContain(
      `<link rel="stylesheet" href="/blog.css?v=${BLOG_CSS_VERSION}">`
    );
    expect(response.body).not.toContain('<style>');
    // A single featured post lives in the carousel, so this fixture renders no grid
    // cards; the card styles are asserted against the stylesheet that now serves them.
    for (const rule of [
      '.card-read-icon',
      'featured,.featured-copy,.featured-image{min-width:0}',
      'html.dark .category-tabs',
      'html.dark .category-tabs a.active',
      'html.dark .library-search input',
      '.hero-photo img{display:block;width:100%;height:auto;aspect-ratio:16/10',
      'card:hover h2{color:#4f46e5}',
      'html.dark .card:hover h2',
    ]) {
      expect(BLOG_CSS).toContain(rule);
    }
  });

  it('returns a branded 404 instead of canonicalising out-of-range archive pages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [article] }));
    const response = createResponse();

    await blogHandler({ query: { page: '99999' } }, response);

    expect(response.statusCode).toBe(404);
    expect(response.body).toContain('<title>Blog page not found');
    expect(response.body).toContain('That page is not in this guide collection.');
    expect(response.body).toContain('<meta name="robots" content="noindex, follow">');
    expect(response.body).toContain('rel="canonical" href="https://www.ieltsai.pro/blog"');
  });

  it('keeps headings unique and link anchors descriptive for crawlers', async () => {
    const posts = Array.from({ length: 5 }, (_, index) => ({
      ...article,
      id: `post-${index + 1}`,
      slug: `guide-${index + 1}`,
      title: `IELTS Reading Guide ${index + 1}`,
      featured: index < 2,
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => posts }));

    const indexResponse = createResponse();
    await blogHandler({ query: {} }, indexResponse);
    const articleResponse = createResponse();
    await blogHandler({ query: { slug: 'guide-1' } }, articleResponse);

    const headings = (html) =>
      [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/g)].map(
        (match) => `${match[1]}:${match[2].replace(/<[^>]*>/g, '').trim()}`
      );
    const anchorTexts = (html) =>
      [...html.matchAll(/<a\b[^>]*href="\/blog\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g)].map((match) =>
        match[1]
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      );

    for (const html of [indexResponse.body, articleResponse.body]) {
      const found = headings(html);
      expect(found).toHaveLength(new Set(found).size);
      for (const text of anchorTexts(html)) {
        expect(text.length).toBeGreaterThan(0);
        expect(text.length).toBeLessThanOrEqual(120);
      }
    }

    // A promoted article belongs to the carousel only - repeating it in the grid
    // duplicated its heading and its description on the same page.
    expect(indexResponse.body).toContain('data-featured-slide');
    expect(indexResponse.body).not.toContain('<a class="card-title-link" href="/blog/guide-2">');
    expect(indexResponse.body).toContain('<a class="card-title-link" href="/blog/guide-3">');
    // Both copies of the table of contents share a label, so it must not be a heading.
    expect(articleResponse.body).not.toContain('<h2>On this page</h2>');
    expect(articleResponse.body.split('class="toc-title"').length - 1).toBe(2);
  });

  it('serves icons from one sprite and the stylesheet from one cacheable URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [article] }));
    const response = createResponse();

    await blogHandler({ query: {} }, response);
    const html = response.body;

    // One sprite definition, and every icon is a reference into it rather than a
    // repeated copy of its path data.
    expect(html.match(/class="icon-sprite"/g)).toHaveLength(1);
    const references = html.match(/<use href="#icon-[a-z0-9-]+"\/>/g) || [];
    expect(references.length).toBeGreaterThan(20);
    for (const reference of new Set(references)) {
      const id = reference.match(/#(icon-[a-z0-9-]+)/)[1];
      expect(html).toContain(`<symbol id="${id}"`);
    }
    // Path data must appear only inside the sprite.
    const withoutSprite = html.replace(/<svg class="icon-sprite"[\s\S]*?<\/svg>/, '');
    expect(withoutSprite).not.toContain('<path');

    // The stylesheet is external, so it is cached rather than resent per page.
    expect(html).toContain(`href="/blog.css?v=${BLOG_CSS_VERSION}"`);
    expect(cssHandler).toBeTypeOf('function');
  });

  it('gives every filtered library view its own metadata and canonical', async () => {
    const categories = ['Reading', 'Writing', 'Listening'];
    const posts = Array.from({ length: 30 }, (_, index) => ({
      ...article,
      id: `post-${index + 1}`,
      slug: `guide-${index + 1}`,
      title: `IELTS Guide ${index + 1}`,
      category: categories[index % categories.length],
      featured: index < 2,
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => posts }));

    const views = [
      {},
      { page: '2' },
      { category: 'Writing' },
      { category: 'Writing', page: '2' },
      { q: 'IELTS Reading' },
    ];
    const rendered = [];
    for (const query of views) {
      const response = createResponse();
      await blogHandler({ query }, response);
      rendered.push(response.body);
    }

    const read = (html, pattern) => html.match(pattern)?.[1] ?? '';
    const titles = rendered.map((html) => read(html, /<title>(.*?)<\/title>/s));
    const canonicals = rendered.map((html) => read(html, /rel="canonical" href="(.*?)"/s));
    const descriptions = rendered.map((html) => read(html, /name="description" content="(.*?)"/s));

    expect(new Set(titles).size).toBe(views.length);
    expect(new Set(canonicals).size).toBe(views.length);
    expect(new Set(descriptions).size).toBe(views.length);
    // Pagination and category views are real listings: each has to name itself.
    expect(canonicals[1]).toBe('https://www.ieltsai.pro/blog?page=2');
    expect(canonicals[2]).toBe('https://www.ieltsai.pro/blog?category=Writing');
    // Internal search results are not listings worth indexing.
    expect(rendered[4]).toContain('<meta name="robots" content="noindex, follow">');
    // Deeper archive pages are navigation aids, not thin search landing pages.
    expect(rendered[1]).toContain('<meta name="robots" content="noindex, follow">');
    expect(rendered[3]).toContain('<meta name="robots" content="noindex, follow">');
    expect(rendered[1]).toContain('<use href="#icon-chevron-left"/>');
    expect(rendered[1]).toContain('<use href="#icon-chevron-right"/>');
    expect(descriptions[1].length).toBeGreaterThanOrEqual(120);
    expect(rendered[0]).not.toContain('rel="nofollow"');
    // Blocked routes must not receive internal links from a crawlable page.
    for (const blocked of ['/analytics', '/pricing', '/resources', '/vocabulary']) {
      expect(rendered[0]).not.toContain(`href="${blocked}"`);
    }
  });

  it('filters the server-rendered library with production query parameters', async () => {
    const writingArticle = {
      ...article,
      id: 'post-2',
      slug: 'ielts-writing-guide',
      title: 'IELTS Writing Guide',
      category: 'Writing',
      seo_tags: ['task response'],
      featured: false,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [article, writingArticle] })
    );
    const response = createResponse();

    await blogHandler({ query: { category: 'Writing', q: 'task response' } }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain(`<script>${signupAttributionScript}</script>`);
    expect(response.body).toContain('/blog/ielts-writing-guide');
    expect(response.body).toContain('class="card-visual-icon"');
    expect(response.body).not.toContain(
      '<a class="card-title-link" href="/blog/ielts-reading-paraphrase-traps">'
    );
    expect(response.body).toContain(
      'class="active" aria-current="page" href="/blog?category=Writing"'
    );
    expect(response.body).toContain('value="task response"');
    expect(response.body).toContain('Results for “task response”');
    expect(response.body).toContain('data-tone="writing"');
  });

  it('renders Article schema and strips executable HTML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [article] }));
    const response = createResponse();

    await blogHandler({ query: { slug: article.slug } }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('"@type":"Article"');
    expect(response.body).toContain('"isAccessibleForFree":true');
    expect(response.body).toContain('"inLanguage":"en"');
    expect(response.body).toContain('"articleSection":"Reading"');
    expect(response.body).toContain('"keywords":["IELTS Reading"]');
    expect(response.body).toContain(
      '"citation":["https://ielts.org/take-a-test/test-types/ielts-academic-test"]'
    );
    expect(response.body).toContain('"url":"https://www.ieltsai.pro/about"');
    expect(response.body).toContain('"url":"https://www.ieltsai.pro/apple-touch-icon.png"');
    expect(response.body).toContain('"width":180');
    expect(response.body).toContain('"height":180');
    expect(response.body).toContain('Use evidence');
    expect(response.body).not.toContain('<script>alert(1)</script>');
    expect(response.body).toContain('href="/cambridge-ielts-practice-tests#reading"');
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
      '<time class="article-meta-item" datetime="2026-07-18T08:00:00Z">'
    );
    expect(response.body).toContain(
      'width="1200" height="675" decoding="async" fetchpriority="high"'
    );
    expect(response.body).toContain('href="/ielts-writing-checker">Writing checker</a>');
    expect(BLOG_CSS).toContain('.article-photo img{height:auto;border-radius:22px}');
    expect(response.body).toContain('Plan · Practise · Review · Succeed');
    expect(response.body).toContain('Reviewed by the IELTS Ai Pro editorial team');
    expect(response.body).toContain('data-tone="reading"');
    expect(response.body).toContain('<span>Reading</span></span><h1>IELTS Reading Strategy</h1>');
    expect(response.body).toContain('class="site-footer"');
    expect(response.body).toContain('Core Features');
    expect(response.body).toContain('Independent prep platform. Not affiliated with IELTS');
    expect(response.body).toContain("classList.toggle('is-scrolled',scrollY>20)");
    expect(response.body).toContain('class="article-meta"');
    expect(response.body).toContain('article-author-icon');
    expect(response.body).toContain('data-toc-card');
    expect(response.body).toContain('data-toc-link');
    expect(response.body).toContain('IntersectionObserver');
    expect(response.body).toContain('aria-expanded');
    expect(BLOG_CSS).toContain('html.dark .article table');
    expect(response.body).not.toContain('Turn the strategy into a score');
    expect(response.body).toContain('<title>IELTS Reading Strategy | IELTS Ai Pro</title>');
  });

  it('applies query-aligned SEO metadata to priority articles without changing their slug', async () => {
    const speakingTopicsArticle = {
      ...article,
      title: 'IELTS Speaking Topics: Questions, Cue Cards & Tips',
      slug: 'ielts-speaking-topics-questions-cue-cards-tips',
      description: 'Stored description',
      meta_description: 'Stored metadata',
      seo_tags: ['IELTS preparation'],
      category: 'Speaking',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [speakingTopicsArticle],
      })
    );
    const response = createResponse();

    await blogHandler({ query: { slug: speakingTopicsArticle.slug } }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain(
      '<title>IELTS Speaking Questions &amp; Topics | IELTS Ai Pro</title>'
    );
    expect(response.body).toContain(
      '<meta name="description" content="Find common IELTS Speaking topics, Part 1 questions, Part 2 cue cards, Part 3 prompts, and practical answer tips for focused practice.">'
    );
    expect(response.body).toContain(
      '<meta name="keywords" content="IELTS speaking questions, IELTS speaking topics, IELTS speaking topics and answers, IELTS speaking test topics, IELTS speaking practice questions, IELTS speaking cue cards, common IELTS speaking topics, IELTS speaking practice, IELTS preparation">'
    );
    expect(response.body).toContain(
      'href="https://www.ieltsai.pro/blog/ielts-speaking-topics-questions-cue-cards-tips"'
    );
  });

  it('keeps the article title distinct from its H1 and repairs audited legacy citations', async () => {
    const legacyCitationArticle = {
      ...article,
      title: 'IELTS Writing Task 2 Tips for a Reliable Band 7+ Score',
      content:
        '<p><a href="https://www.hss.iitb.ac.in/sites/default/files/2023-10/Coherence_Linking_Words%20(RMIT%20University" target="_blank">cohesive device</a>.pdf)</p><p><a href="https://careerwiseenglish.com.au/ielts-writing-task-2-time-management/">the 40-minute routine</a></p><p><a href="https://ielts5to6.com/grammar/ielts-writing-task-2-collocations-list-pdf-friendly/">accurate collocations</a></p><p><a href="https://ieltsimmigration.ir/wp-content/uploads/2020/03/Band-Descriptors-Task-2.pdf">official band descriptors</a></p>',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [legacyCitationArticle] })
    );
    const response = createResponse();

    await blogHandler({ query: { slug: legacyCitationArticle.slug } }, response);

    const title = response.body.match(/<title>(.*?)<\/title>/)?.[1];
    const h1 = response.body.match(/<h1>(.*?)<\/h1>/)?.[1];
    expect(title).not.toBe(h1);
    expect(title).toContain('IELTS Ai Pro');
    expect(response.body).toContain(
      'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing'
    );
    expect(response.body).toContain(
      'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing'
    );
    for (const brokenUrl of [
      'www.hss.iitb.ac.in',
      'careerwiseenglish.com.au',
      'ielts5to6.com',
      'ieltsimmigration.ir',
    ]) {
      expect(response.body).not.toContain(brokenUrl);
    }
  });

  it('keeps long article titles within the audit threshold', async () => {
    const longTitleArticle = {
      ...article,
      title: 'IELTS Reading Multiple Choice: A Complete Evidence-Based Practice Guide',
      slug: 'ielts-reading-multiple-choice-guide',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [longTitleArticle] })
    );
    const response = createResponse();

    await blogHandler({ query: { slug: longTitleArticle.slug } }, response);

    expect(response.statusCode).toBe(200);
    const title = response.body.match(/<title>(.*?)<\/title>/)?.[1] || '';
    expect(title).toContain('IELTS Ai Pro');
    expect(title).not.toBe(longTitleArticle.title);
  });

  it('keeps title tags unique when articles share their opening words', async () => {
    const similarlyNamedArticles = [
      'Improve Your IELTS Writing Band: 8-Week Plan to Band 7+',
      'Improve Your IELTS Writing Score by One Full Band',
      'IELTS vs TOEFL for US admission: which test is easier?',
      'IELTS vs TOEFL for US Universities: An Australian Guide',
      'IELTS Writing Task 2 Examples: When You Need One',
      'IELTS Writing Task 2 Off-Topic? Use the Prompt-Lock Check',
    ].map((title, index) => ({ ...article, id: `title-${index}`, slug: `title-${index}`, title }));
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        const slug = new URL(url).searchParams.get('slug')?.replace(/^eq\./, '');
        return Promise.resolve({
          ok: true,
          json: async () =>
            slug
              ? similarlyNamedArticles.filter((post) => post.slug === slug)
              : similarlyNamedArticles,
        });
      })
    );

    const titles = [];
    for (const post of similarlyNamedArticles) {
      const response = createResponse();
      await blogHandler({ query: { slug: post.slug } }, response);
      titles.push(response.body.match(/<title>(.*?)<\/title>/)?.[1]);
    }

    expect(new Set(titles).size).toBe(similarlyNamedArticles.length);
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
    expect(getBlogCoverAlt({ slug: 'ielts-reading-multiple-choice-tips' })).toBe(
      'Adult IELTS learner comparing multiple-choice options with a reading passage beside her laptop'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-writing-task-2-two-part-question' })).toBe(
      'Adult IELTS learner planning a two-part essay in two columns beside his laptop'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-listening-form-completion-tips' })).toBe(
      'Two adult IELTS learners completing a listening form together with headphones and a laptop'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-writing-task-1-maps' })).toBe(
      'Adult IELTS learner comparing before-and-after maps at a bright study desk'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-reading-short-answer-questions' })).toBe(
      'Adult IELTS learner locating a short answer in a reading passage beside his laptop'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-listening-matching-questions' })).toBe(
      'Two adult IELTS learners matching visual options while listening with headphones'
    );
    expect(getBlogCoverAlt({ slug: 'ielts-speaking-dont-know-answer' })).toBe(
      'Adult IELTS learner pausing at a microphone before answering an unfamiliar Speaking question'
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

  it('renders a public navbar matching the marketing site navigation structure and design tokens', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [article] }));
    const response = createResponse();

    await blogHandler({ query: {} }, response);

    expect(response.statusCode).toBe(200);
    // Desktop navigation links
    expect(response.body).toContain('href="/#features">Platform</a>');
    expect(response.body).toContain('href="/ielts-writing-checker">Writing checker</a>');
    expect(response.body).toContain('href="/blog">Blog</a>');
    expect(response.body).toContain('href="/ielts-band-score-calculator">Calculator</a>');
    expect(response.body).toContain('href="/ielts-university-requirements">Universities</a>');
    expect(response.body).toContain('href="/#pricing">Pricing</a>');
    // Obsolete link removed
    expect(response.body).not.toContain('href="/#how-it-works"');

    // Mobile navigation links and structure
    expect(response.body).toContain('id="public-navbar-menu" class="mobile-card"');
    expect(response.body).toContain(
      'href="/ielts-university-requirements" class="mobile-card-link"'
    );
    expect(response.body).toContain('IELTS scores universities require');
    expect(response.body).toContain('Core IELTS AI tools &amp; practice suite');
    expect(response.body).toContain('Start Free Practice');

    // Scroll progress bar
    expect(response.body).toContain('class="nav-scroll-progress"');
    expect(response.body).toContain('data-scroll-progress-fill');

    // CSS rules for Learner Panel Design System
    expect(BLOG_CSS).toContain('header#public-header.is-scrolled');
    expect(BLOG_CSS).toContain('.nav-scroll-progress-fill');
    expect(BLOG_CSS).toContain('border-bottom:1px solid #e4e2f0');
    expect(BLOG_CSS).toContain('html.dark header#public-header.is-scrolled .site-nav');
  });
});
