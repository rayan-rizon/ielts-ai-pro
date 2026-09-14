import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Kit3DIcon, { getKitTheme } from '@/features/vocabulary/components/Kit3DIcons';
import ContentStatusBadge from '@/features/subscription/components/ContentStatusBadge';
import { getContentStatus } from '@/features/subscription/config/contentAccess';
import { getVocabularyKitProgress } from '@/features/vocabulary/utils/kitProgress';
import { cn } from '@/lib/cn';
import RecommendationBadge from '@/features/recommendations/RecommendationBadge';

const KitCard = memo(function KitCard({
  kit,
  index = 0,
  user,
  allVocabulary = [],
  recommendation,
}) {
  const theme = useMemo(() => getKitTheme(kit), [kit]);
  const itemCount = kit.word_count || kit.words?.length || 10;
  const estimatedTime = useMemo(() => Math.max(5, Math.ceil(itemCount * 0.55)), [itemCount]);
  const progress = useMemo(
    () => getVocabularyKitProgress(kit, allVocabulary),
    [allVocabulary, kit]
  );
  const status = getContentStatus({
    user,
    requiredTier: kit.access_tier,
    completed: progress.isComplete,
  });

  const cleanTitle = useMemo(() => {
    return (kit.title || '')
      .replace(/^IELTS\s+(Speaking|Reading|Writing):\s*/i, '')
      .replace(/\s+Vocabulary\s+for\s+IELTS$/i, '')
      .replace(/\s+Vocabulary\s+Builder$/i, ' Builder');
  }, [kit.title]);

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.985, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.985, y: 4 }}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.015, 0.12),
      }}
      className="h-full transform-gpu"
    >
      <Link
        to={`/vocabulary/kits/${kit.slug || kit.id}`}
        aria-label={`Open ${cleanTitle}, ${kit.category}, ${status.label}${recommendation ? ', recommended from your results' : ''}`}
        className={cn(
          'group flex h-full min-h-[164px] flex-col justify-between rounded-xl border bg-linear-to-br/srgb p-3.5 text-left transition-all duration-200 ease-smooth-out hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.99] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:from-white/[0.035] dark:to-white/1.5 dark:focus-visible:ring-offset-[#100f15]',
          recommendation ? 'border-[#5a63df]/40 shadow-xs dark:border-[#8f97ff]/40' : theme.border,
          theme.panel,
          theme.hoverGlow
        )}
      >
        <div>
          {/* Top Bar: illustration plus learner-specific status. */}
          <div className="flex items-start justify-between gap-2">
            <span className="relative flex h-12 w-18 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/80 p-1 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
              <div className="flex h-full w-full items-center justify-center p-0.5 scale-105">
                <Kit3DIcon kit={kit} />
              </div>
            </span>
            <ContentStatusBadge
              user={user}
              requiredTier={kit.access_tier}
              completed={progress.isComplete}
              className="shrink-0"
            />
          </div>

          {/* Category Tag & Recommendation */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {recommendation && <RecommendationBadge recommendation={recommendation} />}
            <span className={cn('text-[9px] font-extrabold uppercase tracking-widest', theme.tag)}>
              {kit.category || 'Vocabulary Kit'}
            </span>
          </div>

          {/* Cleaned Kit Title */}
          <h3 className="mt-0.5 text-xs font-extrabold leading-4 text-slate-900 transition-colors duration-200 ease-smooth-out group-hover:text-[#5a63df] dark:text-white dark:group-hover:text-indigo-300">
            {cleanTitle}
          </h3>

          {/* Description - 1 line */}
          {(kit.subtitle || kit.description) && (
            <p className="mt-1 line-clamp-1 text-[10px] font-medium leading-4 text-slate-500 dark:text-slate-400">
              {kit.subtitle || kit.description}
            </p>
          )}
        </div>

        {/* Footer Meta: Time & Arrow Right */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3 text-slate-400" /> {estimatedTime} min
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 transition-all duration-200 ease-smooth-out group-hover:translate-x-0.5',
              theme.arrow
            )}
          >
            Open <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
});

export default KitCard;
