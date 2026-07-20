import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  Headphones,
  Mic2,
  PenLine,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DocumentHead from '@/components/shared/DocumentHead';
import Footer from '@/features/core/components/landing/Footer';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import { useResources } from '@/features/learning/hooks/useResources';
import { cn } from '@/lib/cn';

const EMPTY_ARTICLES = [];
const ARTICLES_PER_PAGE = 9;

const CATEGORY_CONFIG = {
  Writing: {
    icon: PenLine,
    label: 'Writing',
    chip: 'bg-rose-50 text-rose-700 border-rose-100',
    visual: 'from-rose-50 via-orange-50 to-amber-100 text-rose-600',
  },
  Speaking: {
    icon: Mic2,
    label: 'Speaking',
    chip: 'bg-amber-50 text-amber-700 border-amber-100',
    visual: 'from-amber-50 via-yellow-50 to-orange-100 text-amber-600',
  },
  Reading: {
    icon: BookOpen,
    label: 'Reading',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    visual: 'from-emerald-50 via-teal-50 to-cyan-100 text-emerald-600',
  },
  Listening: {
    icon: Headphones,
    label: 'Listening',
    chip: 'bg-sky-50 text-sky-700 border-sky-100',
    visual: 'from-sky-50 via-blue-50 to-indigo-100 text-sky-600',
  },
  'Study Planning': {
    icon: GraduationCap,
    label: 'Study Planning',
    chip: 'bg-violet-50 text-violet-700 border-violet-100',
    visual: 'from-violet-50 via-indigo-50 to-purple-100 text-violet-600',
  },
  'Exam Updates': {
    icon: Sparkles,
    label: 'Exam Updates',
    chip: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    visual: 'from-indigo-50 via-blue-50 to-purple-100 text-indigo-600',
  },
};

function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Study Planning'];
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function CategoryChip({ category }) {
  const config = getCategoryConfig(category);
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold',
        config.chip
      )}
    >
      <Icon className="h-3 w-3" /> {category || 'IELTS Guide'}
    </span>
  );
}

function ArticleMeta({ article, compact = false }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-500">
      {!compact && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(article.published_at || article.created_at)}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="h-3.5 w-3.5" /> {article.reading_minutes || 6} min read
      </span>
    </div>
  );
}

function ArticleVisual({ article }) {
  const config = getCategoryConfig(article.category);
  const Icon = config.icon;

  if (article.thumbnail_url) {
    return (
      <div className="relative h-40 overflow-hidden bg-indigo-50">
        <img
          src={article.thumbnail_url}
          alt={`${article.title} - IELTS preparation guide`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/90 text-indigo-700 shadow-lg backdrop-blur">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative h-40 overflow-hidden bg-gradient-to-br transition-transform duration-500 group-hover:scale-[1.02]',
        config.visual
      )}
    >
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_2px_2px,currentColor_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/55 blur-2xl" />
      <div className="absolute bottom-4 left-5 flex h-14 w-14 rotate-[-4deg] items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-lg shadow-slate-400/10 backdrop-blur">
        <Icon className="h-7 w-7" />
      </div>
      <div className="absolute bottom-5 right-5 rounded-lg bg-white/75 px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-slate-600 shadow-sm backdrop-blur">
        IELTS field note
      </div>
    </div>
  );
}

