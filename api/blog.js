import sanitizeHtml from 'sanitize-html';
import process from 'node:process';
import {
  BLOG_LIBRARY_COPY,
  getBlogCategories,
  getBlogCategoryPresentation,
  getBlogLibraryHeading,
} from '../src/features/learning/utils/blogPresentation.js';

const SITE_URL = 'https://www.ieltsai.pro';
const DEFAULT_IMAGE = `${SITE_URL}/og.webp`;
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
  'view_count',
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

function plainText(value = '') {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

function externalCitationUrls(value = '') {
  const citations = [];
  for (const match of value.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1/gi)) {
    try {
      const url = new URL(match[2], SITE_URL);
      if (
        ['http:', 'https:'].includes(url.protocol) &&
        url.hostname !== 'ieltsai.pro' &&
        url.hostname !== 'www.ieltsai.pro'
      ) {
        citations.push(url.toString());
      }
    } catch {
      // Ignore malformed links; sanitized article HTML remains the source of truth.
    }
  }
  return [...new Set(citations)];
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

function formatShortDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatReadCount(value) {
  const count = Math.max(0, Number(value) || 0);
  return `${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    count
  )} ${count === 1 ? 'read' : 'reads'}`;
}

function practicePath(category) {
  return (
    {
      Writing: '/ielts-writing-checker',
      Speaking: '/ielts-speaking-practice-ai',
      Reading: '/cambridge-ielts-practice-tests#reading',
      Listening: '/cambridge-ielts-practice-tests#listening',
      'Study Planning': '/cambridge-ielts-practice-tests',
      'Exam Updates': '/cambridge-ielts-practice-tests',
      'Mock Tests': '/cambridge-ielts-practice-tests',
    }[category] || '/signup'
  );
}

function practiceLabel(category) {
  if (['Study Planning', 'Exam Updates', 'Mock Tests'].includes(category)) {
    return 'Start a mock test';
  }
  return `Start ${category || 'IELTS'} practice`;
}

const ICON_CONTENT = {
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'book-open':
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  calculator:
    '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  calendar: '<path d="M8 2v4M16 2v4M3 10h18"/><rect width="18" height="18" x="3" y="4" rx="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  'file-text':
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'graduation-cap':
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  headphones:
    '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  'help-circle':
    '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
  layers:
    '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L3.18 12.5"/><path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L3.18 17.5"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  moon: '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>',
  'mic-2':
    '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  'pen-line':
    '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sparkles:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.41 2.41 0 0 0 3.408 0l5.88-5.88a2.41 2.41 0 0 0 0-3.408z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};

function iconSvg(name, className = 'icon') {
  return `<svg class="${escapeHtml(className)}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_CONTENT[name] || ICON_CONTENT['file-text']}</svg>`;
}

function practiceCard(actionPath = '/signup', actionLabel = 'Start Free Test') {
  return `<div class="practice-card" data-practice-card>
    <span class="practice-sparkle practice-sparkle-large" aria-hidden="true">✦</span>
    <span class="practice-sparkle practice-sparkle-small" aria-hidden="true">✦</span>
    <div class="practice-content"><h2>Ready to put your knowledge into action?</h2><p>Take a practice test and see where you stand.</p><a class="practice-button" href="${escapeHtml(actionPath)}">${escapeHtml(actionLabel)} ${iconSvg('arrow-right')}</a></div>
    <div class="practice-mockup" aria-hidden="true"><span class="practice-mockup-line"></span><strong>7.5</strong><small>Overall band</small><span class="practice-bars"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
  </div>`;
}

/*
 * The table of contents renders twice per article (a mobile copy above the body and
 * a sticky sidebar copy), so its label must not be a heading: two identical <h2>On
 * this page</h2> elements made every article report a duplicate heading. The nav's
 * aria-label already names the region, so a styled <p> carries the same meaning.
 */
function tableOfContents(toc, { mobile = false } = {}) {
  if (!toc) return '';
  return `<div class="toc-card${mobile ? ' mobile-toc' : ''}" data-toc-card>
    <div class="toc-heading"><span class="toc-icon">${iconSvg('file-text')}</span><p class="toc-title">On this page</p><span class="toc-count">${(toc.match(/href=/g) || []).length}</span><button class="toc-toggle" type="button" aria-expanded="true" aria-label="Collapse table of contents">${iconSvg('chevron-down')}</button></div>
    <nav class="toc-links" aria-label="Article sections">${toc}</nav>
  </div>`;
}

function categoryChip(category, size = 'default') {
  const presentation = getBlogCategoryPresentation(category);
  return `<span class="category-chip category-chip-${size}" data-tone="${escapeHtml(presentation.tone)}">${iconSvg(presentation.icon)}<span>${escapeHtml(category || 'IELTS Guide')}</span></span>`;
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

const COVER_ALT_BY_SLUG = {
  'ielts-writing-coherence-cohesion-band-7':
    'IELTS learner reviewing an essay with connected paragraph notes on a bright study desk',
  'ielts-speaking-band-7-to-8-grammar-vocabulary':
    'IELTS learner recording a speaking answer beside colour-coded grammar and vocabulary notes',
  'ielts-mock-test-score-readiness-checklist':
    'IELTS learner comparing three mock-test result sheets with a timer on a bright desk',
  'ielts-writing-task-2-stay-on-topic':
    'IELTS learner checking an essay outline with arrows and paragraph boxes beside a laptop',
  'ielts-reading-band-6-5-error-log':
    'IELTS learner comparing a reading passage with a colour-coded error log on a bright desk',
  'ielts-listening-missed-answer-recovery':
    'IELTS learner using headphones and a skipped-question sequence to practise listening recovery',
  'ielts-speaking-part-3-stop-rambling':
    'IELTS learner practising a clear Part 3 answer with a microphone and sequenced prompt cards',
  'ielts-listening-spelling-plurals-word-limits':
    'IELTS learner typing a Listening answer while using headphones and an accuracy checklist',
  'ielts-reading-paraphrase-traps':
    'IELTS learner matching highlighted paraphrases between a reading passage and a laptop',
  'cambridge-ielts-21-academic-2026-practice-tests':
    'Cambridge IELTS 21 Academic 2026 title above a learner planning four practice sets',
  'ielts-listening-multiple-choice-part-3':
    'IELTS learner tracking two speakers and multiple-choice decisions with headphones',
  'ielts-writing-task-1-overview-key-features':
    'IELTS learner selecting key trends from charts before writing a Task 1 overview',
  'ielts-overall-band-score-rounding-calculator':
    'IELTS learner comparing four skill score cards with a calculator on a bright study desk',
  'ielts-writing-task-2-examples':
    'IELTS learner planning a Task 2 paragraph from an idea through explanation to an example',
  'ai-ielts-speaking-score-accuracy':
    'IELTS learner recording a speaking answer while reviewing four AI feedback indicators',
  'ielts-writing-task-1-process-diagram':
    'IELTS learner tracing a process diagram on paper beside a matching stage flow on a laptop',
  'ielts-reading-sentence-completion':
    'IELTS learner comparing a highlighted reading passage with sentence-completion gaps on a laptop',
  'ielts-listening-part-4-note-completion':
    'IELTS learner using headphones to complete lecture notes beside an audio waveform',
  'ielts-speaking-pronunciation-accent':
    'IELTS learner speaking into a microphone beside a pronunciation waveform display',
  'ielts-speaking-part-1-answer-length':
    'IELTS learner practising a short Part 1 answer with prompt cards, a timer, and speech bubbles',
  'ielts-reading-multiple-choice-tips':
    'Adult IELTS learner comparing multiple-choice options with a reading passage beside her laptop',
  'ielts-writing-task-2-two-part-question':
    'Adult IELTS learner planning a two-part essay in two columns beside his laptop',
  'ielts-listening-form-completion-tips':
    'Two adult IELTS learners completing a listening form together with headphones and a laptop',
  'ielts-writing-task-1-maps':
    'Adult IELTS learner comparing before-and-after maps at a bright study desk',
  'ielts-reading-short-answer-questions':
    'Adult IELTS learner locating a short answer in a reading passage beside his laptop',
  'ielts-listening-matching-questions':
    'Two adult IELTS learners matching visual options while listening with headphones',
  'ielts-speaking-dont-know-answer':
    'Adult IELTS learner pausing at a microphone before answering an unfamiliar Speaking question',
  'ielts-writing-feedback-rewrite-method':
    'Adult IELTS learner comparing an original essay paragraph with a focused handwritten rewrite',
  'ielts-reading-matching-features':
    'Adult IELTS learner mapping people to paraphrased statements in a Reading passage',
  'ielts-speaking-without-memorising-answers':
    'Two adult IELTS learners practising spontaneous Speaking answers with random prompt cards',
  'ielts-reading-summary-completion-strategy':
    'Adult IELTS learner locating a summary answer zone in a highlighted Reading passage',
  'ielts-listening-table-completion-strategy':
    'Adult IELTS learner tracking rows and columns in a Listening table with headphones',
};

function coverAlt(post) {
  return (
    COVER_ALT_BY_SLUG[post.slug] ||
    `${post.category || 'IELTS'} practice guide: learner studying with a laptop and notebook`
  );
}

const CSS = `
  @font-face{font-family:"Plus Jakarta Sans";src:url('/fonts/plus-jakarta-sans-latin-normal.woff2') format('woff2');font-style:normal;font-display:swap;font-weight:200 800}
  @font-face{font-family:"Kalam";src:url('/fonts/kalam-latin-700-normal.woff2') format('woff2');font-style:normal;font-weight:700;font-display:swap}
  :root{color-scheme:light;--page:#f7f9ff;--surface:#fff;--ink:#0f172a;--muted:#64748b;--indigo:#4f46e5;--violet:#7c3aed;--line:#e2e8f0;--soft:#eef2ff}
  *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--page);color:var(--ink);font-family:"Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;line-height:1.7}a{color:inherit}.icon{width:1em;height:1em;flex:0 0 auto;display:inline-block;vertical-align:middle}.skip{position:absolute;left:-999px;top:10px;background:#fff;padding:10px 14px;z-index:999}.skip:focus{left:10px}
  header{position:sticky;top:0;z-index:100;border-bottom:1px solid var(--line);background:rgba(255,255,255,.96);backdrop-filter:blur(16px)}.site-nav{max-width:1280px;height:72px;margin:auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:22px}.brand{display:flex;align-items:center;gap:9px;font-weight:800;text-decoration:none;font-size:19px;white-space:nowrap}.brand img{width:32px;height:32px}.nav-center,.nav-actions{display:flex;align-items:center;gap:3px}.nav-center>a,.nav-center summary{display:flex;align-items:center;gap:4px;padding:9px 11px;border-radius:9px;text-decoration:none;color:#536078;font-size:13px;font-weight:700;cursor:pointer;list-style:none}.nav-center summary::-webkit-details-marker{display:none}.nav-center>a:hover,.nav-center summary:hover{background:#f5f7fb;color:var(--indigo)}.nav-center details{position:relative}.nav-center details[open] summary{background:var(--soft);color:var(--indigo)}.dropdown{position:absolute;left:50%;top:42px;min-width:215px;transform:translateX(-50%);padding:8px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 24px 60px -28px rgba(30,41,59,.45)}.dropdown a{display:block;padding:9px 10px;border-radius:8px;text-decoration:none;color:#536078;font-size:12px;font-weight:650}.dropdown a:hover{background:var(--soft);color:var(--indigo)}.login{padding:8px 14px;border:1px solid var(--line);border-radius:9px;text-decoration:none;font-size:13px;font-weight:700}.button{display:inline-flex;align-items:center;justify-content:center;border-radius:9px;background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;padding:9px 16px;text-decoration:none;font-size:13px;font-weight:750;white-space:nowrap}.mobile-menu{display:none;position:relative}.mobile-menu summary{display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:9px;cursor:pointer;list-style:none;font-weight:800}.mobile-menu summary::-webkit-details-marker{display:none}.mobile-menu .dropdown{left:auto;right:0;top:43px;transform:none;min-width:220px}
  main{min-height:70vh}.shell{max-width:1280px;margin:auto;padding-left:24px;padding-right:24px}
  
  /* Eyebrow badge UI matching React hero eyebrow */
  .eyebrow{display:inline-flex;width:max-content;align-items:center;gap:8px;border:1px solid #e0e7ff;border-radius:999px;background:#eef2ff;color:#4338ca;padding:6px 14px;font-size:12px;font-weight:700;line-height:1}
  .eyebrow .icon{width:14px;height:14px;flex-shrink:0}
  
  /* Category Chip Badges matching React CategoryChip design tokens */
  .category-chip{display:inline-flex;width:max-content;align-items:center;gap:6px;border:1px solid;border-radius:999px;font-weight:700;white-space:nowrap;transition:all .2s ease;line-height:1;flex-shrink:0;vertical-align:middle}
  .category-chip .icon{width:14px;height:14px;flex-shrink:0}
  .category-chip-default{padding:4px 12px;font-size:12px;letter-spacing:-.01em}
  .category-chip-sm{padding:2.5px 10px;font-size:11px}
  .category-chip-sm .icon{width:12px;height:12px}
  
  /* Category Badge Tone Palette */
  .category-chip[data-tone="writing"]{border-color:rgba(254,205,211,.8);background:rgba(255,241,242,.95);color:#be123c}
  .category-chip[data-tone="speaking"]{border-color:rgba(253,230,138,.8);background:rgba(255,251,235,.95);color:#92400e}
  .category-chip[data-tone="reading"]{border-color:rgba(167,243,208,.8);background:rgba(236,253,245,.95);color:#065f46}
  .category-chip[data-tone="listening"]{border-color:rgba(186,230,253,.8);background:rgba(240,249,255,.95);color:#075985}
  .category-chip[data-tone="planning"]{border-color:rgba(221,214,254,.8);background:rgba(245,243,255,.95);color:#5b21b6}
  .category-chip[data-tone="updates"]{border-color:rgba(199,210,254,.8);background:rgba(238,242,255,.95);color:#3730a3}
  .category-chip[data-tone="mock"]{border-color:rgba(245,208,254,.8);background:rgba(253,244,255,.95);color:#86198f}

  /* Typography */
  h1,h2,h3{letter-spacing:-.045em}
  h1{font-size:48px;line-height:1.08;margin:16px 0 12px;font-weight:800}
  h2{font-size:26px;line-height:1.25;font-weight:800}
  h3{font-size:20px;line-height:1.35;font-weight:700}
  .hand{margin:8px 0 16px;color:#4f46e5;font-family:"Kalam","Segoe Print","Bradley Hand",cursive,sans-serif;font-size:32px;font-weight:700;line-height:1.2}
  .intro{max-width:580px;color:#475569;font-size:16px;line-height:1.65;margin:0}

  /* Hero Sections */
  .index-hero{position:relative;overflow:hidden;border-bottom:1px solid #e2e6ff;background:#fff;padding:48px 0}
  .index-hero:before{position:absolute;inset:0;content:"";background:radial-gradient(circle at 15% 20%,rgba(99,102,241,.09),transparent 28%),radial-gradient(circle at 90% 10%,rgba(45,212,191,.08),transparent 25%)}
  .hero-grid{position:relative;display:grid;grid-template-columns:.95fr 1.05fr;gap:40px;align-items:center}
  .hero-photo{position:relative;border:1px solid #dfe3ff;border-radius:28px;background:#f0f2ff;padding:7px;box-shadow:0 30px 70px -42px rgba(79,70,229,.55)}
  .hero-photo img{display:block;width:100%;aspect-ratio:16/10;border-radius:22px;object-fit:cover}
  .note{position:absolute;z-index:2;padding:10px 13px;border-radius:7px;background:#e9ddff;color:#5b21b6;font-size:11px;font-weight:700;box-shadow:0 12px 30px -14px rgba(76,29,149,.5)}
  .note.one{left:-14px;top:48px;transform:rotate(-5deg)}
  .note.two{right:-8px;bottom:42px;transform:rotate(5deg);background:#dff7e9;color:#047857}

  /* Category Filter Rail & Tabs matching React UI */
  .category-rail{position:sticky;top:64px;z-index:20;border-bottom:1px solid #e2e8f0;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);padding:12px 0}
  .category-rail .shell{display:flex;justify-content:center}
  .category-tabs{display:inline-flex;max-width:100%;align-items:center;gap:4px;overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#f1f5f9;padding:4px;scrollbar-width:none}
  .category-tabs::-webkit-scrollbar{display:none}
  .category-tabs a{display:inline-flex;align-items:center;gap:6px;border-radius:12px;padding:0 16px;height:36px;color:#64748b;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;transition:all .15s ease;border:1px solid transparent;line-height:1}
  .category-tabs a:hover{color:#0f172a;background:rgba(226,232,240,.6)}
  .category-tabs a.active{background:#fff;color:#4f46e5;font-weight:800;border-color:rgba(226,232,240,.9);box-shadow:0 1px 3px rgba(15,23,42,.08)}
  .category-tabs .icon{width:14px;height:14px;flex-shrink:0}

  /* Content Grid & Cards */
  .index-content{padding:32px 0 80px}
  .library-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;margin-bottom:24px}
  .library-kicker{margin:0;color:#4f46e5;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
  .library-heading h2{margin:4px 0 0;font-size:28px;font-weight:800}
  .library-search{position:relative;width:100%;max-width:360px;display:flex;align-items:center;border:1px solid #e2e8f0;border-radius:16px;background:rgba(255,255,255,.9);padding:4px;box-shadow:0 4px 20px -4px rgba(15,23,42,.06);backdrop-filter:blur(16px);transition:all .3s ease}
  .library-search:hover{border-color:rgba(129,140,248,.5)}
  .library-search:focus-within{border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,.12)}
  .library-search span{display:inline-flex;align-items:center;justify-content:center;margin-left:10px;color:#94a3b8;transition:color .2s ease}
  .library-search span .icon{width:18px;height:18px}
  .library-search:focus-within span{color:#4f46e5}
  .library-search input{width:100%;height:36px;border:0;background:transparent;padding:0 12px;color:#0f172a;font:inherit;font-size:13px;font-weight:600;outline:none}
  .library-search input::placeholder{color:#94a3b8;font-weight:500}
  .section-title{margin:0 0 18px;font-size:22px;font-weight:800}
  .content-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:28px;align-items:start}
  
  .featured{display:grid;grid-template-columns:1.05fr 1.25fr;gap:24px;overflow:hidden;margin-bottom:26px;border:1px solid rgba(226,232,240,.8);border-radius:18px;background:#fff;padding:18px;text-decoration:none;box-shadow:0 16px 48px -36px rgba(15,23,42,.32)}
  .featured-image{position:relative;min-height:280px;overflow:hidden;border-radius:13px}
  .featured-image img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
  .featured:hover .featured-image img{transform:scale(1.04)}
  .featured-badge{position:absolute;left:16px;top:16px;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(79,70,229,.92);color:#fff;padding:5px 12px;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 5px 12px rgba(79,70,229,.25);backdrop-filter:blur(8px)}
  .featured-copy{display:flex;flex-direction:column;padding:8px 12px 8px 4px}
  .featured-topline{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .featured-meta{display:inline-flex;align-items:center;gap:4px;color:#94a3b8;font-size:12px;font-weight:700;line-height:1}
  .featured-meta .icon{width:14px;height:14px;color:#94a3b8;flex-shrink:0}
  .featured-copy h2{margin:14px 0 10px;font-size:28px;font-weight:800;line-height:1.2}
  .featured-copy h2 a{text-decoration:none;color:#0f172a;transition:color .2s ease}
  .featured-copy h2 a:hover{color:#4f46e5}
  .featured-copy p{margin:0;color:#475569;font-size:14px;line-height:1.65}
  .featured-editorial{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:auto;padding-top:18px;border-top:1px solid #f1f5f9;color:#64748b;font-size:12px;font-weight:600}

  .cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
  .card{position:relative;display:flex;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:17px;background:#fff;text-decoration:none;transition:.25s;flex-direction:column}
  .card:hover{transform:translateY(-4px);border-color:#a5b4fc;box-shadow:0 20px 48px -34px rgba(79,70,229,.48)}
  .card-visual{height:160px;overflow:hidden;background:var(--soft);position:relative}
  .card-visual img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
  .card:hover img{transform:scale(1.05)}
  .card-visual-icon{position:absolute;left:14px;bottom:14px;z-index:1;display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.8);border-radius:10px;background:rgba(255,255,255,.92);color:#4338ca;box-shadow:0 6px 16px -8px rgba(15,23,42,.3);backdrop-filter:blur(6px)}
  .card-visual-icon .icon{width:18px;height:18px}
  
  .card-copy{display:flex;flex:1;flex-direction:column;padding:18px}
  .card h2{font-size:16.5px;line-height:1.35;margin:10px 0 6px;font-weight:700;color:#0f172a;transition:color .2s ease}
  .card h2 a{color:inherit;text-decoration:none}
  .card h2 a:after{position:absolute;z-index:1;content:"";inset:0}
  .featured{position:relative}
  .featured-copy h2 a:after{position:absolute;z-index:1;content:"";inset:0}
  .card:hover h2{color:#4f46e5}
  .card p{display:-webkit-box;overflow:hidden;margin:0;color:#64748b;font-size:12.5px;line-height:1.6;-webkit-line-clamp:3;-webkit-box-orient:vertical}
  
  /* Card meta baseline alignment matching snippet 3 */
  .card .meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:14px;border-top:1px solid #f1f5f9;color:#64748b;font-size:11px;font-weight:500}
  .card-meta-group{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  .card-meta-item{display:inline-flex;align-items:center;gap:4px}
  .card-meta-item .icon{width:12.5px;height:12.5px;color:#64748b;flex-shrink:0}
  .card-meta-dot{color:#cbd5e1}
  .card-read-link{display:inline-flex;align-items:center;gap:4px;margin-left:auto;color:#4338ca;font-weight:700;font-size:11.5px;white-space:nowrap;transition:color .2s ease}
  .card-read-icon{width:13px;height:13px;transition:transform .2s ease}
  .card:hover .card-read-link{color:#4f46e5}
  .card:hover .card-read-icon{transform:translateX(3px)}

  .pagination{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:28px}
  .pagination a,.pagination span{display:flex;min-width:36px;height:36px;align-items:center;justify-content:center;border:1px solid #e2e8f0;border-radius:11px;background:#fff;color:#475569;padding:0 10px;text-decoration:none;font-size:12px;font-weight:800}
  .pagination a:hover,.pagination .active{border-color:#a5b4fc;background:#eef2ff;color:var(--indigo)}
  .sidebar{position:sticky;top:96px;display:grid;gap:18px}
  .side-card{border:1px solid var(--line);border-radius:17px;background:#fff;padding:18px}
  .side-card h2{margin:0 0 13px;font-size:16px;font-weight:800}
  .trend{display:flex;gap:10px;padding:9px 0;border-top:1px solid #f0f2f7;text-decoration:none}
  .trend:first-of-type{border-top:0}
  .trend b{display:flex;width:30px;height:30px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:50%;background:#eef2ff;color:var(--indigo);font-size:10px;font-weight:800}
  .trend span{font-size:11px;font-weight:700;line-height:1.45}
  .topic-list{display:flex;flex-wrap:wrap;gap:7px}
  .topic-list a{border:1px solid #e0e7ff;border-radius:999px;background:#eef2ff;color:#4338ca;padding:5px 9px;text-decoration:none;font-size:10px;font-weight:700}
  .practice-card{overflow:hidden;border-radius:17px;padding:22px;background:linear-gradient(145deg,#4f46e5,#8b5cf6);color:#fff}
  .practice-card h2{margin:10px 0 8px;font-size:20px}
  .practice-card p{margin:0 0 18px;color:#e7e7ff;font-size:13px}
  .practice-card .button{background:#fff;color:var(--indigo)}
  .library-empty{border:1px dashed #cbd5e1;border-radius:18px;background:#fff;padding:48px;text-align:center}
  .library-empty h2{margin:0 0 8px}
  .library-empty p{margin:0;color:var(--muted)}

  /* Article Page Typography & Text Width */
  .article-hero{position:relative;overflow:hidden;border-bottom:1px solid #e2e6ff;background:#fff;padding:40px 0 52px}
  .article-hero:before{position:absolute;inset:0;content:"";background:radial-gradient(circle at 12% 25%,rgba(99,102,241,.08),transparent 26%),radial-gradient(circle at 90% 10%,rgba(45,212,191,.08),transparent 24%)}
  .article-breadcrumbs{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:20px;color:#64748b;font-size:12px;font-weight:600}
  .article-breadcrumbs a{color:#64748b;text-decoration:none;transition:color .15s ease}
  .article-breadcrumbs a:hover{color:#4f46e5}
  .article-breadcrumbs .truncate-title{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#334155}
  
  .article-hero-grid{position:relative;display:grid;grid-template-columns:.95fr 1.05fr;gap:36px;align-items:center}
  .article-hero h1{max-width:720px;font-size:42px;line-height:1.12;letter-spacing:-.04em;font-weight:800;margin:16px 0 12px;color:#0f172a}
  .article-hero .intro{max-width:640px;color:#475569;font-size:16px;line-height:1.65;margin:0}
  
  /* Article Meta baseline alignment */
  .article-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin-top:24px;color:#64748b;font-size:13px;font-weight:500}
  .article-meta-item{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  .article-meta-item .icon{width:15px;height:15px;color:#64748b;flex-shrink:0}
  .article-author{color:#334155;font-weight:700;text-decoration:none}
  .article-author:hover{color:#4f46e5}
  .article-author-icon{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:50%;background:#eef2ff;color:#4f46e5;flex-shrink:0}
  .article-author-icon .icon{width:16px;height:16px;color:#4f46e5}
  .article-meta-divider{display:block;width:1px;height:16px;background:#e2e8f0}

  .article-photo{border:1px solid #dfe3ff;border-radius:25px;background:#f0f2ff;padding:7px;box-shadow:0 28px 70px -42px rgba(79,70,229,.5)}
  .article-photo img{display:block;width:100%;aspect-ratio:16/9;border-radius:19px;object-fit:cover}
  
  .article-layout{display:grid;grid-template-columns:minmax(0,1fr) 285px;gap:24px;align-items:start;max-width:1152px;padding-top:36px;padding-bottom:70px}
  .article-layout>div,.article-card,.article{min-width:0}
  .article-card{border:1px solid var(--line);border-radius:18px;background:#fff;padding:34px 38px;box-shadow:0 18px 55px -45px rgba(15,23,42,.4)}
  .article{font-size:16.5px;line-height:1.78;color:#334155}
  .article h2,.article h3{scroll-margin-top:105px;color:#0f172a;font-weight:800}
  .article h2{margin:1.8em 0 .6em;font-size:26px;line-height:1.25;letter-spacing:-.035em}
  .article h3{margin:1.6em 0 .5em;font-size:20px;line-height:1.35;letter-spacing:-.025em}
  .article p{margin:0 0 1.25em;color:#334155}
  .article li{margin:.4em 0}
  .article blockquote{margin:2em 0;padding:18px 22px;border-left:4px solid var(--indigo);background:linear-gradient(90deg,#eef2ff,#f7f3ff);border-radius:0 10px 10px 0;color:#4f46e5;font-size:17px;font-weight:650}
  .article a{color:var(--indigo);font-weight:700;text-underline-offset:4px}
  .article img{max-width:100%;height:auto;border-radius:14px}
  .tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:38px;padding-top:20px;border-top:1px solid var(--line)}
  .tag{border-radius:999px;background:#eef2ff;color:var(--indigo);padding:5px 10px;font-size:11px;font-weight:650}
  .toc-card{border:1px solid var(--line);border-radius:17px;background:#fff;padding:18px}
  .toc-card .toc-title{margin:0 0 12px;font-size:15px;font-weight:800;letter-spacing:-.045em;line-height:1.25}
  .toc-card a{display:block;padding:7px 8px;border-radius:7px;text-decoration:none;color:#5c6981;font-size:11px;font-weight:600}
  .toc-card a:hover{background:#eef2ff;color:var(--indigo)}
  .cta{margin-top:30px;border:1px solid #dfe3ff;border-radius:15px;padding:24px;background:linear-gradient(120deg,#eef2ff,#f6f0ff);display:flex;align-items:center;justify-content:space-between;gap:20px}
  .cta h2{margin:4px 0 5px;font-size:21px}
  .cta p{margin:0;color:var(--muted);font-size:12px}
  .article table{display:block;width:100%;overflow-x:auto;margin:1.8em 0;border-spacing:0;border-collapse:separate;border:1px solid var(--line);border-radius:12px;font-size:13px}
  .article th,.article td{min-width:125px;padding:12px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
  .article th{background:#eef2ff;color:#3730a3;font-weight:750}
  .article tr:last-child td{border-bottom:0}
  .article aside{margin:1.6em 0;padding:17px 19px;border:1px solid #c7d2fe;border-radius:12px;background:linear-gradient(120deg,#eef2ff,#f5f3ff)}
  .article aside p{margin:0;color:#3730a3}
  
  footer{border-top:1px solid var(--line);padding:32px 22px;background:#fff;color:var(--muted);font-size:12px}
  footer div{max-width:1280px;margin:auto;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}

  @media(max-width:1000px){.nav-center{display:none}.mobile-menu{display:block}.hero-grid,.article-hero-grid{grid-template-columns:1fr 1fr}.content-grid,.article-layout{grid-template-columns:minmax(0,1fr) 250px}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}h1{font-size:38px}}
  @media(max-width:760px){.site-nav{height:64px}.login{display:none}.hero-grid,.article-hero-grid,.content-grid,.article-layout,.featured{grid-template-columns:1fr}.index-hero,.article-hero{padding:32px 0}.hero-photo,.article-photo{margin-top:5px}.note{display:none}.category-rail{padding:14px 0}.category-rail .shell{justify-content:flex-start}.library-heading{align-items:stretch;flex-direction:column}.library-search{max-width:none}.sidebar{position:static}.cards{grid-template-columns:1fr}.featured{gap:16px;padding:14px}.featured-image{min-height:220px}.featured-copy{padding:8px}.article-card{padding:24px 18px}.article-layout{padding-top:20px}.hand{font-size:25px}h1{font-size:32px}.index-hero h1,.article-hero h1{font-size:32px}.cta{align-items:flex-start;flex-direction:column}}
`;

/*
 * Google truncates the SERP title by rendered width, not character count, so the
 * old 65-character guard still let branded titles overflow (a Seobility crawl
 * measured several at 584-610px against a 580px limit). These widths approximate
 * Arial 20px - the desktop SERP font - closely enough to decide whether the
 * " | IELTS Ai Pro" suffix still fits.
 */
// 580px is the real limit; the estimate below runs 5-15px light against measured
// widths, so the budget absorbs that bias rather than shipping titles at the edge.
const SERP_TITLE_MAX_PIXELS = 560;
const NARROW_TITLE_CHARS = new Set([...` .,:;!|'"()[]{}ijltfrI-`]);
const WIDE_TITLE_CHARS = new Set([...'mwMW@%']);

function estimateTitleWidth(value) {
  let width = 0;
  for (const character of value) {
    if (NARROW_TITLE_CHARS.has(character)) width += 6;
    else if (WIDE_TITLE_CHARS.has(character)) width += 16.5;
    else if (character >= 'A' && character <= 'Z') width += 13;
    else if (character >= '0' && character <= '9') width += 11;
    else width += 10.2;
  }
  return width;
}

function layout({
  title,
  description,
  canonical,
  type = 'website',
  robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  body,
  structuredData,
  image = DEFAULT_IMAGE,
}) {
  const brandedTitle = `${title} | IELTS Ai Pro`;
  const fullTitle =
    title.includes('IELTS Ai Pro') || estimateTitleWidth(brandedTitle) > SERP_TITLE_MAX_PIXELS
      ? title
      : brandedTitle;
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <meta http-equiv="content-language" content="en">
  <link rel="canonical" href="${escapeHtml(canonical)}"><link rel="icon" type="image/svg+xml" href="/logo-icon.svg"><link rel="icon" type="image/png" href="/favicon.png"><link rel="apple-touch-icon" href="/favicon.png">
  <link rel="alternate" type="application/rss+xml" title="IELTS Ai Pro Preparation Guides" href="${SITE_URL}/blog/feed.xml">
  <link rel="alternate" type="text/plain" title="IELTS Ai Pro for language models" href="${SITE_URL}/llms.txt">
  <meta property="og:title" content="${escapeHtml(fullTitle)}"><meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="${type}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:site_name" content="IELTS Ai Pro"><meta property="og:locale" content="en_GB"><meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(fullTitle)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}">
  ${structuredData.map((item) => `<script type="application/ld+json">${safeJson(item)}</script>`).join('')}
  <script>try{if(localStorage.getItem('vite-ui-theme')==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.add('light')}catch(_){document.documentElement.classList.add('light')}</script>
  <style>${CSS}</style>
  <style>
    header{position:fixed;left:0;right:0;top:0;height:auto;border:0;background:transparent;padding:0;transition:padding .35s ease}
    .site-nav{width:100%;max-width:none;height:64px;padding:0 max(32px,calc((100vw - 1280px)/2 + 32px));border-bottom:1px solid rgba(15,23,42,.06);background:rgba(255,255,255,.72);backdrop-filter:blur(14px);transition:height .35s ease,max-width .35s ease,padding .35s ease,border-radius .35s ease,box-shadow .35s ease}
    header.is-scrolled{padding:8px 24px}
    header.is-scrolled .site-nav{max-width:1280px;height:56px;padding:0 20px;border:1px solid rgba(15,23,42,.08);border-radius:999px;background:rgba(255,255,255,.86);box-shadow:0 14px 34px -22px rgba(15,23,42,.42)}
    .brand{display:inline-flex;align-items:center;text-decoration:none}.brand img{height:32px;width:auto;object-fit:contain}.brand .brand-dark{display:none}html.dark .brand .brand-light{display:none}html.dark .brand .brand-dark{display:block}
    .nav-center{gap:4px;border:1px solid rgba(15,23,42,.05);border-radius:999px;background:rgba(241,245,249,.52);padding:4px;box-shadow:inset 0 1px 2px rgba(15,23,42,.04)}.nav-center>a{border-radius:999px;padding:6px 16px;color:#64748b;font-size:13px;font-weight:700;letter-spacing:.025em}.nav-center>a:hover{background:rgba(79,70,229,.06);color:var(--indigo);box-shadow:inset 0 0 0 1px rgba(79,70,229,.1)}
    .nav-actions{gap:9px}.nav-actions .button{height:36px;border:0;border-radius:999px;background:#4f46e5;padding:0 20px;font-size:13px;font-weight:800;box-shadow:0 4px 12px rgba(79,70,229,.2);transition:transform .2s ease,background .2s ease,box-shadow .2s ease}.nav-actions .button:hover{transform:translateY(-1px) scale(1.02);background:#6366f1;box-shadow:0 9px 19px rgba(79,70,229,.35)}.nav-actions .button:active{transform:scale(.98)}.nav-actions .button .icon{width:14px;height:14px;margin-left:2px;transition:transform .2s ease}.nav-actions .button:hover .icon{transform:translateX(4px)}
    .theme-toggle{display:inline-flex;width:36px;height:36px;align-items:center;justify-content:center;border:1px solid #e2e8f0;border-radius:50%;background:rgba(241,245,249,.8);color:#6366f1;cursor:pointer;box-shadow:0 1px 2px rgba(15,23,42,.04);transition:transform .3s ease,background .3s ease,box-shadow .3s ease}.theme-toggle:hover{transform:scale(1.1);background:#eef2ff;box-shadow:0 7px 17px -11px rgba(79,70,229,.55)}.theme-toggle:active{transform:scale(.95)}.theme-toggle .theme-sun{display:none}.theme-toggle .icon{width:17px;height:17px}
    .mobile-menu-btn{display:none;width:34px;height:34px;align-items:center;justify-content:center;border:1px solid #e2e8f0;border-radius:50%;background:rgba(241,245,249,.9);color:#334155;cursor:pointer;padding:0;transition:all .2s ease}
    .mobile-menu-btn:hover{background:#eef2ff;color:#4f46e5}
    .mobile-menu-btn .icon-close{display:none}
    .mobile-menu-btn[aria-expanded="true"] .icon-menu{display:none}
    .mobile-menu-btn[aria-expanded="true"] .icon-close{display:inline-block}
    .mobile-backdrop{display:none;position:fixed;inset:0;top:64px;z-index:90;background:rgba(15,23,42,.6);backdrop-filter:blur(6px)}
    .mobile-backdrop.is-open{display:block}
    .mobile-card{display:none;position:absolute;left:12px;right:12px;top:calc(100% + 8px);z-index:99;border:1px solid #e2e8f0;border-radius:18px;background:#fff;padding:12px;box-shadow:0 20px 50px -10px rgba(15,23,42,.35)}
    .mobile-card.is-open{display:block;animation:mobile-card-in .22s cubic-bezier(.16,1,.3,1)}
    @keyframes mobile-card-in{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
    .mobile-card-header{display:flex;align-items:center;gap:6px;padding-bottom:8px;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:11px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}
    .mobile-card-sparkle{display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;border-radius:6px;background:#eef2ff;color:#4f46e5}
    .mobile-card-links{display:grid;gap:4px;padding:8px 0}
    .mobile-card-link{display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:12px;text-decoration:none;color:#0f172a;transition:background .15s ease}
    .mobile-card-link:hover{background:#f8fafc;color:#4f46e5}
    .mobile-link-icon{display:inline-flex;width:32px;height:32px;flex:0 0 auto;align-items:center;justify-content:center;border:1px solid rgba(199,210,254,.5);border-radius:8px;background:rgba(238,242,255,.8);color:#4f46e5}
    .mobile-card-link:hover .mobile-link-icon{background:#4f46e5;color:#fff;border-color:#4f46e5}
    .mobile-link-body{flex:1;min-width:0;display:flex;align-items:center;gap:6px}
    .mobile-link-label{font-size:12px;font-weight:800;color:#0f172a}
    .mobile-card-link:hover .mobile-link-label{color:#4f46e5}
    .mobile-link-badge{border:1px solid rgba(199,210,254,.6);border-radius:999px;background:#eef2ff;color:#4f46e5;padding:1px 6px;font-size:9px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}
    .mobile-link-arrow{color:#cbd5e1;transition:transform .15s ease,color .15s ease}
    .mobile-card-link:hover .mobile-link-arrow{color:#4f46e5;transform:translateX(2px)}
    .mobile-card-footer{padding-top:8px;border-top:1px solid #f1f5f9}
    .mobile-card-cta{display:flex;width:100%;height:40px;align-items:center;justify-content:center;gap:6px;border-radius:12px;background:#4f46e5;color:#fff;text-decoration:none;font-size:12px;font-weight:800;box-shadow:0 4px 12px rgba(79,70,229,.25);transition:background .15s ease}
    .mobile-card-cta:hover{background:#4338ca}
    html.dark .mobile-menu-btn{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#f8fafc}
    html.dark .mobile-backdrop{background:rgba(2,6,23,.75)}
    html.dark .mobile-card{border-color:rgba(255,255,255,.12);background:#090d16;box-shadow:0 20px 50px -10px rgba(0,0,0,.85)}
    html.dark .mobile-card-header{border-color:rgba(255,255,255,.08);color:#64748b}
    html.dark .mobile-card-sparkle{background:rgba(99,102,241,.15);color:#a5b4fc}
    html.dark .mobile-card-link{color:#f8fafc}
    html.dark .mobile-card-link:hover{background:rgba(255,255,255,.05)}
    html.dark .mobile-link-icon{border-color:rgba(99,102,241,.25);background:rgba(99,102,241,.12);color:#a5b4fc}
    html.dark .mobile-card-link:hover .mobile-link-icon{background:#6366f1;color:#fff}
    html.dark .mobile-link-label{color:#f8fafc}
    html.dark .mobile-card-link:hover .mobile-link-label{color:#a5b4fc}
    html.dark .mobile-link-badge{border-color:rgba(99,102,241,.3);background:rgba(99,102,241,.2);color:#c7d2fe}
    html.dark .mobile-link-arrow{color:#475569}
    html.dark .mobile-card-link:hover .mobile-link-arrow{color:#a5b4fc}
    html.dark .mobile-card-footer{border-color:rgba(255,255,255,.08)}
    @media(max-width:1000px){.mobile-menu-btn{display:inline-flex}}
    main{padding-top:64px}
    .index-hero{padding:64px 0}.index-hero .shell,.category-rail .shell,.index-content .shell{max-width:1280px;padding-left:24px;padding-right:24px}.index-hero h1{max-width:670px;font-size:55px}.index-hero .intro{max-width:576px}.hero-grid{gap:40px}.hero-photo{max-width:672px;margin-left:auto;border-radius:32px;padding:8px}.hero-photo img{border-radius:25px}.hero-sparkle{position:absolute;right:32px;top:-15px;width:32px;height:32px;color:#818cf8;transform:rotate(12deg)}
    .category-rail{padding:24px 0}.category-tabs{gap:4px;border-color:rgba(203,213,225,.3);background:rgba(241,245,249,.7);padding:4px}.category-tabs a{gap:8px;padding:10px 16px;font-size:12px;font-weight:900}.category-tabs .icon{width:14px;height:14px}.category-tabs a.active{border-color:rgba(226,232,240,.55);box-shadow:0 3px 10px rgba(15,23,42,.06)}
    .category-chip{flex:0 0 auto;transition:color .2s ease,background .2s ease,border-color .2s ease}
    .category-chip{display:inline-flex;width:max-content;align-items:center;gap:6px;border:1px solid;border-radius:999px;font-weight:700;white-space:nowrap}.category-chip .icon{width:14px;height:14px}.category-chip-default{padding:4px 12px;font-size:12px}.category-chip-sm{padding:2px 10px;font-size:11px}.category-chip-sm .icon{width:12px;height:12px}.category-chip[data-tone="writing"]{border-color:rgba(254,205,211,.8);background:rgba(255,241,242,.9);color:#be123c}.category-chip[data-tone="speaking"]{border-color:rgba(253,230,138,.8);background:rgba(255,251,235,.9);color:#92400e}.category-chip[data-tone="reading"]{border-color:rgba(167,243,208,.8);background:rgba(236,253,245,.9);color:#065f46}.category-chip[data-tone="listening"]{border-color:rgba(186,230,253,.8);background:rgba(240,249,255,.9);color:#075985}.category-chip[data-tone="planning"]{border-color:rgba(221,214,254,.8);background:rgba(245,243,255,.9);color:#5b21b6}.category-chip[data-tone="updates"]{border-color:rgba(199,210,254,.8);background:rgba(238,242,255,.9);color:#3730a3}.category-chip[data-tone="mock"]{border-color:rgba(245,208,254,.8);background:rgba(253,244,255,.9);color:#86198f}
    .library-kicker{font-size:12px}.library-heading h2{font-size:30px}.library-search span{display:flex}.library-search .icon{width:16px;height:16px}.section-title.latest-title{font-size:20px}
    .featured-carousel{position:relative;margin-bottom:20px}.featured-slide{display:none}.featured-slide.active{display:grid}.featured{grid-template-columns:1.05fr 1.25fr;gap:24px;margin:0;border-color:rgba(226,232,240,.65);border-radius:16px;padding:20px;box-shadow:0 16px 48px -38px rgba(15,23,42,.3)}.featured-image{display:block;min-height:280px;aspect-ratio:16/10;border-radius:12px}.featured-image .featured-badge{position:absolute;left:16px;top:16px;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(79,70,229,.92);color:#fff;padding:5px 12px;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 5px 12px rgba(79,70,229,.25);backdrop-filter:blur(8px)}.featured-badge .icon{width:12px;height:12px;color:#fde047;fill:#fde047}.featured-copy{padding:8px 16px 8px 8px}.featured-topline{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.featured-topline .meta{display:inline-flex;align-items:center;gap:5px;color:#94a3b8;font-weight:700}.featured-topline .meta .icon{width:14px;height:14px}.featured-copy h2{margin:18px 0 12px;font-size:32px;font-weight:900;line-height:1.12}.featured-copy h2 a{text-decoration:none}.featured-copy p{font-size:15px;font-weight:500;line-height:1.65}.featured-editorial{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:auto;padding-top:20px;border-top:1px solid #f1f5f9;color:#64748b;font-size:12px;font-weight:650}.carousel-arrow{position:absolute;top:50%;z-index:3;display:flex;width:44px;height:44px;align-items:center;justify-content:center;transform:translateY(-65%);border:1px solid #e2e8f0;border-radius:50%;background:#fff;color:#334155;box-shadow:0 8px 20px -10px rgba(15,23,42,.38);cursor:pointer}.carousel-arrow:hover{transform:translateY(-65%) scale(1.08);background:#f8fafc}.carousel-arrow .icon{width:20px;height:20px}.carousel-prev{left:-22px}.carousel-next{right:-22px}.carousel-status{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:10px;color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.carousel-dots{display:flex;align-items:center;gap:6px}.carousel-dot{width:8px;height:8px;border:0;border-radius:999px;background:#e2e8f0;padding:0;cursor:pointer}.carousel-dot.active{width:20px;background:#5262ef}
    .card-visual{position:relative;height:160px}.card-visual:after{position:absolute;inset:0;content:"";background:linear-gradient(to top,rgba(15,23,42,.2),transparent 55%)}.card-visual-icon{position:absolute;left:16px;bottom:16px;z-index:1;display:flex;width:40px;height:40px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.7);border-radius:12px;background:rgba(255,255,255,.9);color:#4338ca;box-shadow:0 8px 20px -10px rgba(15,23,42,.35);backdrop-filter:blur(8px)}.card-visual-icon .icon{width:20px;height:20px}.card-copy{padding:20px}.card h2{font-size:18px;line-height:1.4;transition:color .2s ease}.card:hover h2{color:#4f46e5}.card p{font-size:14px;line-height:1.7}.card .meta{align-items:center;justify-content:space-between;gap:10px}.card-meta-group{display:flex;align-items:center;gap:8px;white-space:nowrap}.card-read-link{display:inline-flex;align-items:center;gap:4px;margin-left:auto;color:#4338ca;font-weight:800;white-space:nowrap;transition:color .2s ease}.card-read-icon{width:14px;height:14px;transition:transform .2s ease}.card:hover .card-read-link{color:#4f46e5}.card:hover .card-read-icon{transform:translateX(4px)}
    .article-hero{padding:40px 0 56px}.article-hero .shell{max-width:1280px}
    .article-breadcrumbs{margin-bottom:32px}
    .article-hero-grid{grid-template-columns:.95fr 1.05fr;gap:36px}
    .article-category{display:inline-flex;align-items:center;gap:8px;border-color:#d1fae5;background:#ecfdf5;color:#047857;text-transform:uppercase;letter-spacing:.1em}.article-category .icon{width:14px;height:14px}
    .article-photo{position:relative;border-radius:28px;padding:8px}
    .article-photo img{height:auto;border-radius:22px}
    .article-photo-note{position:absolute;left:32px;bottom:-16px;display:block;transform:rotate(-3deg);border-radius:8px;background:#ede9fe;color:#5b21b6;padding:10px 16px;font-size:12px;font-weight:700;box-shadow:0 10px 24px -14px rgba(76,29,149,.55)}
    .mobile-toc{display:none}
    .article-layout{grid-template-columns:minmax(0,1fr) 300px;gap:24px;max-width:1152px;padding-top:40px}
    .article-card{border-radius:16px;padding:36px 40px}
    .editorial-card{margin-top:40px;display:flex;align-items:center;gap:20px;border:1px solid #e0e7ff;border-radius:16px;background:linear-gradient(90deg,#eef2ff,#f5f3ff);padding:24px}
    .editorial-icon{display:flex;width:48px;height:48px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:12px;background:#fff;color:var(--indigo);font-size:22px;box-shadow:0 4px 14px -10px #334155}
    .editorial-copy{flex:1}.editorial-copy .eyebrow{border:0;background:transparent;padding:0;text-transform:uppercase;letter-spacing:.12em}
    .editorial-copy h2{margin:4px 0 3px;font-size:18px}.editorial-copy p{margin:0;font-size:14px;line-height:1.5}
    .article .editorial-card .button{color:#fff;text-decoration:none;border-radius:12px}
    .site-footer{position:relative;overflow:hidden;border-top:1px solid rgba(255,255,255,.1);background:#050711;color:#cbd5e1;padding:64px 0 40px;font-size:14px}
    .site-footer:before{position:absolute;left:0;right:0;top:0;height:2px;content:"";background:linear-gradient(90deg,transparent,rgba(99,102,241,.65),transparent)}
    .footer-glow{position:absolute;width:480px;height:480px;border-radius:50%;filter:blur(130px);pointer-events:none}.footer-glow-one{left:15%;top:-300px;background:rgba(79,70,229,.14)}.footer-glow-two{right:15%;bottom:-330px;background:rgba(147,51,234,.12)}
    .footer-shell{position:relative;z-index:1;max-width:1280px;margin:auto;padding:0 24px}
    .footer-main{display:grid;grid-template-columns:1fr 2fr;gap:48px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:48px}
    .footer-brand-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.footer-brand{display:inline-flex;align-items:center;text-decoration:none}.footer-brand img{height:40px;width:auto;object-fit:contain}.ai-badge{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(99,102,241,.3);border-radius:999px;background:rgba(99,102,241,.15);color:#a5b4fc;padding:5px 11px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .footer-description{max-width:440px;margin:20px 0;color:#94a3b8;font-size:14px;font-weight:500;line-height:1.7}
    .footer-contact-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.footer-email{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.04);color:#e2e8f0;padding:10px 14px;text-decoration:none;font-size:12px;font-weight:700}
    .footer-socials{display:flex;gap:10px}.footer-socials a{display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.04);color:#cbd5e1;text-decoration:none;font-size:12px;font-weight:800}.footer-socials a:hover,.footer-email:hover{border-color:rgba(129,140,248,.5);background:rgba(99,102,241,.15);color:#fff}
    .footer-navigation{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}.footer-group{min-width:0}.footer-group summary{display:flex;align-items:center;gap:8px;color:#cbd5e1;cursor:default;list-style:none;font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.footer-group summary::-webkit-details-marker{display:none}.footer-group-icon{color:#818cf8;font-size:14px}.footer-group ul{display:grid;gap:10px;margin:18px 0 0;padding:0;list-style:none}.footer-group a{color:#94a3b8;text-decoration:none;font-size:14px;font-weight:500}.footer-group a:hover{color:#fff}
    .footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:24px;padding-top:32px;color:#94a3b8;font-size:12px}.footer-legal{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.footer-legal a{color:#94a3b8;text-decoration:none}.footer-legal a:hover{color:#fff}.footer-trust{display:flex;align-items:center;gap:12px}.independence-badge{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.03);padding:7px 13px;font-size:11px;font-weight:600;text-align:center}.back-to-top{display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.04);color:#cbd5e1;cursor:pointer}.back-to-top:hover{border-color:rgba(129,140,248,.55);background:rgba(99,102,241,.2);color:#fff}
    @media(max-width:1000px){.site-nav{padding:0 24px}.article-hero-grid{grid-template-columns:1fr 1fr}.article-layout{grid-template-columns:minmax(0,1fr) 270px}.carousel-prev{left:-12px}.carousel-next{right:-12px}}
    @media(max-width:1000px){.footer-main{grid-template-columns:1fr;gap:40px}.footer-navigation{grid-template-columns:repeat(2,minmax(0,1fr))}}
    /* Server-rendered parity with the React blog components. These rules keep intrinsic image widths from expanding the grid during carousel transitions. */
    .featured-carousel{min-width:0;overflow:visible}.featured-slide{min-width:0}.featured-slide.active{animation:featured-slide-in .34s cubic-bezier(.16,1,.3,1)}.featured,.featured-copy,.featured-image{min-width:0}.featured-image{width:100%;isolation:isolate}.featured-image img{display:block;width:100%;max-width:100%;min-width:0}.featured-copy h2{overflow-wrap:anywhere}.featured-copy h2 a{display:block}.carousel-arrow{transition:transform .2s ease,background .2s ease,box-shadow .2s ease}.carousel-arrow:active{transform:translateY(-65%) scale(.95)}@keyframes featured-slide-in{from{opacity:0;transform:translateX(var(--slide-enter,32px)) scale(.985)}to{opacity:1;transform:translateX(0) scale(1)}}
    .side-card{box-shadow:0 15px 40px -32px rgba(15,23,42,.3)}.side-card h2{display:flex;align-items:center;gap:8px}.side-card-title-icon{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9px;background:#eef2ff;color:#4f46e5}.trend{margin:1px 0;border:0;border-radius:12px;padding:8px;transition:background .2s ease}.trend:hover{background:#f8fafc}.trend:hover b{background:#e0e7ff}.trend:hover span{color:#4338ca}.topic-list a{padding:6px 10px;transition:background .2s ease,transform .2s ease,box-shadow .2s ease}.topic-list a:hover{transform:translateY(-1px);background:#e0e7ff;box-shadow:0 6px 13px -10px rgba(67,56,202,.5)}
    .practice-card{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 105px;align-items:end;min-height:220px;border-radius:24px;padding:24px;box-shadow:0 10px 25px -5px rgba(99,102,241,.2);transition:transform .3s ease,box-shadow .3s ease}.practice-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -15px rgba(99,102,241,.4)}.practice-content{position:relative;z-index:2}.practice-card h2{margin:0;font-size:20px;line-height:1.2;letter-spacing:-.035em}.practice-card p{max-width:170px;margin:8px 0 0;font-size:12px;line-height:1.55}.practice-button{display:inline-flex;align-items:center;gap:5px;margin-top:20px;border-radius:12px;background:#fff;color:#3b2e9b;padding:10px 14px;text-decoration:none;font-size:12px;font-weight:800;box-shadow:0 4px 12px rgba(15,23,42,.12);transition:transform .3s ease,box-shadow .3s ease,background .3s ease}.practice-button .icon{width:14px;height:14px;transition:transform .3s ease}.practice-button:hover{transform:scale(1.05);background:#f8fafc;box-shadow:0 10px 22px -12px rgba(15,23,42,.5)}.practice-button:hover .icon{transform:translateX(4px)}.practice-button:active{transform:scale(.95)}.practice-sparkle{position:absolute;z-index:1;color:#a2e9ff;text-shadow:0 0 8px rgba(162,233,255,.6);animation:practice-float 4s ease-in-out infinite}.practice-sparkle-large{right:48px;top:21px;font-size:22px}.practice-sparkle-small{right:22px;top:46px;font-size:11px;animation-delay:.5s;animation-duration:3s}.practice-mockup{position:relative;right:-12px;bottom:-20px;display:flex;width:105px;height:135px;flex-direction:column;align-items:flex-start;border:1px solid rgba(255,255,255,.55);border-radius:18px;background:#fff;color:#1e293b;padding:12px;box-shadow:0 15px 30px rgba(0,0,0,.18);transform:rotate(8deg);transition:transform .3s ease}.practice-card:hover .practice-mockup{transform:translate(-2px,-2px) rotate(6deg)}.practice-mockup-line{width:28px;height:6px;border-radius:99px;background:#f1f5f9}.practice-mockup strong{margin:auto 0 0;font-size:25px;line-height:1;font-weight:900}.practice-mockup small{font-size:7px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}.practice-bars{display:flex;align-items:flex-end;gap:2px;width:100%;height:30px;margin-top:auto}.practice-bars i{width:5px;border-radius:99px;background:#e0e2ff}.practice-bars i:nth-child(1){height:40%}.practice-bars i:nth-child(2){height:60%}.practice-bars i:nth-child(3){height:50%}.practice-bars i:nth-child(4){height:85%;background:#c9ccff}.practice-bars i:nth-child(5){height:70%}.practice-bars i:nth-child(6){height:95%;background:#c9ccff}@keyframes practice-float{50%{transform:translateY(-4px) rotate(5deg) scale(1.05)}}
    .article-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-top:28px;color:#64748b;font-size:14px}.article-meta-item{display:inline-flex;align-items:center;gap:8px}.article-meta-item .icon{width:16px;height:16px}.article-author{color:#334155;font-weight:700}.article-author-icon{display:inline-flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:50%;background:#eef2ff;color:#4f46e5}.article-meta-divider{display:block;width:1px;height:20px;background:#e2e8f0}
    .toc-card{padding:20px;box-shadow:0 15px 40px -32px rgba(15,23,42,.3)}.toc-heading{display:flex;align-items:center;gap:8px}.toc-heading .toc-title{margin:0}.toc-icon{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9px;background:#eef2ff;color:#4f46e5}.toc-icon .icon{width:16px;height:16px}.toc-count{display:none;border-radius:999px;background:#eef2ff;color:#4338ca;padding:2px 7px;font-size:11px;font-weight:800}.toc-toggle{display:none;margin-left:auto;width:32px;height:32px;border:0;border-radius:9px;background:transparent;color:#64748b;cursor:pointer}.toc-toggle:hover{background:#f1f5f9}.toc-toggle .icon{width:16px;height:16px;transition:transform .2s ease}.toc-card[data-toc-open="false"] .toc-toggle .icon{transform:rotate(180deg)}.toc-links{display:grid;gap:2px;margin-top:14px;max-height:55vh;overflow:auto}.toc-card a{position:relative;border-radius:12px;padding:8px 10px;color:#475569;transition:background .2s ease,color .2s ease}.toc-card a:hover,.toc-card a.is-active{background:#eef2ff;color:#4338ca}.toc-card a.is-active:before{position:absolute;left:5px;top:50%;width:3px;height:16px;border-radius:999px;background:#4f46e5;content:"";transform:translateY(-50%)}
    html.dark{color-scheme:dark;--page:#080b12;--surface:#0f172a;--ink:#f8fafc;--muted:#b6c0d0;--line:rgba(255,255,255,.1);--soft:rgba(99,102,241,.12)}html.dark body,html.dark .index-hero,html.dark .category-rail,html.dark .article-hero{background:#0b0f18;color:#f8fafc}html.dark .site-nav{border-color:rgba(255,255,255,.08);background:rgba(9,13,23,.78)}html.dark header.is-scrolled .site-nav{background:rgba(9,13,23,.94);border-color:rgba(255,255,255,.12)}html.dark .nav-center{border-color:rgba(255,255,255,.08);background:rgba(255,255,255,.05)}html.dark .nav-center>a{color:#cbd5e1}html.dark .nav-center>a:hover{background:rgba(99,102,241,.16);color:#c7d2fe}html.dark .theme-toggle{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.1);color:#fbbf24}html.dark .theme-toggle .theme-moon{display:none}html.dark .theme-toggle .theme-sun{display:block}html.dark .featured,html.dark .card,html.dark .side-card,html.dark .toc-card,html.dark .article-card{background:#0f172a;border-color:rgba(255,255,255,.1)}html.dark .featured-copy h2,html.dark .featured-copy h2 a,html.dark .card h2,html.dark .article h1,html.dark .article h2,html.dark .article h3,html.dark .index-hero h1,html.dark .article-hero h1{color:#fff!important}html.dark .featured-copy h2 a:hover,html.dark .featured:hover .featured-copy h2 a{color:#a5b4fc!important}html.dark .featured-copy h2 a:hover{color:#a5b4fc}html.dark .hand{color:#a5b4fc!important}html.dark .intro{color:#94a3b8!important}html.dark .article p{color:#cbd5e1}html.dark .featured-editorial{border-color:rgba(255,255,255,.08)}html.dark .trend{color:#f8fafc}html.dark .trend span{color:#f8fafc}html.dark .trend:hover{background:rgba(255,255,255,.06)}html.dark .trend:hover span{color:#a5b4fc!important}html.dark .topic-list a,html.dark .toc-card a.is-active,html.dark .toc-card a:hover{background:rgba(99,102,241,.14);border-color:rgba(129,140,248,.25);color:#c7d2fe}html.dark .article-meta{color:#aab7cc}html.dark .article-author{color:#e2e8f0}html.dark .article-author-icon,html.dark .toc-icon{background:rgba(99,102,241,.14);color:#c7d2fe}.dark-surface{background:#0f172a}
    html.dark .card-read-link{color:#a5b4fc!important}html.dark .card:hover .card-read-link{color:#c7d2fe!important}html.dark .card:hover h2{color:#818cf8!important}html.dark .category-rail{border-color:rgba(255,255,255,.05)}html.dark .category-tabs{border-color:rgba(255,255,255,.05);background:rgba(15,23,42,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}html.dark .category-tabs a{color:#94a3b8}html.dark .category-tabs a:hover{background:rgba(30,41,59,.62);color:#f1f5f9}html.dark .category-tabs a.active{border-color:rgba(255,255,255,.05);background:#1e293b;color:#c7d2fe;box-shadow:0 3px 10px rgba(0,0,0,.24)}html.dark .library-search{border-color:rgba(255,255,255,.1);background:rgba(15,23,42,.9);box-shadow:0 4px 20px -4px rgba(0,0,0,.4)}html.dark .library-search:hover{border-color:rgba(129,140,248,.3)}html.dark .library-search:focus-within{border-color:#818cf8;box-shadow:0 0 0 4px rgba(129,140,248,.2)}html.dark .library-search:focus-within span{color:#a5b4fc}html.dark .library-search input{color:#f8fafc}html.dark .library-search input::placeholder{color:#94a3b8}html.dark .index-content{background:#080b12}html.dark .library-kicker{color:#a5b4fc}html.dark .hero-photo,html.dark .article-photo{border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.04);box-shadow:0 30px 70px -42px rgba(99,102,241,.32)}html.dark .article-photo-note{background:rgba(99,102,241,.2);color:#ddd6fe}html.dark .article-category{border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.15);color:#6ee7b7}html.dark .note.one{background:rgba(109,40,217,.24);color:#ddd6fe}html.dark .note.two{background:rgba(6,95,70,.24);color:#a7f3d0}html.dark .featured{box-shadow:0 16px 48px -30px rgba(0,0,0,.45)}html.dark .featured-copy p,html.dark .card p{color:#cbd5e1}html.dark .featured-topline .meta,html.dark .card .meta{color:#94a3b8}html.dark .featured-editorial,html.dark .card .meta{border-color:rgba(255,255,255,.06)}html.dark .card:hover{border-color:rgba(99,102,241,.3);box-shadow:0 20px 48px -32px rgba(0,0,0,.58)}html.dark .carousel-arrow{border-color:rgba(255,255,255,.1);background:#020617;color:#e2e8f0;box-shadow:0 8px 20px -10px rgba(0,0,0,.65)}html.dark .carousel-arrow:hover{background:#0f172a}.dark .carousel-dot{background:#334155}.dark .carousel-dot.active{background:#818cf8}html.dark .side-card-title-icon,html.dark .trend b{background:rgba(99,102,241,.12);color:#c7d2fe}html.dark .trend:hover b{background:rgba(99,102,241,.2)}html.dark .trend small{color:#94a3b8!important}html.dark .topic-list a{background:rgba(99,102,241,.1);border-color:rgba(129,140,248,.2);color:#c7d2fe}html.dark .topic-list a:hover{background:rgba(99,102,241,.2);box-shadow:0 6px 13px -10px rgba(129,140,248,.6)}html.dark .pagination a,html.dark .pagination span{border-color:rgba(255,255,255,.1);background:#0f172a;color:#cbd5e1}html.dark .pagination a:hover,html.dark .pagination .active{border-color:rgba(129,140,248,.45);background:rgba(99,102,241,.16);color:#c7d2fe}html.dark .library-empty{border-color:rgba(255,255,255,.15);background:#0f172a}.dark .category-chip[data-tone="writing"]{border-color:rgba(244,63,94,.3);background:rgba(244,63,94,.15);color:#fda4af}.dark .category-chip[data-tone="speaking"]{border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.15);color:#fcd34d}.dark .category-chip[data-tone="reading"]{border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.15);color:#6ee7b7}.dark .category-chip[data-tone="listening"]{border-color:rgba(14,165,233,.3);background:rgba(14,165,233,.15);color:#7dd3fc}.dark .category-chip[data-tone="planning"]{border-color:rgba(139,92,246,.3);background:rgba(139,92,246,.15);color:#c4b5fd}.dark .category-chip[data-tone="updates"]{border-color:rgba(99,102,241,.3);background:rgba(99,102,241,.15);color:#c7d2fe}.dark .category-chip[data-tone="mock"]{border-color:rgba(217,70,239,.3);background:rgba(217,70,239,.15);color:#f0abfc}html.dark .article table{border-color:rgba(255,255,255,.1)}html.dark .article th{background:rgba(99,102,241,.14);color:#c7d2fe}html.dark .article th,html.dark .article td{border-color:rgba(255,255,255,.08)}html.dark .article aside,html.dark .editorial-card,html.dark .cta{border-color:rgba(129,140,248,.24);background:linear-gradient(90deg,rgba(79,70,229,.14),rgba(139,92,246,.1))}html.dark .article aside p,html.dark .editorial-copy p{color:#dbeafe}html.dark .editorial-icon{background:#0f172a;color:#c7d2fe;box-shadow:0 4px 14px -10px #000}html.dark .tag{background:rgba(99,102,241,.14);color:#c7d2fe}html.dark .article blockquote{background:linear-gradient(90deg,rgba(79,70,229,.14),rgba(139,92,246,.1));color:#c7d2fe}
    @media(max-width:760px){header .site-nav{height:64px;padding:0 20px}header.is-scrolled{padding:8px 12px}header.is-scrolled .site-nav{height:52px;padding:0 14px}.nav-actions>.button{display:none}main{padding-top:64px}.index-hero{padding:48px 0}.index-hero h1{font-size:36px}.index-hero .shell,.category-rail .shell,.index-content .shell,.article-hero .shell,.article-layout{padding-left:20px;padding-right:20px}.article-hero{padding:34px 0 44px}.article-hero h1{font-size:36px}.article-hero-grid,.article-layout{grid-template-columns:1fr}.article-photo-note{display:none}.article-layout{padding-top:24px}.mobile-toc{display:block;margin-bottom:24px}.sidebar .toc-card{display:none}.article-card{padding:28px 20px}.featured{grid-template-columns:1fr;padding:16px}.featured-image{min-height:0;aspect-ratio:16/10}.featured-copy{padding:8px 0}.featured-topline{flex-wrap:nowrap}.featured-copy h2{margin:16px 0 0;font-size:20px}.featured-copy p{display:-webkit-box;overflow:hidden;margin:16px 0 0;font-size:14px;line-height:1.625;-webkit-box-orient:vertical;-webkit-line-clamp:3}.carousel-arrow{width:40px;height:40px}.carousel-prev{left:-12px}.carousel-next{right:-12px}.editorial-card{align-items:flex-start;flex-direction:column}.editorial-copy{width:100%}.practice-card{grid-template-columns:minmax(0,1fr) 92px;padding:22px}.practice-mockup{width:92px;height:122px}.site-footer{padding:48px 0 32px}.footer-shell{padding:0 20px}.footer-main{gap:32px;padding-bottom:34px}.footer-navigation{grid-template-columns:1fr;gap:10px}.footer-group{border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(255,255,255,.02);padding:14px}.footer-group summary{cursor:pointer}.footer-group:not([open]) ul{display:none}.footer-bottom{align-items:stretch;flex-direction:column;text-align:center}.footer-legal,.footer-trust{justify-content:center}.footer-trust{flex-direction:column}.footer-contact-row{align-items:stretch;flex-direction:column}.footer-socials{justify-content:center}.footer-email{justify-content:center}.toc-count,.toc-toggle{display:inline-flex;align-items:center;justify-content:center}.toc-card[data-toc-open="false"] .toc-links{display:none}}
  </style>
</head><body>
  <a class="skip" href="#main">Skip to content</a>
  <header id="public-header">
    <div class="mobile-backdrop" data-mobile-backdrop></div>
    <nav class="site-nav" aria-label="Primary">
      <a class="brand" href="/" aria-label="IELTS Ai Pro Home"><img src="/logo.svg" alt="IELTS Ai Pro Logo" class="brand-light"><img src="/footer.svg" alt="IELTS Ai Pro Logo" class="brand-dark"></a>
      <div class="nav-center">
        <a href="/#features">Platform</a>
        <a href="/ielts-writing-checker">Writing checker</a>
        <a href="/#how-it-works">How it works</a>
        <a href="/blog">Blog</a>
        <a href="/ielts-band-score-calculator">Calculator</a>
        <a href="/#pricing">Pricing</a>
      </div>
      <div class="nav-actions">
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme" aria-pressed="false"><span class="theme-moon">${iconSvg('moon')}</span><span class="theme-sun">${iconSvg('sun')}</span></button>
        <a class="button" href="/signup">Start Free ${iconSvg('arrow-right')}</a>
        <button class="mobile-menu-btn" type="button" data-mobile-menu-btn aria-label="Open menu" aria-expanded="false"><span class="icon-menu">${iconSvg('menu')}</span><span class="icon-close">${iconSvg('x')}</span></button>
      </div>
    </nav>
    <div class="mobile-card" data-mobile-card>
      <div class="mobile-card-header">
        <span class="mobile-card-sparkle">${iconSvg('sparkles')}</span>
        <span>Menu</span>
      </div>
      <div class="mobile-card-links">
        <a href="/#features" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('layers')}</div>
          <div class="mobile-link-body"><span class="mobile-link-label">Platform</span></div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/ielts-writing-checker" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('pen-line')}</div>
          <div class="mobile-link-body"><span class="mobile-link-label">Writing checker</span><span class="mobile-link-badge">Popular</span></div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/#how-it-works" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('help-circle')}</div>
          <div class="mobile-link-body"><span class="mobile-link-label">How it works</span></div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/blog" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('book-open')}</div>
          <div class="mobile-link-body"><span class="mobile-link-label">Blog</span></div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/ielts-band-score-calculator" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('calculator')}</div>
          <div class="mobile-link-body"><span class="mobile-link-label">Calculator</span></div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/#pricing" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('tag')}</div>
          <div class="mobile-link-body"><span class="mobile-link-label">Pricing</span></div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
      </div>
      <div class="mobile-card-footer">
        <a href="/signup" class="mobile-card-cta">
          <span>Start Free Practice</span>
          ${iconSvg('arrow-right')}
        </a>
      </div>
    </div>
  </header>
  ${body}
  <footer class="site-footer">
    <span class="footer-glow footer-glow-one" aria-hidden="true"></span><span class="footer-glow footer-glow-two" aria-hidden="true"></span>
    <div class="footer-shell">
      <div class="footer-main">
        <div>
          <div class="footer-brand-row"><a class="footer-brand" href="/" aria-label="IELTS Ai Pro Home"><img src="/footer.svg" alt="IELTS Ai Pro Logo"></a><span class="ai-badge">✦ AI Powered</span></div>
          <p class="footer-description">Web-based IELTS practice platform for Reading, Listening, Writing, and Speaking with instant criterion-based AI practice feedback, score analytics, and target-band guidance.</p>
          <div class="footer-contact-row"><a class="footer-email" href="mailto:mail@ieltsai.pro">✉ mail@ieltsai.pro</a><div class="footer-socials"><a href="https://facebook.com" aria-label="Follow us on Facebook">f</a><a href="https://instagram.com" aria-label="Follow us on Instagram">◎</a><a href="https://x.com" aria-label="Follow us on X (Twitter)">X</a><a href="https://youtube.com" aria-label="Follow us on YouTube">▶</a><a href="https://linkedin.com" aria-label="Follow us on LinkedIn">in</a></div></div>
        </div>
        <nav class="footer-navigation" aria-label="Footer">
          <details class="footer-group" open><summary><span class="footer-group-icon">▦</span>Core Features</summary><ul><li><a href="/ielts-band-score-calculator">Band Score Calculator</a></li><li><a href="/ielts-writing-checker">Writing Task Evaluator</a></li><li><a href="/ielts-speaking-practice-ai">Speaking Test Simulator</a></li><li><a href="/cambridge-ielts-practice-tests#listening">Listening Practice Hub</a></li><li><a href="/cambridge-ielts-practice-tests#reading">Reading Comprehension</a></li></ul></details>
          <details class="footer-group" open><summary><span class="footer-group-icon">▤</span>Test Prep</summary><ul><li><a href="/blog?category=Writing">Writing Band Score Criteria</a></li><li><a href="/blog?category=Speaking">Speaking Criteria Breakdown</a></li><li><a href="/blog?category=Reading">Reading Strategies</a></li><li><a href="/blog?category=Listening">Listening Strategies</a></li></ul></details>
          <details class="footer-group" open><summary><span class="footer-group-icon">✦</span>Resources</summary><ul><li><a href="/blog">IELTS Prep Blog &amp; Guides</a></li><li><a href="/cambridge-ielts-practice-tests">Cambridge Practice Material</a></li><li><a href="/blog?category=Mock%20Tests">Mock Test Guides</a></li><li><a href="/blog?category=Study%20Planning">Study Plans</a></li></ul></details>
          <details class="footer-group" open><summary><span class="footer-group-icon">▣</span>Company</summary><ul><li><a href="/about">About Platform</a></li><li><a href="/contact">Contact Support</a></li><li><a href="/privacy">Privacy Policy</a></li><li><a href="/terms">Terms of Service</a></li></ul></details>
        </nav>
      </div>
      <div class="footer-bottom"><div class="footer-legal"><span>© ${new Date().getFullYear()} IELTS Ai Pro</span><span>•</span><a href="/privacy">Privacy Policy</a><span>•</span><a href="/terms">Terms of Service</a><span>•</span><a href="/about">About Platform</a></div><div class="footer-trust"><span class="independence-badge">✓ Independent prep platform. Not affiliated with IELTS, IDP, or British Council.</span><button class="back-to-top" type="button" aria-label="Scroll back to top" title="Back to top">↑</button></div></div>
    </div>
  </footer>
  <script>
    (()=>{const root=document.documentElement;const h=document.getElementById('public-header');const mobBtn=document.querySelector('[data-mobile-menu-btn]');const mobCard=document.querySelector('[data-mobile-card]');const mobBackdrop=document.querySelector('[data-mobile-backdrop]');const toggleMobileMenu=(open)=>{const isCurrentlyOpen=mobCard?.classList.contains('is-open');const shouldOpen=open!==undefined?open:!isCurrentlyOpen;mobBtn?.setAttribute('aria-expanded',String(shouldOpen));mobBtn?.setAttribute('aria-label',shouldOpen?'Close menu':'Open menu');mobCard?.classList.toggle('is-open',shouldOpen);mobBackdrop?.classList.toggle('is-open',shouldOpen);document.body.style.overflow=shouldOpen?'hidden':''};mobBtn?.addEventListener('click',()=>toggleMobileMenu());mobBackdrop?.addEventListener('click',()=>toggleMobileMenu(false));mobCard?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggleMobileMenu(false)));const groups=[...document.querySelectorAll('.footer-group')];const sync=()=>h?.classList.toggle('is-scrolled',scrollY>20);const syncFooter=()=>groups.forEach((group,index)=>{group.open=innerWidth>=640||index===0});const theme=document.querySelector('[data-theme-toggle]');const syncTheme=()=>{const dark=root.classList.contains('dark');theme?.setAttribute('aria-pressed',String(dark));theme?.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme')};theme?.addEventListener('click',()=>{const dark=!root.classList.contains('dark');root.classList.toggle('dark',dark);root.classList.toggle('light',!dark);try{localStorage.setItem('vite-ui-theme',dark?'dark':'light')}catch(_){}syncTheme()});addEventListener('scroll',sync,{passive:true});addEventListener('resize',syncFooter,{passive:true});sync();syncFooter();syncTheme();document.querySelector('.back-to-top')?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));document.querySelectorAll('[data-toc-card]').forEach(card=>{const toggle=card.querySelector('.toc-toggle');const links=[...card.querySelectorAll('[data-toc-link]')];const setOpen=open=>{card.dataset.tocOpen=String(open);toggle?.setAttribute('aria-expanded',String(open));toggle?.setAttribute('aria-label',open?'Collapse table of contents':'Expand table of contents')};setOpen(true);toggle?.addEventListener('click',()=>setOpen(card.dataset.tocOpen==='false'));links.forEach(link=>link.addEventListener('click',()=>{setOpen(true);links.forEach(item=>item.classList.toggle('is-active',item===link))}));const headings=links.map(link=>document.getElementById(link.getAttribute('href')?.slice(1))).filter(Boolean);if(headings.length&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(link=>link.classList.toggle('is-active',link.getAttribute('href')==='#'+entry.target.id))}}),{rootMargin:'-80px 0px -75% 0px'});headings.forEach(heading=>observer.observe(heading))}});document.querySelectorAll('[data-featured-carousel]').forEach(carousel=>{const slides=[...carousel.querySelectorAll('[data-featured-slide]')];const dots=[...carousel.querySelectorAll('[data-carousel-dot]')];const count=carousel.querySelector('[data-carousel-count]');let active=0,timer,touchStart;const show=(index,direction=1)=>{active=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{const current=i===active;slide.classList.toggle('active',current);if(current){slide.style.setProperty('--slide-enter',(direction<0?'-':'')+'32px');slide.classList.remove('is-entering');void slide.offsetWidth;slide.classList.add('is-entering')}});dots.forEach((dot,i)=>{dot.classList.toggle('active',i===active);i===active?dot.setAttribute('aria-current','true'):dot.removeAttribute('aria-current')});if(count)count.textContent=(active+1)+' of '+slides.length};const stop=()=>clearInterval(timer);const start=()=>{stop();if(slides.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(active+1,1),6000)};const move=direction=>{show(active+direction,direction);start()};carousel.querySelector('.carousel-prev')?.addEventListener('click',()=>move(-1));carousel.querySelector('.carousel-next')?.addEventListener('click',()=>move(1));dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i,i>=active?1:-1);start()}));carousel.addEventListener('mouseenter',stop);carousel.addEventListener('mouseleave',start);carousel.addEventListener('focusin',stop);carousel.addEventListener('focusout',event=>{if(!carousel.contains(event.relatedTarget))start()});carousel.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();move(-1)}if(event.key==='ArrowRight'){event.preventDefault();move(1)}});carousel.addEventListener('touchstart',event=>{touchStart=event.touches[0]?.clientX},{passive:true});carousel.addEventListener('touchend',event=>{const end=event.changedTouches[0]?.clientX;if(typeof touchStart==='number'&&typeof end==='number'&&Math.abs(touchStart-end)>48)move(touchStart>end?1:-1);touchStart=undefined},{passive:true});show(0,0);start()})})();
  </script>
</body></html>`;
}

function renderIndex(posts, requestQuery = {}) {
  const category = Array.isArray(requestQuery.category)
    ? requestQuery.category[0]
    : requestQuery.category || 'All';
  const query = (Array.isArray(requestQuery.q) ? requestQuery.q[0] : requestQuery.q || '').trim();
  const normalizedQuery = query.toLowerCase();
  const requestedPage = Math.max(
    1,
    Number(Array.isArray(requestQuery.page) ? requestQuery.page[0] : requestQuery.page) || 1
  );
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = category === 'All' || post.category === category;
    const searchable =
      `${post.title} ${post.description || ''} ${(post.seo_tags || []).join(' ')}`.toLowerCase();
    return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const isEditorialView = category === 'All' && !query;
  /*
   * Only the first carousel slide used to be removed from the card grid, so the
   * remaining featured articles rendered their title and description twice on
   * /blog - reported as duplicate headings and duplicate paragraphs. Every article
   * promoted into the carousel is now excluded from the grid on all pages, which
   * also keeps pagination stable as the reader moves past page one.
   */
  const editorialFeatured = isEditorialView
    ? posts.filter((post) => post.featured).length >= 2
      ? posts.filter((post) => post.featured)
      : posts.slice(0, 3)
    : [];
  const featuredIds = new Set(editorialFeatured.map((post) => post.id));
  const remainingPosts = featuredIds.size
    ? filteredPosts.filter((post) => !featuredIds.has(post.id))
    : filteredPosts;
  const totalPages = Math.max(1, Math.ceil(remainingPosts.length / 9));
  const currentPage = Math.min(requestedPage, totalPages);
  const featuredArticles = currentPage === 1 ? editorialFeatured : [];
  const viewHref = (pageNumber) => {
    const parts = [];
    if (category !== 'All') parts.push(`category=${encodeURIComponent(category)}`);
    if (query) parts.push(`q=${encodeURIComponent(query)}`);
    if (pageNumber > 1) parts.push(`page=${pageNumber}`);
    return parts.length ? `/blog?${parts.join('&')}` : '/blog';
  };
  const paginatedPosts = remainingPosts.slice((currentPage - 1) * 9, currentPage * 9);
  const featuredCarousel = featuredArticles.length
    ? `<div class="featured-carousel" role="region" aria-roledescription="carousel" aria-label="Featured IELTS articles" data-featured-carousel>
        <button class="carousel-arrow carousel-prev" type="button" aria-label="Previous featured article">${iconSvg('chevron-left')}</button>
        <button class="carousel-arrow carousel-next" type="button" aria-label="Next featured article">${iconSvg('chevron-right')}</button>
        ${featuredArticles
          .map(
            (
              featured,
              index
            ) => `<article class="featured featured-slide${index === 0 ? ' active' : ''}" data-featured-slide>
              <div class="featured-image">
                <img src="${escapeHtml(featured.thumbnail_url || '/ielts-hero-student.webp')}" alt="${escapeHtml(coverAlt(featured))}" width="1200" height="675" decoding="async"${index === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>
                <span class="featured-badge">${iconSvg('sparkles')} Featured</span>
              </div>
              <div class="featured-copy">
                <div><div class="featured-topline">${categoryChip(featured.category)}<span class="featured-meta">${Number(featured.reading_minutes) || 6} min read</span><span class="featured-meta">${iconSvg('eye')} ${formatReadCount(featured.view_count)}</span></div>
                <h2><a href="/blog/${escapeHtml(featured.slug)}">${escapeHtml(featured.title)}</a></h2>
                <p>${escapeHtml(featured.description)}</p></div>
                <div class="featured-editorial"><span>IELTS Ai Pro editorial team</span><span>${escapeHtml(formatShortDate(featured.published_at || featured.created_at))}</span></div>
              </div>
            </article>`
          )
          .join('')}
        <div class="carousel-status"><span data-carousel-count>1 of ${featuredArticles.length}</span><span class="carousel-dots">${featuredArticles
          .map(
            (_, index) =>
              `<button class="carousel-dot${index === 0 ? ' active' : ''}" type="button" aria-label="Go to slide ${index + 1}"${index === 0 ? ' aria-current="true"' : ''} data-carousel-dot="${index}"></button>`
          )
          .join('')}</span></div>
      </div>`
    : '';
  const cards = paginatedPosts
    .map((post) => {
      const presentation = getBlogCategoryPresentation(post.category);
      return `<article class="card">
        <div class="card-visual"><img src="${escapeHtml(post.thumbnail_url || '/ielts-hero-student.webp')}" alt="${escapeHtml(coverAlt(post))}" width="1200" height="675" loading="lazy" decoding="async"><span class="card-visual-icon">${iconSvg(presentation.icon)}</span></div>
        <div class="card-copy">${categoryChip(post.category, 'sm')}
          <h2><a class="card-title-link" href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.description)}</p>
          <span class="meta"><span class="card-meta-group"><span class="card-meta-item">${iconSvg('clock')} ${Number(post.reading_minutes) || 6} min read</span><span class="card-meta-dot">•</span><span class="card-meta-item">${iconSvg('eye')} ${formatReadCount(post.view_count)}</span></span><span class="card-read-link"><span>Read guide</span>${iconSvg('arrow-right', 'card-read-icon')}</span></span>
        </div>
      </article>`;
    })
    .join('');
  const pageHref = viewHref;
  const pagination =
    totalPages > 1
      ? `<nav class="pagination" aria-label="Article pages">${currentPage > 1 ? `<a href="${pageHref(currentPage - 1)}" aria-label="Previous page">←</a>` : ''}${Array.from(
          { length: totalPages },
          (_, index) => index + 1
        )
          .map((pageNumber) =>
            pageNumber === currentPage
              ? `<span class="active" aria-current="page">${pageNumber}</span>`
              : `<a href="${pageHref(pageNumber)}">${pageNumber}</a>`
          )
          .join(
            ''
          )}${currentPage < totalPages ? `<a href="${pageHref(currentPage + 1)}" aria-label="Next page">→</a>` : ''}</nav>`
      : '';
  const trending = [...posts]
    .sort(
      (first, second) =>
        (Number(second.view_count) || 0) - (Number(first.view_count) || 0) ||
        new Date(second.published_at || second.created_at || 0) -
          new Date(first.published_at || first.created_at || 0)
    )
    .slice(0, 5)
    .map(
      (post, index) =>
        `<a class="trend" href="/blog/${escapeHtml(post.slug)}"><b>${String(index + 1).padStart(2, '0')}</b><span>${escapeHtml(post.title)}<small style="display:block;color:#8a94a8;font-weight:500">${formatReadCount(post.view_count)} · ${Number(post.reading_minutes) || 6} min read</small></span></a>`
    )
    .join('');
  const popularTags = [...new Set(posts.flatMap((post) => post.seo_tags || []))]
    .slice(0, 10)
    .map(
      (tag) => `<a rel="nofollow" href="/blog?q=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`
    )
    .join('');
  const categories = getBlogCategories(posts)
    .map((value) => {
      const presentation =
        value === 'All'
          ? { icon: 'file-text', label: 'All articles' }
          : getBlogCategoryPresentation(value);
      const href = value === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(value)}`;
      return `<a${category === value ? ' class="active" aria-current="page"' : ''} href="${href}">${iconSvg(presentation.icon)}<span>${escapeHtml(presentation.label)}</span></a>`;
    })
    .join('');
  const libraryBody = filteredPosts.length
    ? `<div class="content-grid"><div>${featuredCarousel}<h2 class="section-title latest-title">${escapeHtml(BLOG_LIBRARY_COPY.latestTitle)}</h2><div class="cards" aria-label="IELTS articles">${cards}</div>${pagination}</div><aside class="sidebar"><div class="side-card"><h2><span class="side-card-title-icon">${iconSvg('sparkles')}</span>Trending now</h2>${trending}</div>${popularTags ? `<div class="side-card"><h2><span class="side-card-title-icon">${iconSvg('sparkles')}</span>Popular topics</h2><div class="topic-list">${popularTags}</div></div>` : ''}${practiceCard()}</aside></div>`
    : `<div class="library-empty"><h2>No article matches that search</h2><p><a href="/blog">Show every article</a></p></div>`;
  /*
   * Every filtered view used to send the same title, description and a canonical
   * pointing at /blog, so a Semrush crawl saw 24 URLs sharing one title and one
   * description. Category and pagination views are legitimate listings and now
   * describe themselves; internal search results are noindexed instead, which is
   * what they should always have been.
   */
  const canonical = `${SITE_URL}${viewHref(currentPage)}`;
  const pageSuffix = currentPage > 1 ? ` - Page ${currentPage}` : '';
  const viewTitle = query
    ? `Search: ${query} - IELTS Blog`
    : category !== 'All'
      ? `IELTS ${category} Guides & Strategies`
      : BLOG_LIBRARY_COPY.metaTitle;
  const viewDescription = query
    ? `IELTS Ai Pro articles matching “${query}”. Browse the full library for strategies, study plans, and exam updates.`
    : category !== 'All'
      ? `Practical IELTS ${category} guides from IELTS Ai Pro: strategies, common mistakes, and focused practice you can use in your next session.`
      : BLOG_LIBRARY_COPY.metaDescription;
  const description = currentPage > 1 ? `${viewDescription} Page ${currentPage}.` : viewDescription;
  const listedPosts = [...featuredArticles, ...paginatedPosts];
  return layout({
    title: `${viewTitle}${pageSuffix}`,
    description,
    canonical,
    ...(query ? { robots: 'noindex, follow' } : {}),
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${canonical}#collection`,
        name: `${viewTitle}${pageSuffix}`,
        url: canonical,
        description,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: listedPosts.length,
          itemListElement: listedPosts.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: post.title,
            url: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
          })),
        },
      },
    ],
    body: `<main id="main">
      <section class="index-hero"><div class="shell hero-grid"><div><span class="eyebrow">${iconSvg('book-open')} ${escapeHtml(BLOG_LIBRARY_COPY.heroEyebrow)}</span><h1>${escapeHtml(BLOG_LIBRARY_COPY.heroTitle)}</h1><p class="hand">${escapeHtml(BLOG_LIBRARY_COPY.heroScript)}</p><p class="intro">${escapeHtml(BLOG_LIBRARY_COPY.heroDescription)}</p></div><div class="hero-photo"><span class="note one">Consistency builds excellence</span><img src="/ielts-hero-student.webp" alt="IELTS learner studying with a laptop and notebook"><span class="note two">Plan · Practise · Progress</span><span class="hero-sparkle">${iconSvg('sparkles')}</span></div></div></section>
      <section class="category-rail" aria-label="Article categories"><div class="shell"><nav class="category-tabs">${categories}</nav></div></section>
      <section class="index-content"><div class="shell"><div class="library-heading"><div><p class="library-kicker">${escapeHtml(BLOG_LIBRARY_COPY.sectionEyebrow)}</p><h2>${escapeHtml(getBlogLibraryHeading({ category, query }))}</h2></div><form class="library-search" action="/blog" method="get"><span aria-hidden="true">${iconSvg('search')}</span>${category !== 'All' ? `<input type="hidden" name="category" value="${escapeHtml(category)}">` : ''}<input type="search" name="q" value="${escapeHtml(query)}" placeholder="${escapeHtml(BLOG_LIBRARY_COPY.searchPlaceholder)}" aria-label="Search IELTS articles"></form></div>${libraryBody}</div></section>
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
  const articleText = plainText(prepared.html);
  const citations = externalCitationUrls(prepared.html);
  const keywords = Array.isArray(post.seo_tags) ? post.seo_tags.filter(Boolean) : [];
  const toc = prepared.toc
    .map(
      (item) =>
        `<a href="#${item.id}" data-toc-link${item.level === 3 ? ' style="padding-left:24px;font-weight:500"' : ''}>${escapeHtml(item.text)}</a>`
    )
    .join('');
  const related = allPosts
    .filter((article) => article.id !== post.id)
    .slice(0, 3)
    .map(
      (article) =>
        `<article class="card"><div class="card-visual"><img src="${escapeHtml(article.thumbnail_url || '/ielts-hero-student.webp')}" alt="${escapeHtml(coverAlt(article))}" width="1200" height="675" loading="lazy" decoding="async"></div><div class="card-copy">${categoryChip(article.category, 'sm')}<h2><a class="card-title-link" href="/blog/${escapeHtml(article.slug)}">${escapeHtml(article.title)}</a></h2><span class="meta"><span class="card-meta-group"><span class="card-meta-item">${iconSvg('clock')} ${Number(article.reading_minutes) || 6} min read</span></span><span class="card-read-link"><span>Read guide</span>${iconSvg('arrow-right', 'card-read-icon')}</span></span></div></article>`
    )
    .join('');
  const articleCategory = getBlogCategoryPresentation(post.category);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description,
    datePublished: publishedAt,
    dateModified: post.updated_at || publishedAt,
    author: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'IELTS Ai Pro',
      url: `${SITE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'IELTS Ai Pro',
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    image: { '@type': 'ImageObject', url: socialImageUrl, width: 1200, height: 675 },
    inLanguage: 'en',
    isAccessibleForFree: true,
    articleSection: post.category || 'IELTS guide',
    wordCount: articleText ? articleText.split(/\s+/).length : 0,
    keywords,
    about: [post.category, ...keywords].filter(Boolean).map((name) => ({
      '@type': 'DefinedTerm',
      name,
    })),
    ...(citations.length ? { citation: citations } : {}),
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
      <section class="article-hero"><div class="shell"><div class="article-breadcrumbs"><a href="/blog">Blog library</a><span>/</span><span>${escapeHtml(post.category || 'Guide')}</span><span>/</span><span class="truncate-title">${escapeHtml(post.title)}</span></div><div class="article-hero-grid"><div>${categoryChip(post.category)}<h1>${escapeHtml(post.title)}</h1><p class="intro">${escapeHtml(post.description)}</p><div class="article-meta"><a class="article-meta-item article-author" href="/about"><span class="article-author-icon">${iconSvg('user')}</span>IELTS Ai Pro team</a><span class="article-meta-divider" aria-hidden="true"></span><time class="article-meta-item" datetime="${escapeHtml(publishedAt)}">${iconSvg('calendar')} ${escapeHtml(formatDate(publishedAt))}</time><span class="article-meta-divider" aria-hidden="true"></span><span class="article-meta-item">${iconSvg('clock')} ${Number(post.reading_minutes) || 6} min read</span><span class="article-meta-divider" aria-hidden="true"></span><span class="article-meta-item" title="${Number(post.view_count) || 0} reads">${iconSvg('eye')} ${formatReadCount(post.view_count)}</span></div></div><div class="article-photo"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(coverAlt(post))}" width="1200" height="675" decoding="async" fetchpriority="high"><span class="article-photo-note">Plan · Practise · Review · Succeed</span></div></div></div></section>
      <div class="shell article-layout"><div>${tableOfContents(toc, { mobile: true })}<article class="article-card article">${prepared.html}<div class="tags">${tags}</div><aside class="editorial-card"><div class="editorial-icon">✦</div><div class="editorial-copy"><span class="eyebrow">About this guide</span><h2>Reviewed by the IELTS Ai Pro editorial team</h2><p>Built around practical IELTS preparation and linked to focused activities inside the application.</p></div><a class="button" href="${practicePath(post.category)}">Practise now →</a></aside></article>${related ? `<h2 class="section-title" style="margin-top:26px">Related articles</h2><div class="cards">${related}</div>` : ''}</div><aside class="sidebar">${tableOfContents(toc)}<div class="side-card"><h2>Share this article</h2><a class="button" style="width:100%" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}">Share on LinkedIn</a></div>${practiceCard(practicePath(post.category), practiceLabel(post.category))}<a class="login" style="display:block;text-align:center" href="/blog">← All IELTS articles</a></aside></div>
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
  response.setHeader('Content-Language', 'en');
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  response.setHeader(
    'Link',
    `<${SITE_URL}/blog/feed.xml>; rel="alternate"; type="application/rss+xml"`
  );
  response.setHeader('X-Content-Type-Options', 'nosniff');

  const slug = Array.isArray(request.query.slug) ? request.query.slug[0] : request.query.slug;
  try {
    const posts = await fetchPosts(slug);
    if (slug && posts.length === 0) return sendNotFound(response);
    const allPosts = slug ? await fetchPosts() : posts;
    response
      .status(200)
      .send(slug ? renderArticle(posts[0], allPosts) : renderIndex(posts, request.query));
  } catch (error) {
    console.error('[blog-render]', error);
    sendError(response);
  }
}
