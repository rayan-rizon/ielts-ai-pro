import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Resource } from '@/features/learning/services/Resource';
import { createPageUrl } from '@/utils';
import { Empty, MICRO, MUTED, NUM, PANEL, PanelTitle, SectionLabel, WELL } from './primitives';

const StudyResourcesHub = React.memo(
  ({ initialResources = [], isLoading: parentLoading = false }) => {
    const [expanded, setExpanded] = useState(true);
    const navigate = useNavigate();

    const resources = initialResources || [];
    const videos = resources.filter((r) => r.content_type === 'video').slice(0, 3);
    const books = resources.filter((r) => r.content_type === 'pdf').slice(0, 4);

    const openResource = (resource) => {
      Resource.incrementViewCount(resource.id);
      if (resource.content_type === 'blog' && resource.slug) {
        navigate(`/blog/${resource.slug}`);
      } else {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      }
    };

    const videoThumbnail = (item) => {
      if (item.thumbnail_url) return item.thumbnail_url;
      const embed = Resource.getVideoEmbedInfo(item.url);
      return embed?.type === 'youtube'
        ? `https://img.youtube.com/vi/${embed.id}/mqdefault.jpg`
        : null;
    };

    const VideoRow = ({ item }) => {
      const thumbnail = videoThumbnail(item);
      return (
        <button
          type="button"
          onClick={() => openResource(item)}
          className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition-all duration-150 hover:border-[#e4e2f0] hover:bg-[#f7f6fd] active:scale-[0.99] dark:hover:border-white/[0.07] dark:hover:bg-white/[0.03]"
        >
          <div
            className={cn(
              WELL,
              'relative h-10 w-16 shrink-0 overflow-hidden rounded-md border border-[#e4e2f0] dark:border-white/[0.07]'
            )}
          >
            {thumbnail ? (
              <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : null}
            <span className="absolute inset-0 grid place-items-center bg-black/15 transition-colors group-hover:bg-black/25">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-[12px] font-extrabold leading-tight text-slate-800 dark:text-slate-100">
              {item.title}
            </h4>
            <p className={cn(MICRO, MUTED, 'mt-1')}>
              <span className={cn(NUM, 'font-bold')}>{item.view_count || 0}</span> views
            </p>
          </div>

          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-[#5a63df] dark:text-slate-600" />
        </button>
      );
    };

    const BookTile = ({ item }) => (
      <button
        type="button"
        onClick={() => openResource(item)}
        className="group flex flex-col gap-2 rounded-lg border border-transparent p-2 text-left transition-all duration-150 hover:border-[#e4e2f0] hover:bg-[#f7f6fd] active:scale-[0.99] dark:hover:border-white/[0.07] dark:hover:bg-white/[0.03]"
      >
        <div
          className={cn(
            WELL,
            'relative aspect-[3/4] w-full overflow-hidden rounded-md border border-[#e4e2f0] dark:border-white/[0.07]'
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
              <FileText className="h-5 w-5 text-[#5a63df]/40" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="line-clamp-2 text-[11px] font-extrabold leading-tight text-slate-800 dark:text-slate-100">
            {item.title}
          </h4>
          <p className={cn(MICRO, MUTED, 'mt-1')}>
            <span className={cn(NUM, 'font-bold')}>{item.view_count || 0}</span> reads
          </p>
        </div>
      </button>
    );

    return (
      <div className={cn(PANEL, 'p-4')}>
        <PanelTitle
          label="Study library"
          tip="Videos and guides, most-viewed first."
          action={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(createPageUrl('Resources'))}
                className={cn(
                  MICRO,
                  'inline-flex items-center gap-0.5 text-slate-500 transition-colors hover:text-[#5a63df] dark:text-slate-400'
                )}
              >
                Full library <ChevronRight className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className={cn(
                  MICRO,
                  'inline-flex items-center gap-1 text-slate-500 transition-colors hover:text-[#5a63df] dark:text-slate-400'
                )}
              >
                {expanded ? 'Collapse' : 'Expand'}
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    expanded && 'rotate-180'
                  )}
                />
              </button>
            </div>
          }
        />

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="library"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              {parentLoading ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-2.5 w-32 rounded" />
                      <Skeleton className="h-14 w-full rounded-lg" />
                      <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div>
                    <SectionLabel className="mb-2">Video lessons</SectionLabel>
                    {videos.length > 0 ? (
                      <div className="space-y-1">
                        {videos.map((item) => (
                          <VideoRow key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <Empty className="py-6">No video lessons published yet.</Empty>
                    )}
                  </div>

                  <div>
                    <SectionLabel className="mb-2">Study guides</SectionLabel>
                    {books.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {books.map((item) => (
                          <BookTile key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <Empty className="py-6">No guides published yet.</Empty>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

StudyResourcesHub.displayName = 'StudyResourcesHub';

export default StudyResourcesHub;
