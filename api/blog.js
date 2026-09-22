import sanitizeHtml from 'sanitize-html';
import process from 'node:process';
import { BLOG_CSS_VERSION } from './blog-css.js';
import {
  BLOG_LIBRARY_COPY,
  getBlogCategories,
  getBlogCategoryPresentation,
  getBlogLibraryHeading,
} from '../src/features/learning/utils/blogPresentation.js';
import { getBlogSeoMeta } from '../src/features/learning/utils/blogSeo.js';

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
const RELATED_ARTICLE_FIELDS = [
  'id',
  'title',
  'slug',
  'category',
  'reading_minutes',
  'thumbnail_url',
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
  'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
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
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 6L2 7"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  instagram:
    '<rect width="20" height="20" x="2" y="2" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>',
  youtube:
    '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.7-1.8C18.4 5 12 5 12 5s-6.4 0-7.9.4a2.5 2.5 0 0 0-1.7 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.7 1.8C5.6 19 12 19 12 19s6.4 0 7.9-.4a2.5 2.5 0 0 0 1.7-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8Z"/><path d="m10 15 5-3-5-3v6Z"/>',
  linkedin:
    '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  'share-2':
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

/*
 * Icons are emitted as <use> references into a single sprite instead of repeating
 * their path data. A blog listing draws 86 icons; inlined, that was 24KB - 46% of
 * the document - which both slowed the response and buried the article text under
 * markup. The stroke presentation lives in the stylesheet so each reference stays
 * a few dozen bytes.
 */
function iconSvg(name, className = 'icon') {
  const id = ICON_CONTENT[name] ? name : 'file-text';
  return `<svg class="${escapeHtml(className)}" aria-hidden="true"><use href="#icon-${id}"/></svg>`;
}

function iconSprite() {
  const symbols = Object.entries(ICON_CONTENT)
    .map(([name, content]) => `<symbol id="icon-${name}" viewBox="0 0 24 24">${content}</symbol>`)
    .join('');
  return `<svg class="icon-sprite" aria-hidden="true" focusable="false">${symbols}</svg>`;
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
  '7-places-to-get-free-full-ielts-mock-exams-online':
    'IELTS learner studying 7 places to get free full ielts mock exams online with a laptop and notebook',
  'ai-ielts-feedback-vs-human-tutors-which-to-trust':
    'IELTS learner studying ai ielts feedback vs human tutors: which to trust? with a laptop and notebook',
  'ai-ielts-prep-the-complete-beginner-s-guide-for-2026':
    "IELTS learner studying AI IELTS prep: the complete beginner's guide for 2026 with a laptop and notebook",
  'ai-ielts-preparation-tools-that-raise-your-band-score':
    'IELTS learner using AI feedback tools for focused Writing and Speaking practice',
  'best-free-cambridge-style-ielts-mock-tests-in-2026':
    'IELTS learner preparing for a four-skill mock test with practice papers, headphones, and a timer',
  'best-free-ielts-practice-tests-online-2026-picks':
    'IELTS learner taking a full online IELTS practice test with headphones and a timer',
  'best-online-ielts-prep-platforms-in-australia-2026':
    'IELTS learner studying best online ielts prep platforms in australia with a laptop and notebook',
  'best-online-platforms-for-ielts-speaking-practice-in-2026':
    'IELTS learner studying the best online platforms for IELTS speaking practice in 2026 with a laptop and notebook',
  'how-an-ai-ielts-platform-can-fast-track-your-band-score':
    'IELTS learner studying how an ai ielts platform can fast-track your band score with a laptop and notebook',
  'how-to-monitor-ielts-improvement-and-hit-your-target-band':
    'IELTS learner reviewing weekly IELTS progress charts beside a study calendar',
  'how-to-track-ielts-score-improvement-week-by-week':
    'IELTS learner studying how to track ielts score improvement week by week with a laptop and notebook',
  'ielts-self-study-schedule-a-flexible-8-week-plan':
    'IELTS learner following an 8-week self-study schedule with a calendar, practice books, and a laptop',
  'ielts-writing-band-score-how-your-essay-is-really-marked':
    'IELTS learner reviewing an essay beside four writing band score criteria and a marked sample',
  'ielts-band-score-explained-from-raw-marks-to-overall-band':
    'IELTS learner studying ielts band score explained: from raw marks to overall band with a laptop and notebook',
  'ielts-speaking-topics-questions-cue-cards-tips':
    'IELTS learner rehearsing cue-card answers with question cards, a microphone, and a laptop',
  'ielts-vs-toefl-for-us-admission-which-test-is-easier':
    'IELTS learner studying ielts vs toefl for us admission: which test is easier? with a laptop and notebook',
  'ielts-vs-toefl-for-us-universities-an-australian-guide':
    'IELTS learner studying ielts vs toefl for us universities: an australian guide with a laptop and notebook',
  'ielts-writing-task-2-tips-for-a-reliable-band-7-score':
    'IELTS learner studying ielts writing task 2 tips for a reliable band 7+ score with a laptop and notebook',
  'ielts-writing-task-2-tips-that-actually-raise-your-score':
    'IELTS learner planning a Writing Task 2 essay with Band 7 structure, vocabulary, and score tips',
  'improve-your-ielts-essay-score-the-10-step-guide':
    'IELTS learner studying improve your ielts essay score: the 10-step guide with a laptop and notebook',
  'improve-your-ielts-writing-band-8-week-plan-to-band-7':
    'IELTS learner following an 8-week Writing plan from Band 6 to Band 7 with feedback and score tracking',
  'improve-your-ielts-writing-score-by-one-full-band':
    'IELTS learner studying improve your ielts writing score by one full band with a laptop and notebook',
  'is-ai-feedback-good-enough-for-ielts-writing-practice':
    'IELTS learner comparing AI and human feedback on a Writing practice essay beside band criteria',
  'is-ai-ielts-practice-actually-as-good-as-a-real-tutor':
    'IELTS learner studying is ai ielts practice actually as good as a real tutor? with a laptop and notebook',
  'minimum-ielts-scores-for-us-university-admission-2026-guide':
    'IELTS learner studying minimum ielts scores for us university admission: 2026 guide with a laptop and notebook',
  'track-your-ielts-progress-online-and-improve-faster':
    'IELTS learner studying track your ielts progress online and improve faster with a laptop and notebook',
  'the-best-free-ielts-apps-in-2026-what-actually-works':
    'IELTS learner comparing free IELTS preparation apps for mock tests, feedback, and progress tracking',
  'ielts-academic-vs-general-test':
    'IELTS learner comparing an Academic data report and a General Training letter at a study desk',
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
// The brand suffix needs to leave enough room for the distinctive terms in an
// article title. The former "IELTS Guide" segment was redundant and caused
// separate articles with the same opening words to collapse into one title.
const ARTICLE_TITLE_SUFFIX = ' | IELTS Ai Pro';
const OFFICIAL_WRITING_FORMAT_URL =
  'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing';

/*
 * These citations were published before the editorial link audit. Keeping the
 * repair at render time protects existing production rows immediately; the
 * companion data migration fixes the stored source for future renders too.
 */
function repairKnownContentLinks(content = '') {
  return String(content)
    .replace(
      /<a href="https:\/\/www\.hss\.iitb\.ac\.in\/sites\/default\/files\/2023-10\/Coherence_Linking_Words%20\(RMIT%20University"([^>]*)>([\s\S]*?)<\/a>\.pdf\)/gi,
      `<a href="${OFFICIAL_WRITING_FORMAT_URL}"$1>$2</a>.`
    )
    .replaceAll(
      'https://careerwiseenglish.com.au/ielts-writing-task-2-time-management/',
      OFFICIAL_WRITING_FORMAT_URL
    )
    .replaceAll(
      'https://ielts5to6.com/grammar/ielts-writing-task-2-collocations-list-pdf-friendly/',
      OFFICIAL_WRITING_FORMAT_URL
    )
    .replaceAll(
      'https://ieltsimmigration.ir/wp-content/uploads/2020/03/Band-Descriptors-Task-2.pdf',
      OFFICIAL_WRITING_FORMAT_URL
    );
}

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

function trimTitleToWidth(value, maxWidth) {
  if (estimateTitleWidth(value) <= maxWidth) return value;
  const words = String(value).trim().split(/\s+/);
  let trimmed = '';
  for (const word of words) {
    const candidate = trimmed ? `${trimmed} ${word}` : word;
    if (estimateTitleWidth(`${candidate}…`) > maxWidth) break;
    trimmed = candidate;
  }
  return trimmed ? `${trimmed}…` : String(value).slice(0, 36).trimEnd() + '…';
}

function articleSearchTitle(title) {
  const suffixWidth = estimateTitleWidth(ARTICLE_TITLE_SUFFIX);
  return `${trimTitleToWidth(title, SERP_TITLE_MAX_PIXELS - suffixWidth)}${ARTICLE_TITLE_SUFFIX}`;
}

function layout({
  title,
  description,
  keywords = '',
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
  <script>
    (function () {
      var GTM_ID = 'GTM-TR6XQ2R3';
      var MEASURED_HOSTS = ['ieltsai.pro', 'www.ieltsai.pro'];
      var trackingEnabled = false;
      try {
        trackingEnabled = MEASURED_HOSTS.indexOf(window.location.hostname) !== -1;
      } catch (e) {
        trackingEnabled = false;
      }
      window.__TRACKING_ENABLED__ = trackingEnabled;
      if (!trackingEnabled) return;

      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        function () {
          window.dataLayer.push(arguments);
        };
      window.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

      var head = document.head || document.getElementsByTagName('head')[0];
      var query = '?id=' + encodeURIComponent(GTM_ID);

      // Mirrors index.html: first-party via the /mx rewrite, falling back to
      // Google's host if the proxy is unavailable.
      var script = document.createElement('script');
      script.async = true;
      script.src = '/mx/gtm.js' + query;
      script.onerror = function () {
        var fallback = document.createElement('script');
        fallback.async = true;
        fallback.src = 'https://www.googletagmanager.com/gtm.js' + query;
        head.appendChild(fallback);
      };
      head.appendChild(script);
    })();
  </script>
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${keywords ? `<meta name="keywords" content="${escapeHtml(Array.isArray(keywords) ? keywords.join(', ') : keywords)}">` : ''}
  <meta name="robots" content="${escapeHtml(robots)}">
  <meta http-equiv="content-language" content="en">
  <link rel="canonical" href="${escapeHtml(canonical)}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.png" sizes="192x192" type="image/png"><link rel="shortcut icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="alternate" type="application/rss+xml" title="IELTS Ai Pro Preparation Guides" href="${SITE_URL}/blog/feed.xml">
  <link rel="alternate" type="text/plain" title="IELTS Ai Pro for language models" href="${SITE_URL}/llms.txt">
  <meta property="og:title" content="${escapeHtml(fullTitle)}"><meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="${type}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:site_name" content="IELTS Ai Pro"><meta property="og:locale" content="en_GB"><meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(fullTitle)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}">
  ${structuredData.map((item) => `<script type="application/ld+json">${safeJson(item)}</script>`).join('')}
  <script>try{if(localStorage.getItem('vite-ui-theme')==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.add('light')}catch(_){document.documentElement.classList.add('light')}</script>
  <link rel="stylesheet" href="/blog.css?v=${BLOG_CSS_VERSION}">
</head><body>
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TR6XQ2R3" title="Google Tag Manager" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  ${iconSprite()}
  <a class="skip" href="#main">Skip to content</a>
  <header id="public-header">
    <div class="mobile-backdrop" data-mobile-backdrop></div>
    <div class="nav-wrapper">
      <nav class="site-nav" aria-label="Primary">
        <div class="nav-scroll-progress" aria-hidden="true">
          <div class="nav-scroll-progress-fill" data-scroll-progress-fill></div>
        </div>
        <div class="nav-content">
          <a class="brand" href="/" aria-label="IELTS Ai Pro Home"><img src="/logo.svg" alt="IELTS Ai Pro Logo" class="brand-light" width="300" height="72" fetchpriority="high"><img src="/footer.svg" alt="IELTS Ai Pro Logo" class="brand-dark" width="300" height="72"></a>
          <div class="nav-center">
            <a href="/#features">Platform</a>
            <a href="/ielts-writing-checker">Writing checker</a>
            <a href="/blog">Blog</a>
            <a href="/ielts-band-score-calculator">Calculator</a>
            <a href="/ielts-university-requirements">Universities</a>
            <a href="/#pricing">Pricing</a>
          </div>
          <div class="nav-actions">
            <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme" aria-pressed="false"><span class="theme-moon">${iconSvg('moon')}</span><span class="theme-sun">${iconSvg('sun')}</span></button>
            <a class="button" href="/signup">Start Free ${iconSvg('arrow-right')}</a>
            <button class="mobile-menu-btn" type="button" data-mobile-menu-btn aria-label="Open menu" aria-expanded="false" aria-controls="public-navbar-menu"><span class="icon-menu">${iconSvg('menu')}</span><span class="icon-close">${iconSvg('x')}</span></button>
          </div>
        </div>
      </nav>
    </div>
    <div id="public-navbar-menu" class="mobile-card" data-mobile-card>
      <div class="mobile-card-links">
        <a href="/#features" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('layers')}</div>
          <div class="mobile-link-body">
            <span class="mobile-link-label">Platform</span>
            <p class="mobile-link-desc">Core IELTS AI tools &amp; practice suite</p>
          </div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/ielts-writing-checker" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('pen-line')}</div>
          <div class="mobile-link-body">
            <span class="mobile-link-label">Writing checker</span>
            <p class="mobile-link-desc">Instant Band 9 criteria feedback</p>
          </div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/blog" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('book-open')}</div>
          <div class="mobile-link-body">
            <span class="mobile-link-label">Blog</span>
            <p class="mobile-link-desc">Study guides, strategies &amp; exam tips</p>
          </div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/ielts-band-score-calculator" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('calculator')}</div>
          <div class="mobile-link-body">
            <span class="mobile-link-label">Calculator</span>
            <p class="mobile-link-desc">Calculate target overall band score</p>
          </div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/ielts-university-requirements" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('graduation-cap')}</div>
          <div class="mobile-link-body">
            <span class="mobile-link-label">Universities</span>
            <p class="mobile-link-desc">IELTS scores universities require</p>
          </div>
          <span class="mobile-link-arrow">${iconSvg('chevron-right')}</span>
        </a>
        <a href="/#pricing" class="mobile-card-link">
          <div class="mobile-link-icon">${iconSvg('tag')}</div>
          <div class="mobile-link-body">
            <span class="mobile-link-label">Pricing</span>
            <p class="mobile-link-desc">Flexible access &amp; membership plans</p>
          </div>
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
          <div class="footer-brand-row"><a class="footer-brand" href="/" aria-label="IELTS Ai Pro Home"><img src="/footer.svg" alt="IELTS Ai Pro Logo" width="300" height="72" loading="lazy" decoding="async"></a><span class="ai-badge">✦ AI Powered</span></div>
          <p class="footer-description">Web-based IELTS practice platform for Reading, Listening, Writing, and Speaking with instant criterion-based AI practice feedback, score analytics, and target-band guidance.</p>
          <div class="footer-contact-row"><a class="footer-email" href="mailto:mail@ieltsai.pro"><span aria-hidden="true">${iconSvg('mail')}</span><span>mail@ieltsai.pro</span></a><div class="footer-socials"><a href="https://www.facebook.com/ieltsaipro" aria-label="Follow us on Facebook">${iconSvg('facebook')}</a><a href="https://www.instagram.com/ieltsaipro/" aria-label="Follow us on Instagram">${iconSvg('instagram')}</a><a href="https://x.com/IELTSAiPro" aria-label="Follow us on X (Twitter)">${iconSvg('x')}</a><a href="https://youtube.com" aria-label="Follow us on YouTube">${iconSvg('youtube')}</a><a href="https://linkedin.com" aria-label="Follow us on LinkedIn">${iconSvg('linkedin')}</a></div></div>
        </div>
        <nav class="footer-navigation" aria-label="Footer">
          <details class="footer-group" open><summary><span class="footer-group-icon">▦</span>Core Features</summary><ul><li><a href="/ielts-band-score-calculator">Band Score Calculator</a></li><li><a href="/ielts-writing-checker">Writing Task Evaluator</a></li><li><a href="/ielts-speaking-practice-ai">Speaking Test Simulator</a></li><li><a href="/cambridge-ielts-practice-tests#listening">Listening Practice Hub</a></li><li><a href="/cambridge-ielts-practice-tests#reading">Reading Comprehension</a></li></ul></details>
          <details class="footer-group" open><summary><span class="footer-group-icon">▤</span>Test Prep</summary><ul><li><a href="/blog?category=Writing">Writing Band Score Criteria</a></li><li><a href="/blog?category=Speaking">Speaking Criteria Breakdown</a></li><li><a href="/blog?category=Reading">Reading Strategies</a></li><li><a href="/blog?category=Listening">Listening Strategies</a></li></ul></details>
          <details class="footer-group" open><summary><span class="footer-group-icon">✦</span>Resources</summary><ul><li><a href="/blog">IELTS Prep Blog &amp; Guides</a></li><li><a href="/cambridge-ielts-practice-tests">Cambridge Practice Material</a></li><li><a href="/blog?category=Mock%20Tests">Mock Test Guides</a></li><li><a href="/blog?category=Study%20Planning">Study Plans</a></li></ul></details>
          <details class="footer-group" open><summary><span class="footer-group-icon">▣</span>Company</summary><ul><li><a href="/about">About Platform</a></li><li><a href="/contact">Contact Support</a></li><li><a href="/privacy" data-policy-key="privacy">Privacy Policy</a></li><li><a href="/terms" data-policy-key="terms">Terms of Service</a></li><li><a href="/refund" data-policy-key="refund">Refund &amp; Cancellation</a></li></ul></details>
        </nav>
      </div>
      <div class="footer-bottom"><div class="footer-legal"><span>© ${new Date().getFullYear()} IELTS Ai Pro</span><span>•</span><a href="/privacy" data-policy-key="privacy">Privacy Policy</a><span>•</span><a href="/terms" data-policy-key="terms">Terms of Service</a><span>•</span><a href="/refund" data-policy-key="refund">Refund &amp; Cancellation</a><span>•</span><a href="/about">About Platform</a></div><div class="footer-trust"><span class="independence-badge">✓ Independent prep platform. Not affiliated with IELTS, IDP, or British Council.</span><button class="back-to-top" type="button" aria-label="Scroll back to top" title="Back to top">${iconSvg('arrow-up')}</button></div></div>
    </div>
  </footer>
  <script>
    (() => {
      const documents = {
        privacy: { global: ['/privacy', 'Privacy Policy'], local: ['/bd/privacy', 'Privacy Notice'] },
        terms: { global: ['/terms', 'Terms of Service'], local: ['/bd/terms', 'Terms & Conditions'] },
        refund: { global: ['/refund', 'Refund & Cancellation'], local: ['/bd/refund-cancellation', 'Refund & Cancellation'] },
      };
      const applyCountry = (country) => {
        const inBangladesh = String(country || '').toUpperCase() === 'BD';
        document.querySelectorAll('[data-policy-key]').forEach((link) => {
          const document = documents[link.dataset.policyKey];
          const destination = inBangladesh ? document?.local : document?.global;
          if (!destination) return;
          link.setAttribute('href', destination[0]);
          link.textContent = destination[1];
        });
      };
      let country = new URLSearchParams(window.location.search).get('country');
      try {
        if (country) {
          localStorage.setItem('user_country', country.toUpperCase());
        } else {
          country = localStorage.getItem('user_country') || '';
          if (!country && ['Asia/Dhaka', 'Asia/Chittagong'].includes(Intl.DateTimeFormat().resolvedOptions().timeZone)) {
            country = 'BD';
            localStorage.setItem('user_country', country);
          }
        }
      } catch (_) {}
      if (country) {
        applyCountry(country);
      } else {
        fetch('https://ipapi.co/json/')
          .then((response) => response.ok ? response.json() : null)
          .then((data) => {
            if (!data?.country_code) return;
            try { localStorage.setItem('user_country', data.country_code.toUpperCase()); } catch (_) {}
            applyCountry(data.country_code);
          })
          .catch(() => {});
      }
    })();
  </script>
  <script>
    (()=>{const root=document.documentElement;const h=document.getElementById('public-header');const mobBtn=document.querySelector('[data-mobile-menu-btn]');const mobCard=document.querySelector('[data-mobile-card]');const mobBackdrop=document.querySelector('[data-mobile-backdrop]');const toggleMobileMenu=(open)=>{const isCurrentlyOpen=mobCard?.classList.contains('is-open');const shouldOpen=open!==undefined?open:!isCurrentlyOpen;mobBtn?.setAttribute('aria-expanded',String(shouldOpen));mobBtn?.setAttribute('aria-label',shouldOpen?'Close menu':'Open menu');mobCard?.classList.toggle('is-open',shouldOpen);mobBackdrop?.classList.toggle('is-open',shouldOpen);document.body.style.overflow=shouldOpen?'hidden':''};mobBtn?.addEventListener('click',()=>toggleMobileMenu());mobBackdrop?.addEventListener('click',()=>toggleMobileMenu(false));mobCard?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggleMobileMenu(false)));const groups=[...document.querySelectorAll('.footer-group')];const sync=()=>{h?.classList.toggle('is-scrolled',scrollY>20);const fill=document.querySelector('[data-scroll-progress-fill]');if(fill){const winScroll=document.body.scrollTop||document.documentElement.scrollTop;const height=document.documentElement.scrollHeight-document.documentElement.clientHeight;fill.style.width=(height>0?(winScroll/height)*100:0)+'%';}};const syncFooter=()=>groups.forEach((group,index)=>{group.open=innerWidth>=640||index===0});const theme=document.querySelector('[data-theme-toggle]');const syncTheme=()=>{const dark=root.classList.contains('dark');theme?.setAttribute('aria-pressed',String(dark));theme?.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme')};theme?.addEventListener('click',()=>{const dark=!root.classList.contains('dark');root.classList.toggle('dark',dark);root.classList.toggle('light',!dark);try{localStorage.setItem('vite-ui-theme',dark?'dark':'light')}catch(_){}syncTheme()});addEventListener('scroll',sync,{passive:true});addEventListener('resize',syncFooter,{passive:true});sync();syncFooter();syncTheme();document.querySelector('.back-to-top')?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));document.querySelectorAll('[data-toc-card]').forEach(card=>{const toggle=card.querySelector('.toc-toggle');const links=[...card.querySelectorAll('[data-toc-link]')];const setOpen=open=>{card.dataset.tocOpen=String(open);toggle?.setAttribute('aria-expanded',String(open));toggle?.setAttribute('aria-label',open?'Collapse table of contents':'Expand table of contents')};setOpen(true);toggle?.addEventListener('click',()=>setOpen(card.dataset.tocOpen==='false'));links.forEach(link=>link.addEventListener('click',()=>{setOpen(true);links.forEach(item=>item.classList.toggle('is-active',item===link))}));const headings=links.map(link=>document.getElementById(link.getAttribute('href')?.slice(1))).filter(Boolean);if(headings.length&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(link=>link.classList.toggle('is-active',link.getAttribute('href')==='#'+entry.target.id))}}),{rootMargin:'-80px 0px -75% 0px'});headings.forEach(heading=>observer.observe(heading))}});document.querySelectorAll('[data-featured-carousel]').forEach(carousel=>{const slides=[...carousel.querySelectorAll('[data-featured-slide]')];const dots=[...carousel.querySelectorAll('[data-carousel-dot]')];const count=carousel.querySelector('[data-carousel-count]');let active=0,timer,touchStart;const show=(index,direction=1)=>{active=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{const current=i===active;slide.classList.toggle('active',current);if(current){slide.style.setProperty('--slide-enter',(direction<0?'-':'')+'32px');slide.classList.remove('is-entering');void slide.offsetWidth;slide.classList.add('is-entering')}});dots.forEach((dot,i)=>{dot.classList.toggle('active',i===active);i===active?dot.setAttribute('aria-current','true'):dot.removeAttribute('aria-current')});if(count)count.textContent=(active+1)+' of '+slides.length};const stop=()=>clearInterval(timer);const start=()=>{stop();if(slides.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(active+1,1),6000)};const move=direction=>{show(active+direction,direction);start()};carousel.querySelector('.carousel-prev')?.addEventListener('click',()=>move(-1));carousel.querySelector('.carousel-next')?.addEventListener('click',()=>move(1));dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i,i>=active?1:-1);start()}));carousel.addEventListener('mouseenter',stop);carousel.addEventListener('mouseleave',start);carousel.addEventListener('focusin',stop);carousel.addEventListener('focusout',event=>{if(!carousel.contains(event.relatedTarget))start()});carousel.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();move(-1)}if(event.key==='ArrowRight'){event.preventDefault();move(1)}});carousel.addEventListener('touchstart',event=>{touchStart=event.touches[0]?.clientX},{passive:true});carousel.addEventListener('touchend',event=>{const end=event.changedTouches[0]?.clientX;if(typeof touchStart==='number'&&typeof end==='number'&&Math.abs(touchStart-end)>48)move(touchStart>end?1:-1);touchStart=undefined},{passive:true});show(0,0);start()})})();
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
  if (requestedPage > totalPages) return null;
  const currentPage = requestedPage;
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
      ? `<nav class="pagination" aria-label="Article pages">${currentPage > 1 ? `<a href="${pageHref(currentPage - 1)}" aria-label="Previous page">${iconSvg('chevron-left')}</a>` : ''}${Array.from(
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
          )}${currentPage < totalPages ? `<a href="${pageHref(currentPage + 1)}" aria-label="Next page">${iconSvg('chevron-right')}</a>` : ''}</nav>`
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
    .map((tag) => `<a href="/blog?q=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`)
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
  const description =
    currentPage > 1
      ? `Explore page ${currentPage} of the IELTS Ai Pro${category !== 'All' ? ` ${category}` : ''} guide library for practical strategies, guided study plans, current exam updates, and focused practice across all four skills.`
      : viewDescription;
  const listedPosts = [...featuredArticles, ...paginatedPosts];
  return layout({
    title: `${viewTitle}${pageSuffix}`,
    description,
    keywords: BLOG_LIBRARY_COPY.metaKeywords,
    canonical,
    // Search results and thin pagination are useful navigation for people but
    // should not become standalone landing pages in the search index.
    ...(query || currentPage > 1 ? { robots: 'noindex, follow' } : {}),
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
      <section class="index-hero"><div class="shell hero-grid"><div><span class="eyebrow">${iconSvg('book-open')} ${escapeHtml(BLOG_LIBRARY_COPY.heroEyebrow)}</span><h1>${escapeHtml(BLOG_LIBRARY_COPY.heroTitle)}</h1><p class="hand">${escapeHtml(BLOG_LIBRARY_COPY.heroScript)}</p><p class="intro">${escapeHtml(BLOG_LIBRARY_COPY.heroDescription)}</p></div><div class="hero-photo"><span class="note one">Consistency builds excellence</span><img src="/ielts-hero-student.webp" alt="IELTS learner studying with a laptop and notebook" width="1200" height="900" loading="eager" decoding="async" fetchpriority="high"><span class="note two">Plan · Practise · Progress</span><span class="hero-sparkle">${iconSvg('sparkles')}</span></div></div></section>
      <section class="category-rail" aria-label="Article categories"><div class="shell"><nav class="category-tabs">${categories}</nav></div></section>
      <section class="index-content"><div class="shell"><div class="library-heading"><div><p class="library-kicker">${escapeHtml(BLOG_LIBRARY_COPY.sectionEyebrow)}</p><h2>${escapeHtml(getBlogLibraryHeading({ category, query }))}</h2></div><form class="library-search" action="/blog" method="get"><span aria-hidden="true">${iconSvg('search')}</span>${category !== 'All' ? `<input type="hidden" name="category" value="${escapeHtml(category)}">` : ''}<input type="search" name="q" value="${escapeHtml(query)}" placeholder="${escapeHtml(BLOG_LIBRARY_COPY.searchPlaceholder)}" aria-label="Search IELTS articles"></form></div>${libraryBody}</div></section>
    </main>`,
  });
}

function renderArticle(post, allPosts = []) {
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const seoMeta = getBlogSeoMeta(post);
  const description = seoMeta.description;
  const publishedAt = post.published_at || post.created_at;
  const prepared = prepareArticle(repairKnownContentLinks(post.content));
  const tags = (post.seo_tags || [])
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('');
  const imageUrl = post.thumbnail_url || '/ielts-hero-student.webp';
  const socialImageUrl = absoluteImageUrl(post.thumbnail_url);
  const articleText = plainText(prepared.html);
  const citations = externalCitationUrls(prepared.html);
  const keywords = seoMeta.keywords;
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
      // This must be a crawlable raster image. logo.png was never deployed and
      // made otherwise-valid Article schema reference a 404 asset.
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/apple-touch-icon.png`,
        width: 180,
        height: 180,
      },
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
    // A page title must add useful context rather than repeat the visible H1.
    // The width guard preserves the most important leading query terms.
    title: articleSearchTitle(seoMeta.title),
    description,
    keywords,
    canonical,
    type: 'article',
    structuredData: [articleSchema, breadcrumbSchema],
    image: socialImageUrl,
    body: `<main id="main">
      <section class="article-hero"><div class="shell"><div class="article-breadcrumbs"><a href="/blog">Blog library</a><span>/</span><span>${escapeHtml(post.category || 'Guide')}</span><span>/</span><span class="truncate-title">${escapeHtml(post.title)}</span></div><div class="article-hero-grid"><div>${categoryChip(post.category)}<h1>${escapeHtml(post.title)}</h1><p class="intro">${escapeHtml(post.description)}</p><div class="article-meta"><a class="article-meta-item article-author" href="/about"><span class="article-author-icon">${iconSvg('user')}</span>IELTS Ai Pro team</a><span class="article-meta-divider" aria-hidden="true"></span><time class="article-meta-item" datetime="${escapeHtml(publishedAt)}">${iconSvg('calendar')} ${escapeHtml(formatDate(publishedAt))}</time><span class="article-meta-divider" aria-hidden="true"></span><span class="article-meta-item">${iconSvg('clock')} ${Number(post.reading_minutes) || 6} min read</span><span class="article-meta-divider" aria-hidden="true"></span><span class="article-meta-item" title="${Number(post.view_count) || 0} reads">${iconSvg('eye')} ${formatReadCount(post.view_count)}</span></div></div><div class="article-photo"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(coverAlt(post))}" width="1200" height="675" decoding="async" fetchpriority="high"><span class="article-photo-note">Plan · Practise · Review · Succeed</span></div></div></div></section>
      <div class="shell article-layout"><div>${tableOfContents(toc, { mobile: true })}<article class="article-card article">${prepared.html}<div class="tags">${tags}</div><aside class="editorial-card"><div class="editorial-icon">✦</div><div class="editorial-copy"><span class="eyebrow">About this guide</span><h2>Reviewed by the IELTS Ai Pro editorial team</h2><p>Built around practical IELTS preparation and linked to focused activities inside the application.</p></div><a class="button" href="${practicePath(post.category)}">Practise now →</a></aside></article>${related ? `<h2 class="section-title" style="margin-top:26px">Related articles</h2><div class="cards">${related}</div>` : ''}</div><aside class="sidebar">${tableOfContents(toc)}<div class="side-card"><div style="display:flex;align-items:center;gap:8px"><span style="color:#5a63df">${iconSvg('share-2')}</span><h2 style="margin:0;font-size:13px;font-weight:800">Share this article</h2></div><div style="margin-top:12px;display:flex;gap:8px"><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" class="share-btn share-btn-fb">${iconSvg('facebook')}</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" class="share-btn share-btn-in">${iconSvg('linkedin')}</a><button type="button" data-share-btn data-url="${encodeURIComponent(canonical)}" aria-label="Share using device" class="share-btn share-btn-native">${iconSvg('share-2')}</button><button type="button" data-copy-btn data-url="${encodeURIComponent(canonical)}" aria-label="Copy article link" class="share-btn share-btn-copy">${iconSvg('copy')}</button></div></div>${practiceCard(practicePath(post.category), practiceLabel(post.category))}<a class="login" style="display:block;text-align:center" href="/blog">← All IELTS articles</a></aside></div>
    </main>`,
  });
}

function getSupabaseCredentials() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase blog configuration is unavailable');
  return { supabaseUrl, anonKey };
}

