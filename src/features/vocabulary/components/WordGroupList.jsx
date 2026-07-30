import React, { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  FEATURED_VOCABULARY_KITS,
  VOCABULARY_KITS,
} from '@/features/vocabulary/data/vocabularyKits';

import Kit3DIcon from '@/features/vocabulary/components/Kit3DIcons';
import ContentStatusBadge from '@/features/subscription/components/ContentStatusBadge';
import { getVocabularyKitProgress } from '@/features/vocabulary/utils/kitProgress';

export const KitVisual = ({ id, kit }) => {
  return <Kit3DIcon kit={kit} id={id} />;
};

const THEMES = {
  indigo: {
    iconBg:
      'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-300 shadow-sm',
    progressBar: 'bg-[#5661e9]',
  },
  emerald: {
    iconBg:
      'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 shadow-sm',
    progressBar: 'bg-emerald-500',
  },
  sky: {
    iconBg:
      'bg-sky-50 text-sky-600 ring-1 ring-sky-200/70 dark:bg-sky-500/15 dark:text-sky-300 shadow-sm',
    progressBar: 'bg-sky-500',
  },
  violet: {
    iconBg:
      'bg-violet-50 text-violet-600 ring-1 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300 shadow-sm',
    progressBar: 'bg-violet-500',
  },
};

const FALLBACK_THEMES = [THEMES.indigo, THEMES.emerald, THEMES.sky, THEMES.violet];

const WordGroupList = memo(({ allVocabulary = [], user }) => {
  const viewportRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const displayKits = [
    ...FEATURED_VOCABULARY_KITS,
    ...VOCABULARY_KITS.filter(
      (kit) => !FEATURED_VOCABULARY_KITS.some((featured) => featured.id === kit.id)
    ).slice(0, 4),
  ].map((kit, index) => {
    const progress = getVocabularyKitProgress(kit, allVocabulary);
    return {
      ...kit,
      wordCount: kit.word_count,
      progress,
      theme: FALLBACK_THEMES[index % FALLBACK_THEMES.length],
    };
  });
  const scrollingKits = [...displayKits, ...displayKits];

  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || isPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const loopPoint = viewport.scrollWidth / 2;
      if (viewport.scrollLeft >= loopPoint - 1) {
        viewport.scrollLeft = 0;
      } else {
        viewport.scrollLeft += 0.45;
      }
    }, 32);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const scrollCarousel = (direction) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    setIsPaused(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    const step = 230;
    const loopPoint = viewport.scrollWidth / 2;

    if (direction < 0 && viewport.scrollLeft <= 10) {
      viewport.scrollLeft = loopPoint;
    } else if (direction > 0 && viewport.scrollLeft >= loopPoint - 10) {
      viewport.scrollLeft = 0;
    }

    viewport.scrollBy({ left: direction * step, behavior: 'smooth' });

    scrollTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  };

  return (
    <section className="space-y-3" aria-labelledby="smart-vocabulary-kits">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#efedff] text-[#5862df] dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center ring-1 ring-[#5862df]/15 shadow-xs">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <h3
              id="smart-vocabulary-kits"
              className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              Smart Vocabulary Kits
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Explore focused kits while the shelf gently moves.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Show previous Vocabulary Kits"
            onClick={() => scrollCarousel(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-2xs transition hover:bg-indigo-50 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300 dark:hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Show next Vocabulary Kits"
            onClick={() => scrollCarousel(1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-2xs transition hover:bg-indigo-50 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300 dark:hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Link
            to="/vocabulary/kits"
            className="inline-flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-bold text-[#5661e9] transition-colors hover:bg-[#efedff] dark:text-indigo-300 dark:hover:bg-indigo-950/50"
          >
            All kits <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div
        ref={viewportRef}
        role="region"
        aria-label="Slow-moving Vocabulary Kits carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
        }}
        className="-mx-1 flex gap-2.5 overflow-x-auto scroll-smooth px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {scrollingKits.map((kit, index) => {
          const theme = kit.theme || FALLBACK_THEMES[0];
          const isClone = index >= displayKits.length;

          return (
            <motion.div
              key={`${kit.id}-${index}`}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              aria-hidden={isClone}
              className="group w-[180px] shrink-0 snap-start rounded-2xl border border-[#eceafa] bg-gradient-to-br from-[#fdfcff] to-[#f3efff] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_16px_32px_-24px_rgba(59,70,150,0.65)] dark:border-white/10 dark:from-white/[0.035] dark:to-white/[0.015] sm:w-[192px]"
            >
              <Link
                to={`/vocabulary/kits/${kit.slug}`}
                tabIndex={isClone ? -1 : undefined}
                aria-label={`Open ${kit.title}, ${kit.category}`}
                className="flex h-[132px] flex-col justify-between p-3.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl p-0.5 ${theme.iconBg}`}
                    >
                      <KitVisual id={kit.id} />
                    </div>
                    <ContentStatusBadge
                      user={user}
                      requiredTier={kit.access_tier}
                      completed={kit.progress.isComplete}
                    />
                  </div>
                  <h4 className="mt-3 line-clamp-2 text-xs font-extrabold leading-4 text-slate-900 transition-colors group-hover:text-[#5661e9] dark:text-white dark:group-hover:text-indigo-300">
                    {kit.title}
                  </h4>
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] font-extrabold">
                    <span className="text-slate-400">
                      {kit.progress.savedCount}/{kit.wordCount} saved
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#5661e9] transition group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#eceef8] dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${theme.progressBar}`}
                      style={{ width: `${kit.progress.percent}%` }}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
});

WordGroupList.displayName = 'WordGroupList';

export default WordGroupList;
