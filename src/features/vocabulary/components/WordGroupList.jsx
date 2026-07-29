import React, { memo, useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  FEATURED_VOCABULARY_KITS,
  VOCABULARY_KITS,
} from '@/features/vocabulary/data/vocabularyKits';

export const KitVisual = ({ id }) => {
  const uid = useId();

  if (id?.includes('writing')) {
    const penGrad = `penGrad-${uid}`;
    const paperGrad = `paperGrad-${uid}`;
    return (
      <svg className="w-full h-full shrink-0" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id={penGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id={paperGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EEF2FF" />
            <stop offset="100%" stopColor="#E0E7FF" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="6"
          width="18"
          height="22"
          rx="3"
          fill={`url(#${paperGrad})`}
          stroke="#c7d2fe"
          strokeWidth="1.2"
        />
        <path
          d="M8 12h10M8 16h7M8 20h9"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M26 4L16 22l-4 1 1-4L23 2l3 2z"
          fill={`url(#${penGrad})`}
          stroke="#3730a3"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx="21" cy="9" r="1" fill="#ffffff" />
        <path d="M27 18l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="#818cf8" />
      </svg>
    );
  }

  if (id?.includes('speaking')) {
    const micGrad = `micGrad-${uid}`;
    return (
      <svg className="w-full h-full shrink-0" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id={micGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect
          x="11"
          y="5"
          width="10"
          height="15"
          rx="5"
          fill={`url(#${micGrad})`}
          stroke="#047857"
          strokeWidth="1.2"
        />
        <path
          d="M7 14c0 4.97 4.03 9 9 9s9-4.03 9-9"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M16 23v5M12 28h8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="10" r="1.5" fill="#ffffff" opacity="0.8" />
        <path
          d="M4 14c0-3.5 1.5-6 3.5-7.5M28 14c0-3.5-1.5-6-3.5-7.5"
          stroke="#6ee7b7"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (id?.includes('reading')) {
    const lensGrad = `lensGrad-${uid}`;
    const handleGrad = `handleGrad-${uid}`;
    return (
      <svg className="w-full h-full shrink-0" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id={lensGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id={handleGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="4"
          width="20"
          height="24"
          rx="2.5"
          fill="#EFF6FF"
          stroke="#BFDBFE"
          strokeWidth="0.8"
        />
        <path
          d="M5 9h14M5 12h10M5 15h14M5 18h8"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle
          cx="20"
          cy="20"
          r="8"
          fill={`url(#${lensGrad})`}
          stroke="#0369a1"
          strokeWidth="1.2"
        />
        <circle cx="20" cy="20" r="5.2" fill="white" opacity="0.35" />
        <path
          d="M17.5 17.5c1-1 2.5-1.2 3.5-.5"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M26.5 26.5l-3.5-3.5"
          stroke={`url(#${handleGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M18 20h4M18 22.5h3"
          stroke="#0369a1"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    );
  }

  if (id?.includes('band-')) {
    const targetGrad = `targetGrad-${uid}`;
    return (
      <svg className="w-full h-full shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient
            id={targetGrad}
            x1="7"
            y1="6"
            x2="25"
            y2="26"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FEF3C7" />
            <stop offset="1" stopColor="#FDE68A" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="5"
          width="24"
          height="22"
          rx="7"
          fill={`url(#${targetGrad})`}
          stroke="#FCD34D"
        />
        <circle cx="16" cy="16" r="6.8" fill="#FFF" stroke="#F59E0B" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="3.4" fill="#F59E0B" />
        <circle cx="16" cy="16" r="1.35" fill="#FFF" />
        <path
          d="M22.5 9.5l3-3M23.8 6.5h1.8v1.8"
          stroke="#B45309"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M21.4 10.6l3.1-3.1" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (id?.includes('vocabulary-for-ielts')) {
    const globeGrad = `globeGrad-${uid}`;
    return (
      <svg className="w-full h-full shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient
            id={globeGrad}
            x1="7"
            y1="6"
            x2="25"
            y2="27"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FCE7F3" />
            <stop offset="1" stopColor="#FBCFE8" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="5"
          width="24"
          height="22"
          rx="7"
          fill={`url(#${globeGrad})`}
          stroke="#F9A8D4"
        />
        <circle cx="16" cy="15.5" r="7.2" fill="#FFF" stroke="#DB2777" strokeWidth="1.4" />
        <path
          d="M8.8 15.5h14.4M16 8.3c2.2 2 3.3 4.4 3.3 7.2s-1.1 5.2-3.3 7.2c-2.2-2-3.3-4.4-3.3-7.2S13.8 10.3 16 8.3z"
          stroke="#DB2777"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
        <path d="M11 23.8h10" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  const capGrad = `capGrad-${uid}`;
  return (
    <svg className="w-full h-full shrink-0" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id={capGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path
        d="M16 4L2 11l14 7 14-7L16 4z"
        fill={`url(#${capGrad})`}
        stroke="#5b21b6"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M7 14.5v7.5c0 3 4 5 9 5s9-2 9-5v-7.5"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M26 12v10l2 2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="26" cy="12" r="1.5" fill="#f59e0b" />
    </svg>
  );
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

const WordGroupList = memo(({ allVocabulary = [] }) => {
  const viewportRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const displayKits = [
    ...FEATURED_VOCABULARY_KITS,
    ...VOCABULARY_KITS.filter(
      (kit) => !FEATURED_VOCABULARY_KITS.some((featured) => featured.id === kit.id)
    ).slice(0, 4),
  ].map((kit, index) => {
    const savedWords = kit.words.filter((item) =>
      allVocabulary.some((saved) => saved?.word?.toLowerCase() === item.word.toLowerCase())
    ).length;
    return {
      ...kit,
      wordCount: kit.word_count,
      progressPercent: kit.word_count ? Math.round((savedWords / kit.word_count) * 100) : 0,
      theme: FALLBACK_THEMES[index % FALLBACK_THEMES.length],
    };
  });
  const scrollingKits = [...displayKits, ...displayKits];

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

  const scrollCarousel = (direction) => {
    viewportRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
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

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Show previous Vocabulary Kits"
            onClick={() => scrollCarousel(-1)}
            className="hidden h-8 w-8 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600 transition hover:bg-indigo-50 sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-indigo-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Show next Vocabulary Kits"
            onClick={() => scrollCarousel(1)}
            className="hidden h-8 w-8 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600 transition hover:bg-indigo-50 sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-indigo-300"
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
        className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    <span className="rounded-full bg-white/80 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300">
                      {kit.wordCount} items
                    </span>
                  </div>
                  <h4 className="mt-3 line-clamp-2 text-xs font-extrabold leading-4 text-slate-900 transition-colors group-hover:text-[#5661e9] dark:text-white dark:group-hover:text-indigo-300">
                    {kit.title}
                  </h4>
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] font-extrabold">
                    <span className="text-slate-400">{kit.progressPercent}% saved</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#5661e9] transition group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#eceef8] dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${theme.progressBar}`}
                      style={{ width: `${kit.progressPercent}%` }}
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
