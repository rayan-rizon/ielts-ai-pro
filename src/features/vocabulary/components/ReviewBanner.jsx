import React, { useState, useEffect, useId } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Play, Volume2, ChevronLeft, ChevronRight, CheckCircle2, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { playPronunciation } from '../utils/audioUtils';
import { PANEL, Pill, TILE } from '@/features/dashboard/components/primitives';

const FEATURED_WORDS = [
  {
    word: 'meticulous',
    ipa: '/məsˈtɪkjələs/',
    pos: 'ADJECTIVE',
    definition: 'Showing great attention to detail; very careful and precise.',
    example: 'The researcher was meticulous in documenting every observation for the Band 8 essay.',
    band: 'Band 8.0+',
  },
  {
    word: 'persuasive',
    ipa: '/pəˈsweɪ.sɪv/',
    pos: 'ADJECTIVE',
    definition: 'Good at persuading someone to do or believe something through reasoning.',
    example: 'She presented a persuasive argument regarding environmental policy changes.',
    band: 'Band 8.5+',
  },
  {
    word: 'substantial',
    ipa: '/səbˈstæn.ʃəl/',
    pos: 'ADJECTIVE',
    definition: 'Considerable in amount, size, or worth; strongly built.',
    example: 'There has been a substantial increase in public transport usage over the decade.',
    band: 'Band 7.5+',
  },
  {
    word: 'accommodate',
    ipa: '/əˈkɒm.ə.deɪt/',
    pos: 'VERB',
    definition: 'To provide lodging or space for; fit in with the wishes or needs of.',
    example: 'The new urban plan will comfortably accommodate growing population demands.',
    band: 'Band 8.0+',
  },
  {
    word: 'inherent',
    ipa: '/ɪnˈhɪər.ənt/',
    pos: 'ADJECTIVE',
    definition: 'Existing in something as a permanent, essential, or characteristic attribute.',
    example: 'There are inherent risks involved in rapid industrial growth.',
    band: 'Band 8.5+',
  },
];