function ArticleCard({ article, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_35px_-28px_rgba(15,23,42,.35)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_20px_45px_-28px_rgba(79,70,229,.3)] dark:border-white/10 dark:bg-slate-900"
    >
      <Link to={`/blog/${article.slug}`} aria-label={`Read ${article.title}`}>
        <ArticleVisual article={article} />
      </Link>
      <div className="flex min-h-[230px] flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <CategoryChip category={article.category} />
          <ArticleMeta article={article} compact />
        </div>
        <h2 className="mt-4 text-lg font-bold leading-snug tracking-[-0.02em] text-slate-950 dark:text-white">
          <Link
            to={`/blog/${article.slug}`}
            className="transition-colors group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
          >
            {article.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {article.description}
        </p>
        <Link
          to={`/blog/${article.slug}`}
          className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold text-indigo-700 dark:text-indigo-300"
        >
          Read guide <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
    .reduce((items, page, index, allPages) => {
      if (index > 0 && page - allPages[index - 1] > 1) items.push('ellipsis-' + page);
      items.push(page);
      return items;
    }, []);
}

function ArticlePagination({ currentPage, totalPages, totalArticles, onPageChange }) {
  if (totalPages <= 1) return null;

  const firstArticle = (currentPage - 1) * ARTICLES_PER_PAGE + 1;
  const lastArticle = Math.min(currentPage * ARTICLES_PER_PAGE, totalArticles);

  return (
    <nav
      className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/75 px-4 py-4 shadow-[0_12px_35px_-28px_rgba(15,23,42,.25)] backdrop-blur sm:flex-row sm:px-5 dark:border-white/10 dark:bg-slate-900/70"
      aria-label="Blog article pagination"
    >
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Showing {firstArticle}–{lastArticle} of {totalArticles} guides
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <div className="flex items-center gap-1" aria-label="Page numbers">
          {getPaginationItems(currentPage, totalPages).map((item) =>
            typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  'flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-extrabold transition',
                  item === currentPage
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200'
                )}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="px-1 text-sm font-bold text-slate-400" aria-hidden="true">
                …
              </span>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
}

function BlogHeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-indigo-100 bg-white dark:border-white/10 dark:bg-[#0b0f18]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,.09),transparent_27%),radial-gradient(circle_at_88%_12%,rgba(45,212,191,.09),transparent_24%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[.95fr_1.05fr] lg:py-16">
        <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            <BookOpen className="h-3.5 w-3.5" /> IELTS blog library
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-[3.45rem] dark:text-white">
            Insights and strategies for IELTS success
          </h1>
          <p className="font-handwritten mt-3 text-3xl leading-tight text-indigo-600 sm:text-4xl dark:text-indigo-300">
            Learn smarter. Score higher.
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Expert guidance, focused study plans, and practical drills to help you prepare with
            confidence and improve the skills behind your target band.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mx-auto w-full max-w-2xl"
        >
          <div className="absolute -left-3 top-10 z-10 hidden rotate-[-6deg] rounded-md bg-violet-100 px-4 py-3 text-xs font-semibold text-violet-800 shadow-lg sm:block">
            Consistency builds excellence
          </div>
          <div className="absolute -right-2 bottom-10 z-10 hidden rotate-[5deg] rounded-md bg-emerald-100 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-lg sm:block">
            Plan · Practise · Progress
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-indigo-50 p-2 shadow-[0_25px_70px_-38px_rgba(79,70,229,.45)] dark:border-white/10 dark:bg-white/[.04]">
            <img
              src="/ielts-hero-student.webp"
              alt="IELTS learner studying with a laptop and notebook"
              className="aspect-[16/10] w-full rounded-[1.55rem] object-cover"
            />
          </div>
          <Sparkles className="absolute -top-3 right-8 h-8 w-8 rotate-12 text-indigo-400" />
        </motion.div>
      </div>
    </section>
  );
}

function BlogCategoryBar({ categories, category, setCategory, setCurrentPage }) {
  return (
    <section className="sticky top-16 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f18]/95">
      <div
        className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-6"
        aria-label="Article categories"
      >
        {categories.map((item) => {
          const config = item === 'All' ? null : getCategoryConfig(item);
          const Icon = config?.icon || FileText;
          return (
            <button
              key={item}
              onClick={() => {
                setCategory(item);
                setCurrentPage(1);
              }}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all',
                category === item
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-200'
                  : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/[.04]'
              )}
            >
              <Icon className="h-4 w-4" /> {item === 'All' ? 'All articles' : item}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BlogFeaturedCard({ featured }) {
  return (
    <article className="group mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_-35px_rgba(15,23,42,.3)] dark:border-white/10 dark:bg-slate-900">
      <div className="grid gap-3 md:grid-cols-[.92fr_1.08fr]">
        <Link to={`/blog/${featured.slug}`} className="relative overflow-hidden rounded-xl">
          <img
            src={featured.thumbnail_url || '/ielts-hero-student.webp'}
            alt={`${featured.title} - featured IELTS preparation guide`}
            className="h-full min-h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-4 top-4 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-white shadow-lg">
            Featured story
          </span>
        </Link>
        <div className="flex flex-col p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <CategoryChip category={featured.category} />
            <ArticleMeta article={featured} compact />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold leading-tight tracking-[-0.035em] sm:text-3xl">
            <Link
              to={`/blog/${featured.slug}`}
              className="hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {featured.title}
            </Link>
          </h2>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {featured.description}
          </p>
          <div className="mt-auto flex items-center justify-between gap-4 pt-7">
            <span className="text-xs font-semibold text-slate-500">
              IELTS Ai Pro editorial team
            </span>
            <Link
              to={`/blog/${featured.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 dark:text-indigo-300"
            >
              Read story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function BlogSidebar({ articles, popularTags, setQuery, setCurrentPage }) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-36">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(15,23,42,.3)] dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <TrendingUp className="h-4 w-4" />
          </span>
          <h2 className="text-base font-extrabold">Trending now</h2>
        </div>
        <div className="mt-4 space-y-1">
          {articles.slice(0, 5).map((article, index) => (
            <Link
              key={article.id}
              to={`/blog/${article.slug}`}
              className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[.04]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-extrabold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <span className="line-clamp-2 text-xs font-bold leading-5 text-slate-800 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
                  {article.title}
                </span>
                <span className="mt-1 block text-[10px] text-slate-500">
                  {article.reading_minutes || 6} min read
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-indigo-600" />
          <h2 className="text-base font-extrabold">Popular topics</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                setCurrentPage(1);
              }}
              className="rounded-full border border-indigo-100 bg-indigo-50/60 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-500 p-6 text-white shadow-lg shadow-indigo-500/20">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[18px] border-white/10" />
        <Target className="h-8 w-8 text-violet-100" />
        <h2 className="mt-5 text-xl font-extrabold leading-tight">
          Ready to turn insight into progress?
        </h2>
        <p className="mt-3 text-sm leading-6 text-indigo-100">
          Take a focused practice test and see which skill needs your attention next.
        </p>
        <Button
          asChild
          className="mt-6 w-full rounded-xl bg-white font-bold text-indigo-700 hover:bg-indigo-50"
        >
          <Link to="/signup">
            Start free practice <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </aside>
  );
}

function BlogLoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        <Skeleton className="h-72 rounded-2xl" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-[520px] rounded-2xl" />
    </div>
  );
}

function BlogErrorState() {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
      <BookOpen className="mx-auto h-8 w-8 text-rose-500" />
      <h2 className="mt-4 text-xl font-bold">The article library is unavailable</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Please try again shortly.</p>
    </div>
  );
}

function BlogEmptyState({ onReset }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-white/15 dark:bg-slate-900">
      <BookOpen className="mx-auto h-8 w-8 text-indigo-500" />
      <h2 className="mt-4 text-xl font-bold">No article matches that search</h2>
      <button
        onClick={onReset}
        className="mt-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300"
      >
        Show every article
      </button>
    </div>
  );
}

function BlogArticleListContent({
  showFeatured,
  featured,
  isEditorialView,
  visibleArticles,
  paginatedArticles,
  articleListHeadingRef,
  safeCurrentPage,
  totalPages,
  articlesToPaginate,
  changePage,
  articles,
  popularTags,
  setQuery,
  setCurrentPage,
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        {showFeatured && <BlogFeaturedCard featured={featured} />}

        <div className="mb-5 flex items-center justify-between">
          <h2
            ref={articleListHeadingRef}
            tabIndex={-1}
            className="scroll-mt-24 text-xl font-extrabold tracking-[-0.025em] outline-none"
          >
            {isEditorialView ? 'Latest articles' : `${visibleArticles.length} articles found`}
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {paginatedArticles.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>
        <ArticlePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalArticles={articlesToPaginate.length}
          onPageChange={changePage}
        />
      </div>

      <BlogSidebar
        articles={articles}
        popularTags={popularTags}
        setQuery={setQuery}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}

const DEFAULT_CATEGORIES = [
  'All',
  'Writing',
  'Speaking',
  'Reading',
  'Listening',
  'Study Planning',
  'Exam Updates',
];

function extractBlogCategories(articles) {
  const articleCats = articles.map((a) => a.category).filter(Boolean);
  return [...new Set([...DEFAULT_CATEGORIES, ...articleCats])];
}

function extractBlogPopularTags(articles) {
  return [...new Set(articles.flatMap((a) => a.seo_tags || []))].slice(0, 10);
}

function filterVisibleArticles(articles, query, category) {
  const normalizedQuery = query.trim().toLowerCase();
  return articles.filter((article) => {
    const inCategory = category === 'All' || article.category === category;
    const searchable = `${article.title} ${article.description || ''} ${
      article.seo_tags?.join(' ') || ''
    }`.toLowerCase();
    return inCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

function useBlogPagination(articlesToPaginate, currentPage, setCurrentPage, articleListHeadingRef) {
  const shouldScrollToArticleList = useRef(false);

  const totalPages = Math.max(1, Math.ceil(articlesToPaginate.length / ARTICLES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedArticles = articlesToPaginate.slice(
    (safeCurrentPage - 1) * ARTICLES_PER_PAGE,
    safeCurrentPage * ARTICLES_PER_PAGE
  );

  const changePage = (nextPage) => {
    const resolvedPage = Math.min(Math.max(nextPage, 1), totalPages);
    if (resolvedPage === safeCurrentPage) return;
    shouldScrollToArticleList.current = true;
    setCurrentPage(resolvedPage);
  };

  useEffect(() => {
    if (!shouldScrollToArticleList.current) return;
    shouldScrollToArticleList.current = false;

    requestAnimationFrame(() => {
      const heading = articleListHeadingRef.current;
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        heading.focus({ preventScroll: true });
      }
    });
  }, [safeCurrentPage, articleListHeadingRef]);

  return { totalPages, safeCurrentPage, paginatedArticles, changePage };
}

function useBlogArticles({ query, category, currentPage, setCurrentPage, articleListHeadingRef }) {
  const { data, isLoading, isError } = useResources({
    filters: { content_type: 'blog', is_published: true },
    orderBy: '-published_at',
    limit: 50,
    page: 1,
  });

  const articles = data?.data || EMPTY_ARTICLES;
  const featured = articles.find((article) => article.featured) || articles[0];
  const categories = useMemo(() => extractBlogCategories(articles), [articles]);
  const popularTags = useMemo(() => extractBlogPopularTags(articles), [articles]);
  const visibleArticles = useMemo(
    () => filterVisibleArticles(articles, query, category),
    [articles, category, query]
  );

  const isEditorialView = category === 'All' && !query && featured;
  const articlesToPaginate = isEditorialView
    ? visibleArticles.filter((article) => article.id !== featured.id)
    : visibleArticles;

  const { totalPages, safeCurrentPage, paginatedArticles, changePage } = useBlogPagination(
    articlesToPaginate,
    currentPage,
    setCurrentPage,
    articleListHeadingRef
  );

  const showFeatured = isEditorialView && safeCurrentPage === 1;

  return {
    isLoading,
    isError,
    articles,
    featured,
    categories,
    popularTags,
    visibleArticles,
    articlesToPaginate,
    totalPages,
    safeCurrentPage,
    paginatedArticles,
    showFeatured,
    isEditorialView,
    changePage,
  };
}

export default function BlogIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';
  const queryParam = searchParams.get('q') || '';
  const pageParam = Number(searchParams.get('page')) || 1;

  const [query, setQuery] = useState(queryParam);
  const [category, setCategory] = useState(categoryParam);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const articleListHeadingRef = useRef(null);

  useEffect(() => {
    setCategory(searchParams.get('category') || 'All');
    setQuery(searchParams.get('q') || '');
    setCurrentPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  const updateCategory = (newCat) => {
    setCategory(newCat);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (newCat === 'All') p.delete('category');
      else p.set('category', newCat);
      p.delete('page');
      return p;
    });
  };

  const updateQuery = (newQ) => {
    setQuery(newQ);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (!newQ) p.delete('q');
      else p.set('q', newQ);
      p.delete('page');
      return p;
    });
  };

  const updatePage = (newPage) => {
    setCurrentPage(newPage);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (newPage <= 1) p.delete('page');
      else p.set('page', String(newPage));
      return p;
    });
  };

  const {
    isLoading,
    isError,
    articles,
    featured,
    categories,
    popularTags,
    visibleArticles,
    articlesToPaginate,
    totalPages,
    safeCurrentPage,
    paginatedArticles,
    showFeatured,
    isEditorialView,
    changePage,
  } = useBlogArticles({
    query,
    category,
    currentPage,
    setCurrentPage: updatePage,
    articleListHeadingRef,
  });

  const resetLibraryFilters = () => {
    updateQuery('');
    updateCategory('All');
  };

  let mainContent;
  if (isLoading) {
    mainContent = <BlogLoadingSkeleton />;
  } else if (isError) {
    mainContent = <BlogErrorState />;
  } else if (visibleArticles.length) {
    mainContent = (
      <BlogArticleListContent
        showFeatured={showFeatured}
        featured={featured}
        isEditorialView={isEditorialView}
        visibleArticles={visibleArticles}
        paginatedArticles={paginatedArticles}
        articleListHeadingRef={articleListHeadingRef}
        safeCurrentPage={safeCurrentPage}
        totalPages={totalPages}
        articlesToPaginate={articlesToPaginate}
        changePage={changePage}
        articles={articles}
        popularTags={popularTags}
        setQuery={updateQuery}
        setCurrentPage={updatePage}
      />
    );
  } else {
    mainContent = <BlogEmptyState onReset={resetLibraryFilters} />;
  }

  return (
    <>
      <DocumentHead
        title="IELTS Preparation Blog: Practical Band Score Guides"
        description="Practical IELTS Writing, Speaking, Reading, and Listening guides with clear strategies, study plans, and direct links to online practice."
        canonicalUrl="https://www.ieltsai.pro/blog"
        keywords="IELTS blog, IELTS preparation tips, IELTS Band 7, IELTS study plan"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'IELTS Preparation Blog',
          url: 'https://www.ieltsai.pro/blog',
        }}
      />

      <div className="min-h-screen bg-[#f7f9ff] font-sans text-slate-950 dark:bg-[#080b12] dark:text-white">
        <PublicNavbar />

        <main className="pt-16">
          <BlogHeroSection />
          <BlogCategoryBar
            categories={categories}
            category={category}
            setCategory={updateCategory}
            setCurrentPage={updatePage}
          />

          <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:py-12">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">
                  The study desk
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                  {isEditorialView ? 'Fresh guidance for your next practice' : 'Search the library'}
                </h2>
              </div>
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => updateQuery(event.target.value)}
                  placeholder="Search skills, questions, or goals"
                  aria-label="Search IELTS articles"
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm dark:border-white/10 dark:bg-white/[.04]"
                />
              </div>
            </div>

            {mainContent}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