async function fetchPosts({ slug, select = ARTICLE_FIELDS, limit } = {}) {
  const { supabaseUrl, anonKey } = getSupabaseCredentials();

  const params = new URLSearchParams({
    select,
    content_type: 'eq.blog',
    is_published: 'eq.true',
    order: 'published_at.desc.nullslast,created_at.desc',
  });
  // PostgREST filter syntax is data, not a query language for route input.
  // Reject malformed slugs before composing an `eq.` filter so bad URLs become
  // normal not-found pages instead of an upstream 400/503.
  if (slug && !/^[a-z0-9-]+$/i.test(slug)) return [];
  if (slug) params.set('slug', `eq.${slug}`);
  if (limit) params.set('limit', String(limit));

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

function sendIndexPageNotFound(response) {
  response.status(404).send(
    layout({
      title: 'Blog page not found',
      description: 'That page of IELTS preparation guides is not available.',
      canonical: `${SITE_URL}/blog`,
      robots: 'noindex, follow',
      structuredData: [],
      body: '<main id="main"><span class="eyebrow">404</span><h1>That page is not in this guide collection.</h1><p class="intro"><a href="/blog">Browse the latest IELTS preparation guides.</a></p></main>',
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

/*
 * Everything that can throw - header setup, query parsing, the fetch, and the
 * render itself - now lives inside the try block. Previously the query.slug
 * read sat above it: a malformed request without a populated `query` object
 * (a bare function invocation, an unusual rewrite) threw before the try/catch
 * ever ran, which crashed the function outright and surfaced Vercel's raw
 * "500: INTERNAL_SERVER_ERROR" instead of the branded fallback page below.
 * The inner try/catch around sendError is a second safety net: if rendering
 * the fallback page itself throws, we still answer with something instead of
 * crashing the function a second time.
 */
export default async function handler(request, response) {
  try {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Content-Language', 'en');
    // Keep browser caches revalidated while allowing the CDN to serve this
    // database-backed HTML for five minutes and refresh it in the background.
    response.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
    );
    response.setHeader(
      'Link',
      `<${SITE_URL}/blog/feed.xml>; rel="alternate"; type="application/rss+xml"`
    );
    response.setHeader('X-Content-Type-Options', 'nosniff');

    const query = request.query || {};
    const slug = Array.isArray(query.slug) ? query.slug[0] : query.slug;
    const [posts, allPosts] = await Promise.all([
      fetchPosts({ slug, limit: slug ? 1 : undefined }),
      slug ? fetchPosts({ select: RELATED_ARTICLE_FIELDS, limit: 4 }) : Promise.resolve(null),
    ]);
    if (slug && posts.length === 0) return sendNotFound(response);
    const relatedPosts = slug ? allPosts : posts;
    if (slug) return response.status(200).send(renderArticle(posts[0], relatedPosts));
    const index = renderIndex(posts, query);
    if (index === null) return sendIndexPageNotFound(response);
    response.status(200).send(index);
  } catch (error) {
    console.error('[blog-render]', error);
    try {
      sendError(response);
    } catch (renderError) {
      console.error('[blog-render-fallback]', renderError);
      if (!response.headersSent) {
        response
          .status(503)
          .send('The IELTS blog is temporarily unavailable. Please try again shortly.');
      }
    }
  }
}
