import { useState, useEffect, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Video,
  FileText,
  BookOpen,
  Eye,
  Play,
  ArrowRight,
  X,
  LayoutGrid,
  List,
  Library,
  Brain,
  Lock,
  Download,
  ChevronRight,
} from 'lucide-react';
import { Resource } from '@/entities';
import { cn } from '@/lib/cn';
import { useResources } from '@/features/learning/hooks/useResources';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

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

  const thumbnail = getThumbnail();

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col h-full rounded-2xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-white/[0.06] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:border-rose-500/20 dark:hover:border-rose-500/30 transition-all duration-300"
      onClick={() => onOpen(resource)}
    >
      {/* 16:9 Thumbnail - Standard aspect ratio for YouTube video thumbs */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-white/5">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-500/10 to-orange-500/5">
            <Video className="w-10 h-10 text-rose-400/40" />
          </div>
        )}

        {/* Play overlay - Made more compact */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/15 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center shadow-xl scale-0 group-hover:scale-100 transition-transform duration-300 ease-out border border-white/20 dark:border-white/5">
            <Play className="w-5 h-5 text-rose-600 fill-rose-600 ml-1" />
          </div>
        </div>

        {/* Badge - Tighter */}
        <div className="absolute top-3 left-3">
          <Badge className="px-2.5 py-0.7 rounded-md border-none text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md bg-rose-500/90 text-white">
            Video
          </Badge>
        </div>

        {/* Watch hint */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
          <div className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black tracking-wider text-white flex items-center gap-1.5 shadow-lg border border-white/10">
            <Play className="w-2.5 h-2.5 fill-white" />
            Watch Now
          </div>
        </div>
      </div>

      {/* Content area - Gorgeous & Readable */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-3 line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-200">
          {resource.title}
        </h3>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
            <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-xs">{resource.view_count || 0}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-rose-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:gap-1.5 transition-all duration-200">
            Watch Now
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── PDF "Book Cover" Card ────────────────────────────────────
const PDFResourceCard = ({ resource, onOpen }) => {
  const thumbnail = resource.thumbnail_url;

  return (
    <motion.div
      whileHover={{ y: -6, rotateY: 2 }}
      className="group relative flex flex-col items-center cursor-pointer"
      onClick={() => onOpen(resource)}
      style={{ perspective: '800px' }}
    >
      {/* Book cover */}
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-500 border border-slate-200/50 dark:border-white/10">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-6 text-center relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />

            <FileText className="w-10 h-10 text-white/30 mb-4" />
            <h4 className="text-sm font-black text-white leading-tight line-clamp-4 drop-shadow-lg">
              {resource.title}
            </h4>
            <div className="mt-auto pt-4">
              <div className="w-10 h-0.5 bg-white/30 rounded-full mx-auto" />
            </div>
            <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest mt-2">
              IELTS Study Guide
            </p>
          </div>
        )}

        {/* Spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-black/20 via-black/10 to-black/20" />

        {/* Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="px-2 py-0.5 rounded-md border-none text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md bg-blue-500/90 text-white">
            PDF
          </Badge>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent flex items-end px-3 pb-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/90 uppercase tracking-wider group-hover:gap-2 transition-all">
            <Download className="w-3 h-3" />
            Read Guide
          </div>
        </div>
      </div>

      {/* Meta below book */}
      <div className="w-full pt-4 px-1 text-center flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 mb-2">
          {resource.title}
        </h3>
        <div className="mt-auto flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
          <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span className="text-xs">{resource.view_count || 0} views</span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Article Card ──────────────────────────────────────────────
const ArticleResourceCard = ({ resource, onOpen }) => {
  const thumbnail = resource.thumbnail_url;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="group flex gap-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/50 dark:border-white/[0.06] cursor-pointer hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
      onClick={() => onOpen(resource)}
    >
      {/* Thumbnail or icon */}
      <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200/30 dark:border-emerald-500/10 flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <BookOpen className="w-8 h-8 text-emerald-400/50" />
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="px-2 py-0.5 rounded-md border-none text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Article
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {resource.title}
          </h3>
          {resource.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5 font-medium">
              {resource.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
            <Eye className="w-2.5 h-2.5" />
            <span className="text-[10px] font-bold">{resource.view_count || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 group-hover:gap-1.5 transition-all">
            Read
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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
    <motion.div
      whileHover={{ y: -3 }}
      className="group flex flex-col p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/50 dark:border-white/[0.06] cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
      onClick={() => onOpen(resource)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center flex-shrink-0 border border-indigo-200/30 dark:border-indigo-500/10">
          <Brain className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {resource.title}
          </h3>
          {resource.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5 font-medium">
              {resource.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
            {wordCount} words
          </span>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-300">
            <Eye className="w-2.5 h-2.5" />
            <span className="text-[10px] font-bold">{resource.view_count || 0}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:gap-1.5 transition-all">
          Study
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
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
const SectionHeader = ({ icon: Icon, title, count, color, onViewAll }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center justify-between mb-6"
  >
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shadow-sm',
          color === 'rose' && 'bg-rose-500/10 text-rose-500',
          color === 'blue' && 'bg-blue-500/10 text-blue-500',
          color === 'emerald' && 'bg-emerald-500/10 text-emerald-500',
          color === 'indigo' && 'bg-indigo-500/10 text-indigo-500'
        )}
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
          color === 'rose' && 'text-rose-500',
          color === 'blue' && 'text-blue-500',
          color === 'emerald' && 'text-emerald-500',
          color === 'indigo' && 'text-indigo-500'
        )}
      >
        View All
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    )}
  </motion.div>
);

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
    <div className="space-y-14">
      {/* Videos Section */}
      {videos.length > 0 && (
        <section>
          <SectionHeader
            icon={Video}
            title="Video Lessons"
            count={videos.length}
            color="rose"
            onViewAll={() => onViewAll('video')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.slice(0, 4).map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <VideoResourceCard resource={resource} onOpen={onOpen} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* PDFs Section */}
      {pdfs.length > 0 && (
        <section>
          <SectionHeader
            icon={FileText}
            title="Study Guides & Books"
            count={pdfs.length}
            color="blue"
            onViewAll={() => onViewAll('pdf')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {pdfs.slice(0, 6).map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <PDFResourceCard resource={resource} onOpen={onOpen} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Articles Section */}
      {articles.length > 0 && (
        <section>
          <SectionHeader
            icon={BookOpen}
            title="Reading Materials"
            count={articles.length}
            color="emerald"
            onViewAll={() => onViewAll('blog')}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.slice(0, 4).map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <ArticleResourceCard resource={resource} onOpen={onOpen} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Vocabulary Section */}
      {vocabs.length > 0 && (
        <section>
          <SectionHeader
            icon={Brain}
            title="Vocabulary Lists"
            count={vocabs.length}
            color="indigo"
            onViewAll={() => onViewAll('vocabulary')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vocabs.slice(0, 3).map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
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
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6';
      case 'blog':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      case 'vocabulary':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
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

// ─── Main Component ────────────────────────────────────────────
const ResourcesSection = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [pagination, setPagination] = useState({ page: 1, limit: 24 });
  const [selectedVocab, setSelectedVocab] = useState(null);
  const [isVocabDialogOpen, setIsVocabDialogOpen] = useState(false);

  // Prepare query params
  const queryFilters = {
    is_published: true,
    ...(filterType !== 'all' && { content_type: filterType }),
    ...(debouncedSearchQuery && { searchQuery: debouncedSearchQuery }),
  };

  const { data, isLoading } = useResources({
    filters: queryFilters,
    orderBy: '-created_at',
    limit: pagination.limit,
    page: pagination.page,
    includeContent: true,
  });

  const resources = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pagination.limit);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && type !== filterType) {
      setFilterType(type);
      setPagination((p) => ({ ...p, page: 1 }));
    } else if (!type && filterType !== 'all') {
      setFilterType('all');
    }
  }, [searchParams, filterType]);

  // Reset pagination on search change
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearchQuery]);

  const handleOpenResource = async (resource) => {
    await Resource.incrementViewCount(resource.id);
    if (resource.content_type === 'blog' && resource.slug) {
      navigate(`/blog/${resource.slug}`);
    } else if (resource.content_type === 'vocabulary') {
      setSelectedVocab(resource);
      setIsVocabDialogOpen(true);
    } else {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewAllType = (type) => {
    setFilterType(type);
    setPagination((p) => ({ ...p, page: 1 }));
    searchParams.set('type', type);
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-10">
      {/* Premium Controls */}
      <div className="sticky top-6 z-40">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-2 rounded-[2rem] shadow-2xl shadow-slate-900/5 dark:shadow-black/50 border border-white/50 dark:border-white/10 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-all duration-300 group-focus-within:scale-110" />
            </div>
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/[0.12] h-12 rounded-xl focus:ring-indigo-500/20 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
              data-oid="55e9m42"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/[0.12] w-full lg:w-auto overflow-x-auto no-scrollbar">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setFilterType(type.id);
                  setPagination((p) => ({ ...p, page: 1 }));
                  if (type.id === 'all') {
                    searchParams.delete('type');
                  } else {
                    searchParams.set('type', type.id);
                  }
                  setSearchParams(searchParams);
                }}
                className={cn(
                  'flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[9px] font-black transition-all duration-300 whitespace-nowrap min-w-0 flex-1 lg:flex-none uppercase tracking-[0.15em]',
                  filterType === type.id
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-105 active:scale-95'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10'
                )}
              >
                {type.icon && <type.icon className="w-3.5 h-3.5" />}
                {type.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-5 px-8 border-l border-slate-200 dark:border-white/10 h-8">
            <div className="flex items-center gap-2.5 text-indigo-500 cursor-pointer group/view">
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Grid</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 dark:text-slate-700 cursor-not-allowed">
              <List className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest">List</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filterType + debouncedSearchQuery + pagination.page}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
        >
          {isLoading ? (
            <ResourcesSkeleton />
          ) : resources.length > 0 ? (
            filterType === 'all' && !debouncedSearchQuery ? (
              <SegmentedAllView
                resources={resources}
                onOpen={handleOpenResource}
                onViewAll={handleViewAllType}
              />
            ) : (
              <FilteredGridView
                resources={resources}
                filterType={filterType}
                onOpen={handleOpenResource}
              />
            )
          ) : (
            <div
              className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/60 dark:border-white/[0.12] shadow-2xl relative z-10"
              data-oid="-w7141x"
            >
              <div className="w-32 h-32 bg-slate-100/50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <Library className="w-14 h-14 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                Quiet in the Library
              </h3>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-10 max-w-lg mx-auto leading-relaxed">
                {searchQuery
                  ? "We couldn't find any resources matching your search. Try different keywords or browse our main categories."
                  : "We're currently enriching our collection of specialized IELTS materials. Check back soon for fresh content!"}
              </p>
              {(searchQuery || filterType !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    searchParams.delete('type');
                    setSearchParams(searchParams);
                  }}
                  className="rounded-3xl h-16 px-12 font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all text-base border-0"
                >
                  Reset Knowledge Base
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-10 pt-16 md:pt-20 pb-10 w-full px-2">
          {/* Mobile Navigation */}
          <div className="flex sm:hidden w-full justify-between items-center mb-2 px-2">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => {
                setPagination((p) => ({ ...p, page: p.page - 1 }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-xl h-10 px-4 font-bold uppercase tracking-widest text-[10px] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pagination.page >= totalPages}
              onClick={() => {
                setPagination((p) => ({ ...p, page: p.page + 1 }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-xl h-10 px-4 font-bold uppercase tracking-widest text-[10px] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
            >
              Next
            </Button>
          </div>

          <Button
            variant="ghost"
            disabled={pagination.page <= 1}
            onClick={() => {
              setPagination((p) => ({ ...p, page: p.page - 1 }));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:flex rounded-2xl h-12 md:h-14 px-6 md:px-10 font-bold uppercase tracking-widest text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
          >
            Previous
          </Button>

          <div className="flex items-center justify-center gap-1.5 md:gap-3 flex-wrap max-w-full px-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPagination((p) => ({ ...p, page: i + 1 }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={cn(
                  'w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all relative overflow-hidden',
                  pagination.page === i + 1
                    ? 'bg-indigo-600 text-white shadow-xl md:shadow-2xl shadow-indigo-600/30 scale-[1.05] active:scale-95 z-10'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            disabled={pagination.page >= totalPages}
            onClick={() => {
              setPagination((p) => ({ ...p, page: p.page + 1 }));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:flex rounded-2xl h-12 md:h-14 px-6 md:px-10 font-bold uppercase tracking-widest text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
          >
            Next
          </Button>
        </div>
      )}

      {/* Vocabulary Study Dialog */}
      <Dialog open={isVocabDialogOpen} onOpenChange={setIsVocabDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-none p-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl">
          {selectedVocab && <VocabularyStudyView resource={selectedVocab} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-component for structured study view
const VocabularyStudyView = ({ resource }) => {
  const [words, setWords] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (resource.content) {
      try {
        setWords(JSON.parse(resource.content));
      } catch (e) {
        console.error('Parse error', e);
      }
    }
  }, [resource]);

  const hasAccess = () => {
    if (resource.access_tier === 'free') return true;
    if (!user) return false;
    const tiers = { free: 0, pro: 1, premium: 2 };
    return tiers[user.subscription_tier || 'free'] >= tiers[resource.access_tier];
  };

  if (!hasAccess()) {
    return (
      <div className="p-12 text-center space-y-8">
        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-indigo-500/5">
          <Lock className="w-10 h-10 text-indigo-500" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Premium Content
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
            This {resource.access_tier} vocabulary list is locked. Upgrade your plan to access this
            and {resource.access_tier === 'pro' ? 'hundreds' : 'thousands'} of other curated
            materials.
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = '/pricing')}
          className="h-16 px-12 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20"
        >
          View Pricing Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-6 border-b border-slate-100 dark:border-white/5">
        <div className="flex justify-between items-start gap-6">
          <div className="space-y-1">
            <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2">
              IELTS Vocabulary List
            </Badge>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white italic">
              {resource.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
              {resource.description}
            </p>
          </div>
        </div>
      </div>

      {/* Word List */}
      <div className="p-6 md:p-8 space-y-4">
        {words.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-all duration-300 relative"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8">
              {/* Word & Definition */}
              <div className="space-y-1.5 md:w-5/12 flex-shrink-0">
                <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {item.word}
                </h4>
                <p className="text-[14px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {item.definition}
                </p>
              </div>

              {/* Divider */}
              <div className="md:w-[2px] md:h-12 bg-slate-100 dark:bg-white/10 hidden md:block rounded-full" />

              {/* Example Sentence */}
              <div className="flex-1 md:w-5/12">
                <p className="text-[13px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                  &quot;{item.example}&quot;
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default memo(ResourcesSection);
