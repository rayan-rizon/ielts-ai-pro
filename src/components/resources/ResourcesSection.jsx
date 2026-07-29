import { useState, useEffect, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Video,
  FileText,
  BookOpen,
  Eye,
  ArrowRight,
  X,
  LayoutGrid,
  List,
  Library,
  Brain,
  ChevronRight,
} from 'lucide-react';
import { Resource } from '@/entities';
import { cn } from '@/lib/cn';
import { useResources } from '@/features/learning/hooks/useResources';
import { useDebounce } from '@/hooks/useDebounce';
import { VOCABULARY_KITS } from '@/features/vocabulary/data/vocabularyKits';

const CONTENT_TYPES = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  {
    id: 'video',
    label: 'Videos',
    icon: Video,
    color: 'rose',
    bgGradient: 'from-rose-500/10 to-transparent',
    accent: 'rose-500',
  },
  {
    id: 'pdf',
    label: 'PDFs',
    icon: FileText,
    color: 'blue',
    bgGradient: 'from-blue-500/10 to-transparent',
    accent: 'blue-500',
  },
  {
    id: 'blog',
    label: 'Articles',
    icon: BookOpen,
    color: 'emerald',
    bgGradient: 'from-emerald-500/10 to-transparent',
    accent: 'emerald-500',
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    icon: Brain,
    color: 'indigo',
    bgGradient: 'from-indigo-500/10 to-transparent',
    accent: 'indigo-500',
  },
];

// ─── Base Resource Card (Shared UI Component) ─────────────────
const BaseResourceCard = ({
  onOpen,
  resource,
  aspectRatio = '16/9',
  maxHeight,
  thumbnail,
  badgeText,
  badgeBg,
  icon: FallbackIcon,
  actionText,
  actionColor = 'text-slate-500 dark:text-slate-400',
  hoverBorder = 'hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-black/40',
  imageContain = false,
  children,
}) => (
  <motion.div
    whileHover={{ y: -3 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      'group relative flex flex-col h-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 overflow-hidden cursor-pointer shadow-2xs transition-all duration-200',
      hoverBorder
    )}
    onClick={() => onOpen(resource)}
  >
    {/* Cover Header */}
    <div
      className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-900/90 flex items-center justify-center"
      style={{ aspectRatio, maxHeight }}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={resource.title}
          className={cn(
            'w-full h-full transition-transform duration-500 group-hover:scale-105',
            imageContain ? 'object-contain p-1 drop-shadow-sm' : 'object-cover'
          )}
          loading="lazy"
        />
      ) : children ? (
        children
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
          {FallbackIcon && <FallbackIcon className="w-6 h-6 text-slate-400" />}
        </div>
      )}

      {/* Badge */}
      {badgeText && (
        <div className="absolute top-1.5 left-1.5">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white shadow-2xs',
              badgeBg
            )}
          >
            {badgeText}
          </span>
        </div>
      )}
    </div>

    {/* Content */}
    <div className="p-2.5 flex flex-col flex-grow">
      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug mb-2 line-clamp-2 transition-colors">
        {resource.title}
      </h3>
      <div className="mt-auto flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-1 text-slate-400">
          <Eye className="w-3 h-3" />
          <span className="text-[10px] font-semibold">{resource.view_count || 0}</span>
        </div>
        <div className={cn('flex items-center gap-0.5 text-[10px] font-extrabold', actionColor)}>
          {actionText} <ArrowRight className="w-2.5 h-2.5" />
        </div>
      </div>
    </div>
  </motion.div>
);

