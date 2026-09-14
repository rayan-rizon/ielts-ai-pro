import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Resource } from '@/features/learning/services/Resource';
import { createPageUrl } from '@/utils';
import {
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PANEL_LINK,
  PanelTitle,
  ROW_CHEVRON,
  ROW_HOVER,
  SectionLabel,
  WELL,
} from './primitives';

const videoThumbnail = (item) => {
  if (item.thumbnail_url) return item.thumbnail_url;
  const embed = Resource.getVideoEmbedInfo(item.url);
  return embed?.type === 'youtube' ? `https://img.youtube.com/vi/${embed.id}/mqdefault.jpg` : null;
};

// 16:9 thumbnail, not the old 40×64 sliver — a video is the richer resource
// here (highest view counts of anything in this panel) and was reading as the
// least prominent item on the page. Sized to land close to the guide column's
// total height at 3 rows, so neither column trails off into empty space.
const VideoRow = ({ item, onOpen }) => {
  const thumbnail = videoThumbnail(item);
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border border-slate-200/60 bg-white/40 p-2.5 text-left transition-all duration-200 ease-smooth-out hover:border-[#5a63df]/35 hover:bg-[#f7f6fd] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.99] active:translate-y-0 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-[#8f97ff]/30 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#08080a]'
      )}
    >
      <div
        className={cn(
          WELL,
          'relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border border-[#e4e2f0] transition-colors duration-200 ease-smooth-out group-hover:border-[#5a63df]/30 dark:border-white/9 dark:group-hover:border-[#8f97ff]/30'
        )}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 ease-smooth-out group-hover:scale-105"
          />
        ) : null}
        <span className="absolute inset-0 grid place-items-center bg-black/20 transition-colors group-hover:bg-black/30">
          <Play className="h-4 w-4 fill-white text-white transition-transform duration-200 ease-smooth-out group-hover:scale-110" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-[12px] font-extrabold leading-tight text-slate-800 transition-colors duration-200 ease-smooth-out group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#afb5ff]">
          {item.title}
        </h4>
        <p className={cn(MICRO, MUTED, 'mt-1.5')}>
          <span className={cn(NUM, 'font-bold')}>{item.view_count || 0}</span> views
        </p>
      </div>
      <ChevronRight className={cn('h-3.5 w-3.5', ROW_CHEVRON)} />
    </button>
  );
};