const ReviewEmblemSVG = () => {
  const uid = useId();
  const calGrad = `calGrad-${uid}`;
  const headerGrad = `headerGrad-${uid}`;

  return (
    <div className="w-11 h-11 rounded-2xl bg-linear-to-br/srgb from-[#efedff] to-[#e4e7ff] dark:from-indigo-500/20 dark:to-violet-500/10 ring-1 ring-[#5862df]/20 shadow-sm flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
      <svg className="w-full h-full shrink-0" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id={calGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id={headerGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
        </defs>
        {/* Calendar body */}
        <rect
          x="3"
          y="7"
          width="26"
          height="22"
          rx="3.5"
          fill={`url(#${calGrad})`}
          stroke="#4338ca"
          strokeWidth="0.8"
        />
        {/* Calendar header */}
        <rect x="3" y="7" width="26" height="8" rx="3.5" fill={`url(#${headerGrad})`} />
        <rect x="3" y="12" width="26" height="3" fill={`url(#${headerGrad})`} />
        {/* Binding pins */}
        <rect x="10" y="4" width="2.5" height="6" rx="1.25" fill="#a5b4fc" />
        <rect x="19.5" y="4" width="2.5" height="6" rx="1.25" fill="#a5b4fc" />
        {/* Grid dots */}
        <rect x="7" y="19" width="3.5" height="3" rx="0.8" fill="#c7d2fe" opacity="0.9" />
        <rect x="14.25" y="19" width="3.5" height="3" rx="0.8" fill="#c7d2fe" opacity="0.9" />
        <rect x="21.5" y="19" width="3.5" height="3" rx="0.8" fill="#c7d2fe" opacity="0.6" />
        {/* Spark accent */}
        <path
          d="M22 10l.8 1.8 1.8.8-1.8.8L22 15l-.8-1.8-1.8-.8 1.8-.8L22 10z"
          fill="#ffffff"
          opacity="0.95"
        />
      </svg>
    </div>
  );
};

export default function ReviewBanner({
  dueForReview = [],
  onStartReview,
  totalWords = 0,
  onAddWord,
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [addedFeatured, setAddedFeatured] = useState({});

  const hasDueItems = dueForReview.length > 0;
  const featured = FEATURED_WORDS[currentIdx];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % FEATURED_WORDS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % FEATURED_WORDS.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + FEATURED_WORDS.length) % FEATURED_WORDS.length);
  };

  const handleAudio = (e) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    playPronunciation(featured.word).finally(() => setIsPlayingAudio(false));
  };

  const handleAddFeatured = async (e) => {
    e.stopPropagation();
    if (!onAddWord) return;
    setAddedFeatured((prev) => ({ ...prev, [featured.word]: 'loading' }));
    try {
      const res = await onAddWord({
        word: featured.word,
        definition: featured.definition,
        example: featured.example,
      });
      if (res?.success || res) {
        setAddedFeatured((prev) => ({ ...prev, [featured.word]: true }));
      }
    } catch {
      setAddedFeatured((prev) => ({ ...prev, [featured.word]: false }));
    }
  };

  const clearedPercent =
    totalWords > 0 ? Math.round(((totalWords - dueForReview.length) / totalWords) * 100) : 100;

  return (
    <div className={cn(PANEL, 'group relative overflow-hidden p-5 sm:p-6')}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#5a63df]/10 blur-2xl" />
      <div className="relative z-10 grid grid-cols-1 items-center gap-5 xl:grid-cols-12">
        <div className="space-y-3.5 xl:col-span-6">
          <div className="flex flex-wrap items-center gap-3">
            <ReviewEmblemSVG />
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-2xl whitespace-nowrap">
                Daily Review
              </h2>
              <Pill tone="accent">Smart review</Pill>
            </div>
          </div>

          <p
            className={cn(
              'max-w-md text-xs font-medium leading-relaxed sm:text-sm',
              'text-slate-500 dark:text-slate-400'
            )}
          >
            Strengthen retention with spaced repetition.
          </p>

          <div className="max-w-md space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>
                {dueForReview.length} of {totalWords > 0 ? totalWords : 30} items
              </span>
              <span className="font-extrabold text-[#5a63df] dark:text-indigo-400">
                {clearedPercent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f4f3fb] dark:bg-white/10">
              <div
                className="h-full rounded-full bg-[#5a63df] transition-all duration-700"
                style={{
                  width: `${totalWords > 0 ? Math.max(8, clearedPercent) : 80}%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button
              onClick={onStartReview}
              disabled={!hasDueItems}
              className={cn(
                'flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-5 text-xs font-bold transition-all',
                hasDueItems
                  ? 'bg-[#5a63df] text-white hover:bg-[#4a52c9] active:scale-[0.98]'
                  : 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-800'
              )}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {hasDueItems ? `Start review session (${dueForReview.length})` : 'Review Queue Clear'}
            </Button>
          </div>
        </div>

        <div className="xl:col-span-6">
          <div
            className={cn(
              TILE,
              'group/featured relative flex min-h-[210px] flex-col justify-between overflow-hidden p-4'
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 pb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5a63df] dark:text-indigo-400">
                Featured word
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                  title="Previous word"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                  title="Next word"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="my-0.5 flex flex-1 flex-col justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <m.div
                  key={featured.word}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold tracking-tight text-[#5a63df] dark:text-indigo-300 sm:text-2xl">
                          {featured.word}
                        </h3>
                        <button
                          onClick={handleAudio}
                          className={cn(
                            'rounded-full p-1 text-[#5a63df] transition-colors hover:bg-[#5a63df]/10',
                            isPlayingAudio && 'animate-pulse text-amber-500'
                          )}
                          title="Listen audio pronunciation"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-xs text-slate-500">
                        <span className="whitespace-nowrap">{featured.ipa}</span>
                        <Pill tone="accent">{featured.pos}</Pill>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAddFeatured}
                      disabled={addedFeatured[featured.word] === true}
                      className="h-8 shrink-0 whitespace-nowrap rounded-lg border border-[#e2e5f2] bg-slate-100 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-[#5a63df]/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                    >
                      {addedFeatured[featured.word] === true ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" /> Saved
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="mr-1 h-3.5 w-3.5 text-[#5a63df]" /> Add to Bank
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                    {featured.definition}
                  </p>

                  <div className="flex items-center gap-1 truncate text-[11px] leading-normal text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-[#5a63df]">&quot;</span>
                    <span className="truncate italic">{featured.example}</span>
                  </div>
                </m.div>
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center justify-center gap-1.5 pt-1">
              {FEATURED_WORDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === currentIdx ? 'w-5 bg-[#5a63df]' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
