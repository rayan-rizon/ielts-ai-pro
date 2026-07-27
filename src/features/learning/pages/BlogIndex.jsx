import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Eye,
  PenLine,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import DocumentHead from '@/components/shared/DocumentHead';
import Footer from '@/features/core/components/landing/Footer';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import { useResources } from '@/features/learning/hooks/useResources';
import {
  BLOG_COVER_HEIGHT,
  BLOG_COVER_WIDTH,
  getBlogCoverAlt,
} from '@/features/learning/utils/blogCoverMeta';
import {
  BLOG_LIBRARY_COPY,
  getBlogCategories,
  getBlogCategoryPresentation,
  getBlogLibraryHeading,
} from '@/features/learning/utils/blogPresentation';
import { cn } from '@/lib/cn';
import { SidebarPracticeCard } from '@/features/learning/components/SidebarPracticeCard';

const EMPTY_ARTICLES = [];
const ARTICLES_PER_PAGE = 9;

const CATEGORY_ICONS = {
  'pen-line': PenLine,
  'mic-2': Mic2,
  'book-open': BookOpen,
  headphones: Headphones,
  'graduation-cap': GraduationCap,
  sparkles: Sparkles,
};

function getCategoryConfig(category) {
  const presentation = getBlogCategoryPresentation(category);
  return {
    ...presentation,
    icon: CATEGORY_ICONS[presentation.icon] || GraduationCap,
  };
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatReadCount(value) {
  const count = Math.max(0, Number(value) || 0);
  return `${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    count
  )} ${count === 1 ? 'read' : 'reads'}`;
}

function CategoryChip({ category, size = 'default' }) {
  const config = getCategoryConfig(category);
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border font-bold transition-all duration-200',
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs tracking-tight',
        config.chip
      )}
    >
      <Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span>{category || 'IELTS Guide'}</span>
    </span>
  );
}

