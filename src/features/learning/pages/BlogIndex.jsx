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
  X,
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
    <div className="flex items-center shrink-0 whitespace-nowrap gap-2 text-[11px] font-mono tabular-nums tracking-tight text-slate-500 dark:text-slate-400">
      {!compact && (
        <>
          <span className="inline-flex items-center gap-1 font-sans">
            <CalendarDays className="h-3 w-3 text-slate-400" />
            {formatDate(article.published_at || article.created_at)}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
        </>
      )}
      <span className="inline-flex items-center gap-1">
        <Clock3 className="h-3 w-3 text-slate-400" /> {article.reading_minutes || 6} min read
      </span>
      <span className="text-slate-300 dark:text-slate-700">•</span>
      <span
        className="inline-flex items-center gap-1"
        title={`${Number(article.view_count) || 0} reads`}
      >
        <Eye className="h-3 w-3 text-slate-400" /> {formatReadCount(article.view_count)}
      </span>
    </div>
  );
}

function ArticleVisual({ article }) {
  const config = getCategoryConfig(article.category);
  const Icon = config.icon;

  if (article.thumbnail_url) {
    return (
      <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-white/[0.03]">
        <img
          src={article.thumbnail_url}
          alt={getBlogCoverAlt(article)}
          width={BLOG_COVER_WIDTH}
          height={BLOG_COVER_HEIGHT}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141319]/40 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4e2f0] dark:border-white/20 bg-white/90 dark:bg-[#141319]/90 text-[#5a63df] dark:text-[#a9afff] shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative h-44 overflow-hidden bg-gradient-to-br transition-transform duration-500 group-hover:scale-[1.02]',
        config.visual
      )}
    >
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_2px_2px,currentColor_1px,transparent_0)] [background-size:16px_16px]" />
      <div className="absolute bottom-3 left-4 flex h-10 w-10 rotate-[-4deg] items-center justify-center rounded-xl border border-white/60 bg-white/90 text-[#5a63df] shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="absolute bottom-3 right-4 rounded-md border border-white/50 bg-white/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-700 shadow-xs">
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
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] transition-all duration-200 hover:-translate-y-1 hover:border-[#5a63df]/40 dark:hover:border-white/20"
    >
      <Link to={`/blog/${article.slug}`} aria-label={`Read ${article.title}`}>
        <ArticleVisual article={article} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div>
          <CategoryChip category={article.category} size="sm" />
        </div>
        <h2 className="mt-3 text-base font-extrabold leading-snug tracking-tight text-slate-800 dark:text-slate-100">
          <Link
            to={`/blog/${article.slug}`}
            className="transition-colors duration-200 group-hover:text-[#5a63df] dark:group-hover:text-[#8f97ff]"
          >
            {article.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
          {article.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#eceafa] dark:border-white/[0.07] pt-3.5 mt-4">
          <ArticleMeta article={article} compact />
          <Link
            to={`/blog/${article.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#5a63df] dark:text-[#a9afff] transition-colors duration-200 hover:text-[#4850c8] shrink-0"
          >
            <span>Read guide</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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
      className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] px-4 py-3.5 sm:flex-row sm:px-5"
      aria-label="Blog article pagination"
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono tabular-nums">
        Showing{' '}
        <span className="font-extrabold text-slate-700 dark:text-slate-200">
          {firstArticle}–{lastArticle}
        </span>{' '}
        of{' '}
        <span className="font-extrabold text-slate-700 dark:text-slate-200">{totalArticles}</span>{' '}
        guides
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e4e2f0] dark:border-white/10 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:border-[#5a63df]/30 hover:bg-[#5a63df]/[0.08] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-40"
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
                  'relative flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-mono tabular-nums font-bold transition-colors duration-200',
                  item === currentPage
                    ? 'text-white'
                    : 'text-slate-600 hover:bg-[#5a63df]/10 hover:text-[#5a63df] dark:text-slate-300 dark:hover:bg-white/[0.05]'
                )}
              >
                {item === currentPage && (
                  <motion.div
                    layoutId="activeBlogPageBadge"
                    className="absolute inset-0 rounded-lg bg-[#5a63df]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item}</span>
              </button>
            ) : (
              <span key={item} className="px-1 text-xs font-bold text-slate-400" aria-hidden="true">
                …
              </span>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e4e2f0] dark:border-white/10 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:border-[#5a63df]/30 hover:bg-[#5a63df]/[0.08] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-40"
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
    <section className="relative overflow-hidden border-b border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-b from-white via-[#faf9ff] to-white dark:from-[#090b13] dark:via-[#0e111c] dark:to-[#090b13]">
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[.95fr_1.05fr] lg:py-14">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5a63df]/30 bg-[#5a63df]/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#5a63df] dark:border-[#8f97ff]/40 dark:bg-[#8f97ff]/20 dark:text-[#a9afff]">
            <BookOpen className="h-3 w-3" /> {BLOG_LIBRARY_COPY.heroEyebrow}
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[3.1rem] text-slate-900 dark:text-white">
            {BLOG_LIBRARY_COPY.heroTitle}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
            {BLOG_LIBRARY_COPY.heroDescription}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mx-auto w-full max-w-2xl"
        >
          <div className="overflow-hidden rounded-xl border border-[#e4e2f0] dark:border-white/[0.08] bg-white dark:bg-[#131315] p-2 shadow-sm">
            <img
              src="/ielts-hero-student.webp"
              alt="IELTS learner studying with a laptop and notebook"
              className="aspect-[16/10] w-full rounded-lg object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BlogCategoryBar({ categories, category, setCategory, setCurrentPage }) {
  const scrollRef = useRef(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const handleSelectCategory = (item, event) => {
    setCategory(item);
    setCurrentPage(1);
    if (event?.currentTarget) {
      event.currentTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  return (
    <section className="py-3 sm:py-4 border-b border-slate-200/80 dark:border-slate-800/70 bg-white/75 dark:bg-slate-950/75 backdrop-blur-2xl sticky top-14 sm:top-16 z-20 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 relative">
        <div
          ref={scrollRef}
          onMouseLeave={() => setHoveredCategory(null)}
          className="relative flex items-center gap-1 overflow-x-auto no-scrollbar p-1 rounded-full bg-slate-100/80 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-2xl shadow-xs hover:border-indigo-500/25 dark:hover:border-indigo-400/30 w-full md:w-max md:mx-auto transition-colors duration-300"
        >
          {categories.map((item) => {
            const config = item === 'All' ? null : getCategoryConfig(item);
            const Icon = config?.icon || FileText;
            const isActive = category === item;
            return (
              <button
                key={item}
                onClick={(e) => handleSelectCategory(item, e)}
                onMouseEnter={() => setHoveredCategory(item)}
                className={cn(
                  'relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] md:text-sm font-semibold tracking-tight transition-colors duration-200 outline-none whitespace-nowrap active:scale-95 z-10 cursor-pointer',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBlogCategoryTab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-indigo-500/15 dark:from-indigo-400/20 dark:via-violet-400/20 dark:to-indigo-400/20 border border-indigo-500/30 dark:border-indigo-400/35 shadow-[0_2px_10px_-2px_rgba(99,102,241,0.18)] z-0"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <AnimatePresence>
                  {hoveredCategory === item && !isActive && (
                    <motion.span
                      layoutId="hoverBlogCategoryTab"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                        opacity: { duration: 0.15 },
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 dark:from-indigo-400/15 dark:via-violet-400/15 dark:to-indigo-400/15 border border-indigo-500/20 dark:border-indigo-400/25 shadow-[0_2px_8px_-2px_rgba(99,102,241,0.14)] pointer-events-none z-0"
                    />
                  )}
                </AnimatePresence>
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item === 'All' ? 'All articles' : item}</span>
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
    x: direction > 0 ? 40 : direction < 0 ? -40 : 0,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 40 : direction > 0 ? -40 : 0,
    opacity: 0,
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
      aria-label="Featured IELTS articles"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Navigation Buttons */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-[-10px] top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:bg-slate-50 dark:bg-[#141319] dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label="Previous featured article"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-[-10px] top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:bg-slate-50 dark:bg-[#141319] dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label="Next featured article"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Main Card */}
      <div className="relative overflow-hidden rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] transition-all duration-200">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 350, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="grid gap-5 p-4 md:grid-cols-[1fr_1.2fr]"
            aria-live="polite"
          >
            {/* Image Container */}
            <Link
              to={`/blog/${article.slug}`}
              className="relative aspect-[16/10] md:aspect-auto md:h-full w-full overflow-hidden rounded-lg group block"
            >
              <img
                src={article.thumbnail_url || '/ielts-hero-student.webp'}
                alt={getBlogCoverAlt(article)}
                className="h-full min-h-[200px] md:min-h-[240px] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md border border-[#5a63df]/30 bg-[#5a63df] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white shadow-xs">
                <Sparkles className="h-3 w-3" /> Featured
              </span>
            </Link>

            {/* Text/Content Container */}
            <div className="flex flex-col justify-between py-1 sm:pr-2">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryChip category={article.category} size="sm" />
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {article.reading_minutes || 6} min read
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 mt-2">
                  <Link
                    to={`/blog/${article.slug}`}
                    className="hover:text-[#5a63df] dark:hover:text-[#a9afff] transition-colors duration-200"
                  >
                    {article.title}
                  </Link>
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                  {article.description}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-[#eceafa] dark:border-white/[0.07] pt-3.5 mt-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  IELTS Ai Pro editorial
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                  {formatDate(article.published_at)}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
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
    <aside className="space-y-4 lg:sticky lg:top-36">
      <div className="rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#5a63df]/30 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]">
            <TrendingUp className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Trending now
          </h2>
        </div>
        <div className="mt-3 space-y-1">
          {trendingArticles.map((article, index) => (
            <Link
              key={article.id}
              to={`/blog/${article.slug}`}
              className="group flex gap-2.5 rounded-lg p-2 transition-colors hover:bg-[#f4f3fb] dark:hover:bg-white/[0.04]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#5a63df]/20 bg-[#5a63df]/10 text-[11px] font-mono tabular-nums font-bold text-[#5a63df] dark:border-[#8f97ff]/20 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-xs font-bold leading-snug text-slate-800 group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#a9afff]">
                  {article.title}
                </span>
                <span className="mt-1 block text-[10px] font-mono tabular-nums text-slate-500">
                  {formatReadCount(article.view_count)} · {article.reading_minutes || 6} min read
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] p-4">
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#8f97ff]" />
          <h2 className="text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Popular topics
          </h2>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                setCurrentPage(1);
              }}
              className="rounded-full border border-[#5a63df]/25 bg-[#5a63df]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5a63df] dark:border-[#8f97ff]/35 dark:bg-[#8f97ff]/20 dark:text-[#c7cbff] transition-all hover:bg-[#5a63df] hover:text-white dark:hover:bg-[#8f97ff] dark:hover:text-[#090b13]"
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
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200/60 pb-5 dark:border-white/5">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-indigo-600 dark:text-indigo-400">
                  {BLOG_LIBRARY_COPY.sectionEyebrow}
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] sm:text-3xl dark:text-white">
                  {getBlogLibraryHeading({ category, query })}
                </h2>
              </div>
              <div className="relative w-full sm:max-w-sm">
                <div className="group relative flex items-center rounded-full border border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#141319] p-1 transition-all duration-200 focus-within:border-[#5a63df] dark:focus-within:border-[#8f97ff] focus-within:ring-2 focus-within:ring-[#5a63df]/20 dark:focus-within:ring-[#8f97ff]/20">
                  <Search className="ml-3.5 h-4 w-4 shrink-0 text-slate-400 transition-colors duration-200 group-focus-within:text-[#5a63df] dark:group-focus-within:text-[#8f97ff]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => updateQuery(event.target.value)}
                    placeholder={BLOG_LIBRARY_COPY.searchPlaceholder}
                    aria-label="Search IELTS articles"
                    className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 dark:text-white !border-none !outline-none focus:!outline-none focus-visible:!outline-none focus-visible:!ring-0 !shadow-none !ring-0 [outline:none!important] [border:none!important]"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => updateQuery('')}
                      className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20 dark:hover:text-slate-200 transition-colors"
                      aria-label="Clear search query"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
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