// ─── Video Card ────────────────────────────────────────────────
const VideoResourceCard = ({ resource, onOpen }) => {
  const getThumbnail = () => {
    if (resource.thumbnail_url) return resource.thumbnail_url;
    const embedInfo = Resource.getVideoEmbedInfo(resource.url);
    if (embedInfo?.type === 'youtube') {
      return `https://img.youtube.com/vi/${embedInfo.id}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <BaseResourceCard
      resource={resource}
      onOpen={onOpen}
      thumbnail={getThumbnail()}
      icon={Video}
      badgeText="Video"
      badgeBg="bg-slate-700"
      actionText="Watch"
      maxHeight="130px"
    />
  );
};

// ─── PDF / Book Card ───────────────────────────────────────────
const PDFResourceCard = ({ resource, onOpen }) => (
  <BaseResourceCard
    resource={resource}
    onOpen={onOpen}
    thumbnail={resource.thumbnail_url}
    icon={FileText}
    aspectRatio="3/4"
    imageContain
    badgeText="PDF"
    badgeBg="bg-slate-700"
    actionText="Open"
  />
);

// ─── Article Card ──────────────────────────────────────────────
const ArticleResourceCard = ({ resource, onOpen }) => (
  <BaseResourceCard
    resource={resource}
    onOpen={onOpen}
    thumbnail={resource.thumbnail_url}
    icon={BookOpen}
    badgeText="Article"
    badgeBg="bg-slate-700"
    actionText="Read"
    maxHeight="130px"
  />
);

// ─── Vocabulary Card ───────────────────────────────────────────
const VocabularyResourceCard = ({ resource, onOpen }) => {
  let wordCount = 0;
  try {
    const parsed = JSON.parse(resource.content || '[]');
    wordCount = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    wordCount = 0;
  }

  return (
    <BaseResourceCard
      resource={resource}
      onOpen={onOpen}
      thumbnail={resource.thumbnail_url}
      badgeText="Vocab"
      badgeBg="bg-slate-700"
      actionText="Study Deck"
      maxHeight="130px"
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-1 shadow-2xs">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-white/90">
          Vocabulary Deck
        </span>
        <div className="absolute top-1.5 right-1.5">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-black/60 backdrop-blur-md text-indigo-200 border border-white/10 shadow-2xs">
            {wordCount > 0 ? `${wordCount} Words` : 'Word List'}
          </span>
        </div>
      </div>
    </BaseResourceCard>
  );
};

// ─── Generic Dispatcher ────────────────────────────────────────
const ResourceCard = ({ resource, onOpen }) => {
  switch (resource.content_type) {
    case 'video':
      return <VideoResourceCard resource={resource} onOpen={onOpen} />;
    case 'pdf':
      return <PDFResourceCard resource={resource} onOpen={onOpen} />;
    case 'blog':
      return <ArticleResourceCard resource={resource} onOpen={onOpen} />;
    case 'vocabulary':
      return <VocabularyResourceCard resource={resource} onOpen={onOpen} />;
    default:
      return <VideoResourceCard resource={resource} onOpen={onOpen} />;
  }
};

// ─── Section Header ────────────────────────────────────────────
const COLOR_STYLES = {
  rose: { bg: 'bg-rose-500/10 text-rose-500', btn: 'text-rose-500' },
  blue: { bg: 'bg-blue-500/10 text-blue-500', btn: 'text-blue-500' },
  emerald: { bg: 'bg-emerald-500/10 text-emerald-500', btn: 'text-emerald-500' },
  indigo: { bg: 'bg-indigo-500/10 text-indigo-500', btn: 'text-indigo-500' },
};

const SectionHeader = ({ icon: Icon, title, count, color = 'indigo', onViewAll }) => {
  const style = COLOR_STYLES[color] || COLOR_STYLES.indigo;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between mb-4"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn('w-9 h-9 rounded-xl flex items-center justify-center shadow-sm', style.bg)}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
            {count} available
          </p>
        </div>
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className={cn(
            'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-all hover:gap-2',
            style.btn
          )}
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
};

// ─── Skeleton ──────────────────────────────────────────────────
const ResourcesSkeleton = () => (
  <div className="space-y-12">
    {/* Videos skeleton */}
    <div>
      <Skeleton className="h-8 w-48 mb-6 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={`v${i}`}
            className="rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/5"
          >
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <div className="pt-3 border-t flex justify-between">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* PDFs skeleton */}
    <div>
      <Skeleton className="h-8 w-48 mb-6 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={`p${i}`} className="space-y-2">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <Skeleton className="h-3 w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    </div>

    {/* Articles skeleton */}
    <div>
      <Skeleton className="h-8 w-48 mb-6 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={`a${i}`}
            className="flex gap-4 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5"
          >
            <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── "All" View: Segmented Display ────────────────────────────
const SegmentedAllView = ({ resources, onOpen, onViewAll }) => {
  const videos = resources.filter((r) => r.content_type === 'video');
  const pdfs = resources.filter((r) => r.content_type === 'pdf');
  const articles = resources.filter((r) => r.content_type === 'blog');
  const vocabs = resources.filter((r) => r.content_type === 'vocabulary');

  return (
    <div className="space-y-6">
      {/* Videos Section Card */}
      {videos.length > 0 && (
        <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-3.5">
          <SectionHeader
            icon={Video}
            title="Video Lessons"
            count={videos.length}
            color="rose"
            onViewAll={() => onViewAll('video')}
          />
          {/* 2 rows of videos: 4 columns x 2 rows = 8 videos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {videos.slice(0, 8).map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <VideoResourceCard resource={resource} onOpen={onOpen} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* PDFs Section Card (1 single row: 5 or 6 items max) */}
      {pdfs.length > 0 && (
        <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-3.5">
          <SectionHeader
            icon={FileText}
            title="Study Guides & Books"
            count={pdfs.length}
            color="blue"
            onViewAll={() => onViewAll('pdf')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {pdfs.slice(0, 6).map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <PDFResourceCard resource={resource} onOpen={onOpen} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Articles Section Card (2 rows: 4 columns x 2 rows = 8 items) */}
      {articles.length > 0 && (
        <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-3.5">
          <SectionHeader
            icon={BookOpen}
            title="Reading Materials"
            count={articles.length}
            color="emerald"
            onViewAll={() => onViewAll('blog')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {articles.slice(0, 8).map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ArticleResourceCard resource={resource} onOpen={onOpen} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Vocabulary Section Card (2 rows: 4 columns x 2 rows = 8 items) */}
      {vocabs.length > 0 && (
        <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-3.5">
          <SectionHeader
            icon={Brain}
            title="Vocabulary Lists"
            count={vocabs.length}
            color="indigo"
            onViewAll={() => onViewAll('vocabulary')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {vocabs.slice(0, 8).map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <VocabularyResourceCard resource={resource} onOpen={onOpen} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ─── Filtered Grid View ────────────────────────────────────────
const FilteredGridView = ({ resources, filterType, onOpen }) => {
  // Choose grid layout based on type
  const gridClass = useMemo(() => {
    switch (filterType) {
      case 'pdf':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5';
      case 'blog':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';
      case 'vocabulary':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';
    }
  }, [filterType]);

  return (
    <div className={gridClass}>
      {resources.map((resource, i) => (
        <motion.div
          key={resource.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <ResourceCard resource={resource} onOpen={onOpen} />
        </motion.div>
      ))}
    </div>
  );
};

// ─── Sub-Components for ResourcesSection ─────────────────────
const ControlsBar = ({ searchQuery, setSearchQuery, filterType, handleTypeChange }) => (
  <div className="sticky top-4 z-40">
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-3 py-2 rounded-2xl shadow-lg shadow-slate-900/5 dark:shadow-black/30 border border-slate-200/80 dark:border-white/10 flex flex-wrap lg:flex-nowrap gap-2 items-center justify-between">
      {/* Search */}
      <div className="relative w-full lg:max-w-xs group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-white/[0.10] h-9 rounded-full text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-500/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 p-0.5 bg-slate-100/80 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/[0.10] overflow-x-auto no-scrollbar flex-1 lg:flex-none">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => handleTypeChange(type.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap',
              filterType === type.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
            )}
          >
            {type.icon && <type.icon className="w-3.5 h-3.5 shrink-0" />}
            {type.label}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-1.5 text-indigo-500 cursor-pointer">
          <LayoutGrid className="w-4 h-4" />
          <span className="text-xs font-semibold">Grid</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed">
          <List className="w-4 h-4" />
          <span className="text-xs font-semibold">List</span>
        </div>
      </div>
    </div>
  </div>
);

const EmptyStateView = ({ searchQuery, filterType, onReset }) => (
  <div className="text-center py-12 px-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10">
    <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Library className="w-7 h-7 text-slate-400 dark:text-slate-600" />
    </div>
    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 tracking-tight">
      No resources found
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-5 max-w-sm mx-auto">
      {searchQuery
        ? 'Try different keywords or browse categories.'
        : "We're enriching our collection. Check back soon!"}
    </p>
    {(searchQuery || filterType !== 'all') && (
      <Button
        onClick={onReset}
        className="rounded-xl h-9 px-6 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 transition-all text-sm border-0"
      >
        Show All Resources
      </Button>
    )}
  </div>
);

const PaginationBar = ({ pagination, totalPages, setPagination }) => {
  const goTo = (page) => {
    setPagination((p) => ({ ...p, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const isFirst = pagination.page <= 1;
  const isLast = pagination.page >= totalPages;

  return (
    <div className="flex items-center justify-center gap-2 pt-6 pb-2">
      {/* Prev */}
      <button
        disabled={isFirst}
        onClick={() => goTo(pagination.page - 1)}
        className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
      >
        ← Prev
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i + 1)}
            className={cn(
              'w-9 h-9 rounded-xl text-xs font-semibold transition-all duration-150',
              pagination.page === i + 1
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Page info */}
      <span className="text-xs text-slate-400 dark:text-slate-600 font-medium px-1 hidden sm:inline">
        {pagination.page} / {totalPages}
      </span>

      {/* Next */}
      <button
        disabled={isLast}
        onClick={() => goTo(pagination.page + 1)}
        className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
      >
        Next →
      </button>
    </div>
  );
};

// ─── Resource navigation helper (pure, no branches in component) ─
const navigateToResource = ({ resource, navigate }) => {
  if (resource.content_type === 'blog' && resource.slug) {
    navigate(`/blog/${resource.slug}`);
  } else if (resource.content_type === 'vocabulary') {
    navigate(`/vocabulary/kits/${resource.slug || resource.id}`);
  } else {
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  }
};

// ─── Hook 1: Filter & URL state ────────────────────────────────
const useFilterState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [pagination, setPagination] = useState({ page: 1, limit: 24 });

  // Sync URL type param → filterType
  useEffect(() => {
    const type = searchParams.get('type');
    if (type && type !== filterType) {
      setFilterType(type);
      setPagination((p) => ({ ...p, page: 1 }));
    } else if (!type && filterType !== 'all') {
      setFilterType('all');
    }
  }, [searchParams, filterType]);

  // Reset to page 1 on new search
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearchQuery]);

  return {
    searchParams,
    setSearchParams,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    filterType,
    setFilterType,
    pagination,
    setPagination,
  };
};

// ─── Hook 2: Data query ─────────────────────────────────────────
const useResourcesQuery = ({ filterType, debouncedSearchQuery, pagination }) => {
  const queryFilters = useMemo(
    () => ({
      is_published: true,
      ...(filterType !== 'all' && { content_type: filterType }),
      ...(debouncedSearchQuery && { searchQuery: debouncedSearchQuery }),
    }),
    [filterType, debouncedSearchQuery]
  );

  const isAllUnfiltered = filterType === 'all' && !debouncedSearchQuery;
  const { data, isLoading } = useResources({
    filters: queryFilters,
    orderBy: '-created_at',
    limit: isAllUnfiltered ? 100 : pagination.limit,
    page: pagination.page,
    includeContent: true,
    enabled: filterType !== 'vocabulary',
  });

  const matchingLocalKits = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return VOCABULARY_KITS.filter(
      (kit) =>
        !query || `${kit.title} ${kit.description} ${kit.category}`.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery]);

  if (filterType === 'vocabulary') {
    const start = (pagination.page - 1) * pagination.limit;
    return {
      resources: matchingLocalKits.slice(start, start + pagination.limit),
      totalPages: Math.ceil(matchingLocalKits.length / pagination.limit),
      isLoading: false,
      isAllUnfiltered: false,
    };
  }

  const remoteResources = (data?.data || []).filter(
    (resource) => resource.content_type !== 'vocabulary'
  );
  const resources =
    filterType === 'all' ? [...matchingLocalKits, ...remoteResources] : remoteResources;
  const totalCount =
    filterType === 'all' ? matchingLocalKits.length + (data?.count || 0) : data?.count || 0;

  return {
    resources,
    totalPages: isAllUnfiltered ? 1 : Math.ceil(totalCount / pagination.limit),
    isLoading,
    isAllUnfiltered,
  };
};

// ─── Hook 3: Event handlers ─────────────────────────────────────
const useResourceHandlers = ({
  setFilterType,
  setPagination,
  searchParams,
  setSearchParams,
  setSearchQuery,
  navigate,
}) => {
  const handleOpenResource = async (resource) => {
    if (!resource.is_local) await Resource.incrementViewCount(resource.id);
    navigateToResource({ resource, navigate });
  };

  const handleViewAllType = (type) => {
    setFilterType(type);
    setPagination((p) => ({ ...p, page: 1 }));
    searchParams.set('type', type);
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTypeChange = (id) => {
    setFilterType(id);
    setPagination((p) => ({ ...p, page: 1 }));
    if (id === 'all') searchParams.delete('type');
    else searchParams.set('type', id);
    setSearchParams(searchParams);
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterType('all');
    searchParams.delete('type');
    setSearchParams(searchParams);
  };

  return { handleOpenResource, handleViewAllType, handleTypeChange, handleReset };
};

// ─── ResourcesContent — animated content area ───────────────────
const ResourcesContent = ({
  isLoading,
  resources,
  isAllUnfiltered,
  filterType,
  searchQuery,
  pagination,
  handleOpenResource,
  handleViewAllType,
  handleReset,
}) => {
  const getContent = () => {
    if (isLoading) return <ResourcesSkeleton />;
    if (!resources.length) {
      return (
        <EmptyStateView searchQuery={searchQuery} filterType={filterType} onReset={handleReset} />
      );
    }
    if (isAllUnfiltered) {
      return (
        <SegmentedAllView
          resources={resources}
          onOpen={handleOpenResource}
          onViewAll={handleViewAllType}
        />
      );
    }
    return (
      <FilteredGridView resources={resources} filterType={filterType} onOpen={handleOpenResource} />
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={filterType + pagination.page}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4 }}
      >
        {getContent()}
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ─────────────────────────────────────────────
const ResourcesSection = () => {
  const navigate = useNavigate();

  const {
    searchParams,
    setSearchParams,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    filterType,
    setFilterType,
    pagination,
    setPagination,
  } = useFilterState();
  const { resources, totalPages, isLoading, isAllUnfiltered } = useResourcesQuery({
    filterType,
    debouncedSearchQuery,
    pagination,
  });
  const { handleOpenResource, handleViewAllType, handleTypeChange, handleReset } =
    useResourceHandlers({
      setFilterType,
      setPagination,
      searchParams,
      setSearchParams,
      setSearchQuery,
      navigate,
    });

  return (
    <div className="space-y-4">
      <ControlsBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        handleTypeChange={handleTypeChange}
      />
      <ResourcesContent
        isLoading={isLoading}
        resources={resources}
        isAllUnfiltered={isAllUnfiltered}
        filterType={filterType}
        searchQuery={searchQuery}
        pagination={pagination}
        handleOpenResource={handleOpenResource}
        handleViewAllType={handleViewAllType}
        handleReset={handleReset}
      />
      {totalPages > 1 && (
        <PaginationBar
          pagination={pagination}
          totalPages={totalPages}
          setPagination={setPagination}
        />
      )}
    </div>
  );
};

export default memo(ResourcesSection);
