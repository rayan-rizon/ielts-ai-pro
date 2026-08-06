import { useState, useEffect, memo, useMemo } from 'react';
import { motion, m, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
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
  Library,
  Brain,
  ChevronRight,
} from 'lucide-react';
import { Resource } from '@/entities';
import { cn } from '@/lib/cn';
import { useResources } from '@/features/learning/hooks/useResources';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { VOCABULARY_KITS } from '@/features/vocabulary/data/vocabularyKits';
import KitCard from '@/features/vocabulary/components/KitCard';
import { useVocabularyData } from '@/features/vocabulary/hooks';
import {
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  TILE,
  TITLE,
} from '@/features/dashboard/components/primitives';

const CONTENT_TYPES = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'video', label: 'Videos', icon: Video, tone: 'rose' },
  { id: 'pdf', label: 'PDFs', icon: FileText, tone: 'sky' },
  { id: 'blog', label: 'Articles', icon: BookOpen, tone: 'emerald' },
  { id: 'vocabulary', label: 'Vocabulary', icon: Brain, tone: 'accent' },
];

// ─── Base Resource Card (Shared UI Component) ─────────────────
const BaseResourceCard = ({
  onOpen,
  resource,
  aspectRatio = '16/9',
  maxHeight,
  thumbnail,
  badgeText,
  badgeBg = 'bg-slate-800/85 dark:bg-black/60',
  icon: FallbackIcon,
  actionText,
  actionColor = 'text-slate-500 dark:text-slate-400',
  imageContain = false,
  children,
}) => (
  <motion.div
    whileHover={{ y: -3 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      PANEL,
      'group relative flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-200 hover:shadow-sm dark:hover:border-white/12'
    )}
    onClick={() => onOpen(resource)}
  >
    {/* Cover Header */}
    <div
      className={cn('relative flex w-full items-center justify-center overflow-hidden', TILE)}
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
        <div className="flex h-full w-full items-center justify-center">
          {FallbackIcon && <FallbackIcon className="w-6 h-6 text-slate-400" />}
        </div>
      )}

      {/* Badge */}
      {badgeText && (
        <div className="absolute top-1.5 left-1.5">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white',
              badgeBg
            )}
          >
            {badgeText}
          </span>
        </div>
      )}
    </div>

    {/* Content */}
    <div className="flex grow flex-col p-2.5">
      <h3 className={cn(TITLE, 'mb-2 text-xs leading-snug line-clamp-2')}>{resource.title}</h3>
      <div className="mt-auto flex items-center justify-between border-t border-[#eceafa] pt-1.5 dark:border-white/[0.07]">
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <Eye className="w-3 h-3" />
          <span className={cn(NUM, 'text-[10px] font-semibold')}>{resource.view_count || 0}</span>
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
const VocabularyResourceCard = ({ resource, index = 0, user, allVocabulary }) => {
  return <KitCard kit={resource} index={index} user={user} allVocabulary={allVocabulary} />;
};

// ─── Generic Dispatcher ────────────────────────────────────────
const ResourceCard = ({ resource, index = 0, onOpen, user, allVocabulary }) => {
  switch (resource.content_type) {
    case 'video':
      return <VideoResourceCard resource={resource} onOpen={onOpen} />;
    case 'pdf':
      return <PDFResourceCard resource={resource} onOpen={onOpen} />;
    case 'blog':
      return <ArticleResourceCard resource={resource} onOpen={onOpen} />;
    case 'vocabulary':
      return (
        <VocabularyResourceCard
          resource={resource}
          index={index}
          onOpen={onOpen}
          user={user}
          allVocabulary={allVocabulary}
        />
      );
    default:
      return <VideoResourceCard resource={resource} onOpen={onOpen} />;
  }
};

