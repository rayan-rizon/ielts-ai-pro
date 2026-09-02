export const BLOG_CATEGORY_PRESENTATION = {
  Writing: {
    label: 'Writing',
    icon: 'pen-line',
    tone: 'writing',
    chip: 'bg-rose-50/90 text-rose-700 border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    visual: 'from-rose-50 via-orange-50 to-amber-100 text-rose-600',
  },
  Speaking: {
    label: 'Speaking',
    icon: 'mic-2',
    tone: 'speaking',
    chip: 'bg-amber-50/90 text-amber-800 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    visual: 'from-amber-50 via-yellow-50 to-orange-100 text-amber-600',
  },
  Reading: {
    label: 'Reading',
    icon: 'book-open',
    tone: 'reading',
    chip: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    visual: 'from-emerald-50 via-teal-50 to-cyan-100 text-emerald-600',
  },
  Listening: {
    label: 'Listening',
    icon: 'headphones',
    tone: 'listening',
    chip: 'bg-sky-50/90 text-sky-800 border-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
    visual: 'from-sky-50 via-blue-50 to-indigo-100 text-sky-600',
  },
  'Study Planning': {
    label: 'Study Planning',
    icon: 'graduation-cap',
    tone: 'planning',
    chip: 'bg-violet-50/90 text-violet-800 border-violet-200/80 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
    visual: 'from-violet-50 via-indigo-50 to-purple-100 text-violet-600',
  },
  'Exam Updates': {
    label: 'Exam Updates',
    icon: 'sparkles',
    tone: 'updates',
    chip: 'bg-indigo-50/90 text-indigo-800 border-indigo-200/80 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    visual: 'from-indigo-50 via-blue-50 to-purple-100 text-indigo-600',
  },
  'Mock Tests': {
    label: 'Mock Tests',
    icon: 'graduation-cap',
    tone: 'mock',
    chip: 'bg-fuchsia-50/90 text-fuchsia-800 border-fuchsia-200/80 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-fuchsia-500/30',
    visual: 'from-fuchsia-50 via-violet-50 to-indigo-100 text-fuchsia-600',
  },
};

export const DEFAULT_BLOG_CATEGORIES = [
  'All',
  'Writing',
  'Speaking',
  'Reading',
  'Listening',
  'Study Planning',
  'Exam Updates',
  'Mock Tests',
];

export const BLOG_LIBRARY_COPY = {
  metaTitle: 'IELTS Preparation Tips & Expert Guides',
  metaDescription:
    'Practical IELTS Writing, Speaking, Reading, and Listening guides with proven strategies, focused study plans, exam updates, and online practice.',
  heroEyebrow: 'IELTS blog library',
  heroTitle: 'IELTS tips for higher band scores',
  heroScript: 'Clear strategy. Focused practice.',
  heroDescription:
    'Build every IELTS skill with practical lessons, focused study plans, exam updates, and clear next steps you can use in your next practice session.',
  sectionEyebrow: 'Latest IELTS guidance',
  sectionTitle: 'Practical strategies you can use today',
  latestTitle: 'Latest IELTS guides',
  searchPlaceholder: 'Search IELTS skills, questions, or goals',
};

export function getBlogCategoryPresentation(category) {
  return BLOG_CATEGORY_PRESENTATION[category] || BLOG_CATEGORY_PRESENTATION['Study Planning'];
}

export function getBlogCategories(articles = []) {
  const articleCategories = articles.map((article) => article.category).filter(Boolean);
  return [...new Set([...DEFAULT_BLOG_CATEGORIES, ...articleCategories])];
}

export function getBlogLibraryHeading({ category = 'All', query = '' } = {}) {
  const normalizedQuery = query.trim();
  if (normalizedQuery) return `Results for “${normalizedQuery}”`;
  if (category !== 'All') return `${category} guides and strategies`;
  return BLOG_LIBRARY_COPY.sectionTitle;
}