// 4/3, not the old 3/4 portrait — a 2×2 grid of squarer tiles reaches roughly
// the same total height as the three video rows beside it (see VideoRow),
// instead of a tall 4-across strip that made the shorter video list look
// unfinished by comparison.
const BookTile = ({ item, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(item)}
    className={cn(
      'group flex items-center gap-3 rounded-lg border border-slate-200/60 bg-white/40 p-2 text-left transition-all duration-200 ease-smooth-out hover:border-[#5a63df]/35 hover:bg-[#f7f6fd] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.99] active:translate-y-0 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-[#8f97ff]/30 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#08080a]'
    )}
  >
    <div
      className={cn(
        WELL,
        'relative aspect-4/3 w-20 shrink-0 overflow-hidden rounded-md border border-[#e4e2f0] dark:border-white/9'
      )}
    >
      {item.thumbnail_url ? (
        <img
          src={item.thumbnail_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="grid h-full w-full place-items-center">
          <FileText className="h-4 w-4 text-[#5a63df]/40 dark:text-[#8f97ff]/50" />
        </span>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <h4 className="line-clamp-2 text-[11px] font-extrabold leading-tight text-slate-800 transition-colors duration-200 ease-smooth-out group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#afb5ff]">
        {item.title}
      </h4>
      <p className={cn(MICRO, MUTED, 'mt-1.5')}>
        <span className={cn(NUM, 'font-bold')}>{item.view_count || 0}</span> reads
      </p>
    </div>
    <ChevronRight className={cn('h-3.5 w-3.5', ROW_CHEVRON)} />
  </button>
);

const LibraryActions = ({ expanded, onExpand, onOpenLibrary }) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={onOpenLibrary}
      className={cn(MICRO, PANEL_LINK, 'min-h-6 py-1 px-1.5 -my-1 -mx-1.5')}
    >
      Full library <ChevronRight className="h-3 w-3" />
    </button>
    <button
      type="button"
      onClick={onExpand}
      aria-expanded={expanded}
      aria-controls="study-library-content"
      className={cn(MICRO, PANEL_LINK, 'gap-1 min-h-6 py-1 px-1.5 -my-1 -mx-1.5')}
    >
      {expanded ? 'Collapse' : 'Expand'}
      <ChevronDown
        className={cn(
          'h-3 w-3 transition-transform duration-200 ease-smooth-out',
          expanded && 'rotate-180'
        )}
      />
    </button>
  </div>
);

const LibrarySkeleton = () => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {Array.from({ length: 2 }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton className="h-2.5 w-32 rounded" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

const ResourceLibrarySection = ({
  label,
  items,
  emptyMessage,
  listClassName,
  ItemComponent,
  onOpen,
}) => (
  <div>
    <SectionLabel className="mb-2">{label}</SectionLabel>
    {items.length > 0 ? (
      <div className={listClassName}>
        {items.map((item) => (
          <ItemComponent key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    ) : (
      <Empty className="py-6">{emptyMessage}</Empty>
    )}
  </div>
);

const LibraryContent = ({ isLoading, videos, guides, onOpen }) => {
  if (isLoading) return <LibrarySkeleton />;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ResourceLibrarySection
        label="Video lessons"
        items={videos}
        emptyMessage="No video lessons published yet."
        listClassName="space-y-1 p-1 -m-1"
        ItemComponent={VideoRow}
        onOpen={onOpen}
      />
      <ResourceLibrarySection
        label="Study guides"
        items={guides}
        emptyMessage="No guides published yet."
        listClassName="grid grid-cols-1 gap-1 p-1 -m-1 sm:grid-cols-2"
        ItemComponent={BookTile}
        onOpen={onOpen}
      />
    </div>
  );
};

const StudyResourcesHub = React.memo(
  ({ initialResources = [], isLoading: parentLoading = false }) => {
    const [expanded, setExpanded] = useState(true);
    const navigate = useNavigate();

    const resources = initialResources || [];
    const videos = resources.filter((r) => r.content_type === 'video').slice(0, 3);
    // 6, not 4 — three rows of the 2-column guide grid land close to the
    // three video rows beside it instead of stopping two rows short.
    const guides = resources.filter((r) => r.content_type === 'pdf').slice(0, 6);

    const openResource = useCallback(
      (resource) => {
        Resource.incrementViewCount(resource.id);
        if (resource.content_type === 'blog' && resource.slug) {
          navigate(`/blog/${resource.slug}`);
        } else {
          window.open(resource.url, '_blank', 'noopener,noreferrer');
        }
      },
      [navigate]
    );
    const openLibrary = useCallback(() => navigate(createPageUrl('Resources')), [navigate]);
    const toggleExpanded = useCallback(() => setExpanded((value) => !value), []);

    return (
      <div
        className={cn(
          PANEL,
          'p-4 transition-colors duration-200 ease-smooth-out hover:border-slate-300/80 dark:hover:border-white/15'
        )}
      >
        <PanelTitle
          label="Study library"
          tip="Videos and guides, most-viewed first."
          action={
            <LibraryActions
              expanded={expanded}
              onExpand={toggleExpanded}
              onOpenLibrary={openLibrary}
            />
          }
        />

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="library"
              id="study-library-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden -mx-1.5 px-1.5 -mt-1 pt-1.5 pb-1"
            >
              <LibraryContent
                isLoading={parentLoading}
                videos={videos}
                guides={guides}
                onOpen={openResource}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

StudyResourcesHub.displayName = 'StudyResourcesHub';

export default StudyResourcesHub;