function ArticleMeta({ article, compact = false }) {
  return (
    <div className="flex items-center shrink-0 whitespace-nowrap gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
      {!compact && (
        <>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatDate(article.published_at || article.created_at)}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
        </>
      )}
      <span className="inline-flex items-center gap-1">
        <Clock3 className="h-3 w-3" /> {article.reading_minutes || 6} min read
      </span>
      <span className="text-slate-300 dark:text-slate-700">•</span>
      <span
        className="inline-flex items-center gap-1"
        title={`${Number(article.view_count) || 0} reads`}
      >
        <Eye className="h-3 w-3" /> {formatReadCount(article.view_count)}
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
          alt={getBlogCoverAlt(article)}
          width={BLOG_COVER_WIDTH}
          height={BLOG_COVER_HEIGHT}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_35px_-28px_rgba(15,23,42,.35)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-indigo-300 hover:shadow-xl dark:border-white/10 dark:bg-slate-900 dark:hover:border-indigo-500/30"
    >
      <Link to={`/blog/${article.slug}`} aria-label={`Read ${article.title}`}>
        <ArticleVisual article={article} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div>
          <CategoryChip category={article.category} size="sm" />
        </div>
        <h2 className="mt-3 text-lg font-bold leading-snug tracking-[-0.02em] text-slate-950 dark:text-white">
          <Link
            to={`/blog/${article.slug}`}
            className="transition-colors duration-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300"
          >
            {article.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {article.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-5 dark:border-white/5">
          <ArticleMeta article={article} compact />
          <Link
            to={`/blog/${article.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 transition-colors duration-200 dark:text-indigo-300 group-hover:text-indigo-600 shrink-0"
          >
            <span>Read guide</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </Link>
        </div>
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
                  'relative flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-extrabold transition-colors duration-200',
                  item === currentPage
                    ? 'text-white'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200'
                )}
              >
                {item === currentPage && (
                  <motion.div
                    layoutId="activeBlogPageBadge"
                    className="absolute inset-0 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/25"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item}</span>
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
            <BookOpen className="h-3.5 w-3.5" /> {BLOG_LIBRARY_COPY.heroEyebrow}
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-[3.45rem] dark:text-white">
            {BLOG_LIBRARY_COPY.heroTitle}
          </h1>
          <p className="font-handwritten mt-3 text-3xl leading-tight text-indigo-600 sm:text-4xl dark:text-indigo-300">
            {BLOG_LIBRARY_COPY.heroScript}
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {BLOG_LIBRARY_COPY.heroDescription}
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
    <section className="py-6 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0b0f18]">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 flex justify-center">
        <div className="relative flex gap-1 items-center bg-slate-100/70 border border-slate-200/30 p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-full dark:bg-slate-900/50 dark:border-white/5">
          {categories.map((item) => {
            const config = item === 'All' ? null : getCategoryConfig(item);
            const Icon = config?.icon || FileText;
            const isActive = category === item;
            return (
              <button
                key={item}
                onClick={() => {
                  setCategory(item);
                  setCurrentPage(1);
                }}
                className={cn(
                  'relative inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all duration-200 outline-none',
                  !isActive && 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBlogCategoryTab"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_3px_10px_rgba(15,23,42,0.06)] border border-slate-200/10 dark:bg-slate-800 dark:border-white/5"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 inline-flex items-center gap-2 transition-colors duration-200',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-300'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-100'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item === 'All' ? 'All articles' : item}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 60 : direction < 0 ? -60 : 0,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 60 : direction > 0 ? -60 : 0,
    opacity: 0,
    scale: 0.98,
  }),
};

function BlogFeaturedCarousel({ featuredArticles }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  const articleCount = featuredArticles.length;
  const activeIndex = articleCount > 0 ? ((page % articleCount) + articleCount) % articleCount : 0;

  const paginate = (newDirection) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  };

  useEffect(() => {
    if (articleCount <= 1 || isPaused) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 6000);
    return () => clearInterval(timer);
  }, [articleCount, isPaused]);

  useEffect(() => {
    setPage(([_, dir]) => [Math.min(activeIndex, Math.max(articleCount - 1, 0)), dir]);
  }, [articleCount, activeIndex]);

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    paginate(-1);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    paginate(1);
  };

  const article = featuredArticles[activeIndex];
  if (!article) return null;

  return (
    <div
      className="relative group/carousel mb-5 w-full"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured IELTS articles"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          paginate(-1);
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          paginate(1);
        }
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartX.current;
        const endX = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (startX === null || typeof endX !== 'number' || Math.abs(startX - endX) < 48) return;
        if (startX > endX) paginate(1);
        else paginate(-1);
      }}
    >
      {/* Navigation Buttons */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-[-12px] top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all duration-200 hover:scale-110 hover:bg-slate-50 hover:shadow-lg active:scale-95 sm:left-[-22px] sm:h-11 sm:w-11 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        aria-label="Previous featured article"
      >
        <ChevronLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-[-12px] top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all duration-200 hover:scale-110 hover:bg-slate-50 hover:shadow-lg active:scale-95 sm:right-[-22px] sm:h-11 sm:w-11 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        aria-label="Next featured article"
      >
        <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>

      {/* Main Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_16px_48px_-16px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/75 transition-all duration-300">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 320, damping: 32 },
              opacity: { duration: 0.25 },
              scale: { duration: 0.25 },
            }}
            className="grid gap-6 p-4 md:grid-cols-[1.05fr_1.25fr] lg:p-5"
            aria-live="polite"
          >
            {/* Image Container */}
            <Link
              to={`/blog/${article.slug}`}
              className="relative aspect-[16/10] md:aspect-auto md:h-full w-full overflow-hidden rounded-xl group block"
            >
              <img
                src={article.thumbnail_url || '/ielts-hero-student.webp'}
                alt={getBlogCoverAlt(article)}
                className="h-full min-h-[220px] md:min-h-[280px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-indigo-600/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-md backdrop-blur-md">
                <Sparkles className="h-3 w-3 fill-amber-300 text-amber-300" /> Featured
              </span>
            </Link>

            {/* Text/Content Container */}
            <div className="flex flex-col justify-between py-2 sm:pl-2 sm:pr-4">
              <div className="space-y-4">
                {/* Category & Reading Time */}
                <div className="flex flex-wrap items-center gap-3">
                  <CategoryChip category={article.category} />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    {article.reading_minutes || 6} min read
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-slate-500">
                    <Eye className="h-3.5 w-3.5" /> {formatReadCount(article.view_count)}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl lg:text-[2rem] font-black leading-[1.12] tracking-[-0.035em] text-slate-950 dark:text-white mt-3">
                  <Link
                    to={`/blog/${article.slug}`}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  >
                    {article.title}
                  </Link>
                </h2>

                {/* Description */}
                <p className="text-sm md:text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                  {article.description}
                </p>
              </div>

              {/* Author details & Published Date */}
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-white/5 pt-5 mt-6">
                <span className="text-xs font-semibold text-slate-500">
                  IELTS Ai Pro editorial team
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {formatDate(article.published_at)}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {activeIndex + 1} of {articleCount}
        </span>
        {/* Circle point indicators */}
        <div className="flex items-center justify-center gap-1.5">
          {featuredArticles.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const dir = idx > activeIndex ? 1 : idx < activeIndex ? -1 : 0;
                  setPage([idx, dir]);
                }}
                className="relative flex h-3 items-center justify-center p-0.5 focus:outline-none"
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <motion.div
                  className={cn(
                    'h-2 rounded-full',
                    isActive
                      ? 'bg-[#5262ef]'
                      : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                  )}
                  animate={{
                    width: isActive ? 20 : 8,
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BlogSidebar({ articles, popularTags, setQuery, setCurrentPage }) {
  const trendingArticles = useMemo(
    () =>
      [...articles]
        .sort(
          (first, second) =>
            (Number(second.view_count) || 0) - (Number(first.view_count) || 0) ||
            new Date(second.published_at || second.created_at || 0) -
              new Date(first.published_at || first.created_at || 0)
        )
        .slice(0, 5),
    [articles]
  );

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
          {trendingArticles.map((article, index) => (
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
                  {formatReadCount(article.view_count)} · {article.reading_minutes || 6} min read
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

      <SidebarPracticeCard
        title="Ready to put your knowledge into action?"
        subtitle="Take a practice test and see where you stand."
        actionLabel="Start Free Test"
        actionPath="/signup"
      />
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
  const featuredArticles = useMemo(() => {
    const list = articles.filter((a) => a.featured);
    return list.length >= 2 ? list : articles.slice(0, 3);
  }, [articles]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        {showFeatured && <BlogFeaturedCarousel featuredArticles={featuredArticles} />}

        <div className="mb-5 flex items-center justify-between">
          <h2
            ref={articleListHeadingRef}
            tabIndex={-1}
            className="scroll-mt-24 text-xl font-extrabold tracking-[-0.025em] outline-none"
          >
            {isEditorialView
              ? BLOG_LIBRARY_COPY.latestTitle
              : `${visibleArticles.length} articles found`}
          </h2>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${isEditorialView ? 'editorial' : 'search'}-${safeCurrentPage}-${articlesToPaginate.length}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {paginatedArticles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
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

function extractBlogCategories(articles) {
  return getBlogCategories(articles);
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
        title={BLOG_LIBRARY_COPY.metaTitle}
        description={BLOG_LIBRARY_COPY.metaDescription}
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

          <section className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:py-8">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">
                  {BLOG_LIBRARY_COPY.sectionEyebrow}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                  {getBlogLibraryHeading({ category, query })}
                </h2>
              </div>
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => updateQuery(event.target.value)}
                  placeholder={BLOG_LIBRARY_COPY.searchPlaceholder}
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
