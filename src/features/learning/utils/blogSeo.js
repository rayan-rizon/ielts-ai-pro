/**
 * Search-aligned metadata for articles whose existing titles and content already
 * cover a clear query cluster. This is an additive presentation layer: it does
 * not change article slugs, database rows, or the visible H1.
 */
const BLOG_SEO_OVERRIDES = {
  'ielts-speaking-topics-questions-cue-cards-tips': {
    title: 'IELTS Speaking Questions & Topics',
    description:
      'Find common IELTS Speaking topics, Part 1 questions, Part 2 cue cards, Part 3 prompts, and practical answer tips for focused practice.',
    keywords: [
      'IELTS speaking questions',
      'IELTS speaking topics',
      'IELTS speaking topics and answers',
      'IELTS speaking test topics',
      'IELTS speaking practice questions',
      'IELTS speaking cue cards',
      'common IELTS speaking topics',
      'IELTS speaking practice',
    ],
  },
  'ielts-writing-task-2-examples': {
    title: 'IELTS Writing Task 2 Examples: How to Use Them',
    description:
      'Learn when to use IELTS Writing Task 2 examples, how to develop ideas, and how to support a Band 7 essay without memorised statistics.',
    keywords: [
      'IELTS Writing Task 2 examples',
      'how to write examples in IELTS essay',
      'IELTS Task 2 develop ideas',
      'IELTS Writing Task 2 support',
      'IELTS essay examples',
      'IELTS Writing Task 2',
    ],
  },
  'best-free-ielts-practice-tests-online-2026-picks': {
    title: 'Best Free IELTS Practice Tests Online (2026)',
    description:
      'Compare free IELTS practice tests and mock exams by format, timing, scoring, and feedback so you can choose practice that improves your next band score.',
    keywords: [
      'best free IELTS practice tests online',
      'IELTS practice test online',
      'free IELTS mock test',
      'IELTS mock tests',
      'IELTS practice tests',
      'IELTS preparation',
    ],
  },
  'ielts-writing-task-2-two-part-question': {
    title: 'IELTS Writing Task 2 Two-Part Questions',
    keywords: [
      'IELTS Writing Task 2 two-part questions',
      'IELTS Task 2 answer both questions',
      'IELTS Writing Task 2 questions',
    ],
  },
  'ielts-listening-multiple-choice-part-3': {
    title: 'IELTS Listening Multiple Choice: Part 3',
    keywords: [
      'IELTS Listening multiple choice',
      'IELTS Listening Part 3',
      'IELTS Listening multiple choice strategy',
    ],
  },
  'ielts-writing-task-1-overview-key-features': {
    title: 'IELTS Writing Task 1 Overview: Key Features',
    keywords: [
      'IELTS Writing Task 1 overview',
      'IELTS Task 1 key features',
      'IELTS Writing Task 1 overview examples',
    ],
  },
  'ielts-reading-matching-headings-main-idea': {
    title: 'IELTS Reading Matching Headings: Main Idea',
    keywords: [
      'IELTS Reading matching headings',
      'IELTS matching headings main idea',
      'IELTS Reading headings strategy',
    ],
  },
  'ielts-overall-band-score-rounding-calculator': {
    title: 'IELTS Overall Band Score Rounding',
    keywords: [
      'IELTS overall band score calculator',
      'IELTS band score rounding',
      'how IELTS overall score is calculated',
    ],
  },
};

function uniqueKeywords(values) {
  const seen = new Set();
  return values.filter((value) => {
    const keyword = String(value || '').trim();
    const normalized = keyword.toLowerCase();
    if (!keyword || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function getBlogSeoMeta(post = {}) {
  const override = BLOG_SEO_OVERRIDES[post.slug];
  const storedKeywords = Array.isArray(post.seo_tags) ? post.seo_tags : [];

  return {
    title: override?.title || post.title || 'IELTS Preparation Guide',
    description: override?.description || post.meta_description || post.description || '',
    keywords: uniqueKeywords([...(override?.keywords || []), ...storedKeywords]),
  };
}

export { BLOG_SEO_OVERRIDES };