// ─── Section Header ────────────────────────────────────────────
const SECTION_TONE_TEXT = {
  rose: 'text-rose-600 dark:text-rose-300',
  sky: 'text-sky-600 dark:text-sky-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  accent: 'text-[#5a63df] dark:text-[#a9afff]',
};

const SectionHeader = ({ icon: Icon, title, count, tone = 'accent', onViewAll }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="mb-3.5 flex items-center justify-between"
  >
    <div className="flex items-center gap-2.5">
      <IconChip icon={Icon} tone={tone} size="md" />
      <div>
        <h2 className={cn(TITLE, 'text-sm')}>{title}</h2>
        <p className={cn(MICRO, MUTED, 'mt-0.5')}>
          <span className={cn(NUM, 'font-bold')}>{count}</span> available
        </p>
      </div>
    </div>
    {onViewAll && (
      <button
        onClick={onViewAll}
        className={cn(
          MICRO,
          'flex items-center gap-1 transition-all hover:gap-1.5',
          SECTION_TONE_TEXT[tone] || SECTION_TONE_TEXT.accent
        )}
      >
        View all
        <ChevronRight className="h-3 w-3" />
      </button>
    )}
  </motion.div>
);

// ─── Skeleton ──────────────────────────────────────────────────
const ResourcesSkeleton = () => (
  <div className="space-y-4">
    {[
      { key: 'video', cols: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', count: 4 },
      {
        key: 'pdf',
        cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
        count: 6,
      },
      { key: 'blog', cols: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4', count: 4 },
    ].map((section) => (
      <div key={section.key} className={cn(PANEL, 'space-y-3.5 p-4 sm:p-5')}>
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className={cn('grid grid-cols-1 gap-3', section.cols)}>
          {[...Array(section.count)].map((_, i) => (
            <div key={i} className={cn(TILE, 'overflow-hidden')}>
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-2 p-2.5">
                <Skeleton className="h-3 w-3/4" />
                <div className="flex justify-between pt-1.5">
                  <Skeleton className="h-2.5 w-8" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── "All" View: Segmented Display ────────────────────────────
const SegmentedAllView = ({ resources, onOpen, onViewAll, user, allVocabulary }) => {
  const videos = resources.filter((r) => r.content_type === 'video');
  const pdfs = resources.filter((r) => r.content_type === 'pdf');
  const articles = resources.filter((r) => r.content_type === 'blog');
  const vocabs = resources.filter((r) => r.content_type === 'vocabulary');

  return (
    <div className="space-y-6">
      {/* Videos Section Card */}
      {videos.length > 0 && (
        <section className={cn(PANEL, 'space-y-3.5 p-4 sm:p-5')}>
          <SectionHeader
            icon={Video}
            title="Video Lessons"
            count={videos.length}
            tone="rose"
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
        <section className={cn(PANEL, 'space-y-3.5 p-4 sm:p-5')}>
          <SectionHeader
            icon={FileText}
            title="Study Guides & Books"
            count={pdfs.length}
            tone="sky"
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
        <section className={cn(PANEL, 'space-y-3.5 p-4 sm:p-5')}>
          <SectionHeader
            icon={BookOpen}
            title="Reading Materials"
            count={articles.length}
            tone="emerald"
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
        <section className={cn(PANEL, 'space-y-3.5 p-4 sm:p-5')}>
          <SectionHeader
            icon={Brain}
            title="Vocabulary Lists"
            count={vocabs.length}
            tone="accent"
            onViewAll={() => onViewAll('vocabulary')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
            {vocabs.slice(0, 12).map((resource, i) => (
              <motion.div
                key={resource.id || resource.slug}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <VocabularyResourceCard
                  resource={resource}
                  index={i}
                  onOpen={onOpen}
                  user={user}
                  allVocabulary={allVocabulary}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ─── Filtered Grid View ────────────────────────────────────────
const FilteredGridView = ({ resources, filterType, onOpen, user, allVocabulary }) => {
  // Choose grid layout based on type
  const gridClass = useMemo(() => {
    switch (filterType) {
      case 'pdf':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5';
      case 'blog':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';
      case 'vocabulary':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';
    }
  }, [filterType]);

  return (
    <div className={gridClass}>
      {resources.map((resource, i) => (
        <motion.div
          key={resource.id || resource.slug}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <ResourceCard
            resource={resource}
            index={i}
            onOpen={onOpen}
            user={user}
            allVocabulary={allVocabulary}
          />
        </motion.div>
      ))}
    </div>
  );
};

// ─── Sub-Components for ResourcesSection ─────────────────────
const ControlsBar = ({ searchQuery, setSearchQuery, filterType, handleTypeChange }) => (
  <div className="sticky top-4 z-40">
    <div
      className={cn(TILE, 'flex flex-wrap items-center justify-between gap-2 p-2 lg:flex-nowrap')}
    >
      {/* Search */}
      <div className="group relative w-full lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#5a63df]" />
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 rounded-lg border-[#e2e5f2] bg-white pl-9 text-xs font-semibold dark:border-white/10 dark:bg-[#131315]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-all hover:bg-slate-200/60 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto rounded-lg border border-[#e2e5f2] bg-white p-0.5 dark:border-white/10 dark:bg-white/4 lg:flex-none">
        {CONTENT_TYPES.map((type) => {
          const isActive = filterType === type.id;
          return (
            <m.button
              key={type.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleTypeChange(type.id)}
              className={cn(
                'relative z-10 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-200',
                isActive
                  ? 'text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
              )}
            >
              {isActive && (
                <m.div
                  layoutId="resourceTypeIndicator"
                  className="absolute inset-0 -z-10 rounded-md bg-[#5a63df]"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              {type.icon && <type.icon className="relative z-10 h-3.5 w-3.5 shrink-0" />}
              <span className="relative z-10">{type.label}</span>
            </m.button>
          );
        })}
      </div>
    </div>
  </div>
);

const EmptyStateView = ({ searchQuery, filterType, onReset }) => (
  <div className={cn(PANEL, 'p-4 sm:p-5')}>
    <Empty icon={Library}>
      <span className={cn(TITLE, 'block text-sm')}>No resources found</span>
      <span className="mt-1 block">
        {searchQuery
          ? 'Try different keywords or browse categories.'
          : "We're enriching our collection. Check back soon!"}
      </span>
    </Empty>
    {(searchQuery || filterType !== 'all') && (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="h-9 rounded-lg bg-[#5a63df] px-5 text-xs font-bold text-white transition-all hover:bg-[#4a52c9] active:scale-95"
        >
          Show all resources
        </button>
      </div>
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
    <div className="flex items-center justify-center gap-2 pb-2 pt-2">
      <button
        disabled={isFirst}
        onClick={() => goTo(pagination.page - 1)}
        className="h-9 rounded-lg border border-[#e2e5f2] px-3.5 text-xs font-bold text-slate-500 transition-all duration-150 hover:border-[#c9cdf3] hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:text-slate-400 dark:hover:text-white"
      >
        ← Prev
      </button>

      <div className="flex items-center gap-1">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i + 1)}
            className={cn(
              NUM,
              'h-9 w-9 rounded-lg text-xs font-bold transition-all duration-150',
              pagination.page === i + 1
                ? 'bg-[#5a63df] text-white'
                : 'border border-transparent text-slate-500 hover:border-[#e2e5f2] hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-white'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <span className={cn(MICRO, MUTED, 'hidden px-1 sm:inline')}>
        {pagination.page} / {totalPages}
      </span>

      <button
        disabled={isLast}
        onClick={() => goTo(pagination.page + 1)}
        className="h-9 rounded-lg border border-[#e2e5f2] px-3.5 text-xs font-bold text-slate-500 transition-all duration-150 hover:border-[#c9cdf3] hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:text-slate-400 dark:hover:text-white"
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
  user,
  allVocabulary,
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
          user={user}
          allVocabulary={allVocabulary}
        />
      );
    }
    return (
      <FilteredGridView
        resources={resources}
        filterType={filterType}
        onOpen={handleOpenResource}
        user={user}
        allVocabulary={allVocabulary}
      />
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
  const { user } = useAuth();
  const vocabulary = useVocabularyData(user);

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
        user={user}
        allVocabulary={vocabulary.allVocabulary}
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
