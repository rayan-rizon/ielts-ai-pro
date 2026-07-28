import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Volume2, ChevronLeft, ChevronRight, CheckCircle2, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { playPronunciation } from '../utils/audioUtils';

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

const ReviewEmblemSVG = () => (
  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#efedff] to-[#e4e7ff] dark:from-indigo-500/20 dark:to-violet-500/10 ring-1 ring-[#5862df]/20 shadow-sm flex items-center justify-center shrink-0">
    <svg className="w-5.5 h-5.5" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
        fill="url(#calGrad)"
        stroke="#4338ca"
        strokeWidth="0.8"
      />
      {/* Calendar header */}
      <rect x="3" y="7" width="26" height="8" rx="3.5" fill="url(#headerGrad)" />
      <rect x="3" y="12" width="26" height="3" fill="url(#headerGrad)" />
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
    <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] text-slate-900 dark:text-white p-6 sm:p-7 border border-[#e0e4f1] dark:border-white/10 shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] group">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#505bdd]/10 blur-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left Side: Daily Review Queue */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <ReviewEmblemSVG />
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                Daily Review
              </h2>
              <Badge
                variant="outline"
                className="px-2.5 py-0.5 rounded-md bg-[#efedff] dark:bg-indigo-950/60 border-none text-[#505bdd] dark:text-indigo-300 font-black text-[10px] uppercase tracking-wider"
              >
                SMART REVIEW
              </Badge>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold leading-relaxed max-w-md">
            Strengthen retention with spaced repetition.
          </p>

          {/* Progress Bar */}
          <div className="space-y-1.5 max-w-md pt-1">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>
                {dueForReview.length} of {totalWords > 0 ? totalWords : 30} items
              </span>
              <span className="text-[#5661e9] dark:text-indigo-400 font-black">
                {clearedPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#eceef8] dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5661e9] rounded-full transition-all duration-700"
                style={{
                  width: `${totalWords > 0 ? Math.max(8, clearedPercent) : 80}%`,
                }}
              />
            </div>
          </div>

          {/* Solid Color Buttons (NO Gradients) */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <Button
              onClick={onStartReview}
              disabled={!hasDueItems}
              className={cn(
                'h-11 px-6 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-2',
                hasDueItems
                  ? 'bg-[#5661e9] hover:bg-[#4853da] text-white shadow-indigo-500/20 active:scale-[0.98]'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 border-none cursor-not-allowed'
              )}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {hasDueItems ? 'Start Review Session' : 'Review Queue Clear'}
            </Button>

            <Button
              onClick={onStartReview}
              variant="outline"
              className="h-11 px-5 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-[#d8dcfa] dark:border-slate-700 shadow-xs"
            >
              Review All Due ({dueForReview.length})
            </Button>
          </div>
        </div>

        {/* Right Side: Featured Word Card */}
        <div className="lg:col-span-6">
          <div className="bg-white/95 dark:bg-[#10131f] rounded-2xl p-5 border border-[#e0e4f1] dark:border-white/10 shadow-xs h-[215px] flex flex-col justify-between relative overflow-hidden group/featured">
            {/* Top Row: Badge & Pagination */}
            <div className="flex items-center justify-between gap-2 pb-1 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#505bdd] dark:text-indigo-400">
                FEATURED WORD
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                  title="Previous word"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                  title="Next word"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Middle Content Box */}
            <div className="flex-1 overflow-hidden flex flex-col justify-center my-0.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featured.word}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#505bdd] dark:text-indigo-300">
                          {featured.word}
                        </h3>
                        <button
                          onClick={handleAudio}
                          className={cn(
                            'p-1 rounded-full hover:bg-[#efedff] dark:hover:bg-indigo-950/60 text-[#505bdd] transition-colors cursor-pointer',
                            isPlayingAudio && 'text-amber-500 animate-pulse'
                          )}
                          title="Listen audio pronunciation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                        <span>{featured.ipa}</span>
                        <Badge className="bg-[#5661e9] text-white border-none text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                          {featured.pos}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAddFeatured}
                      disabled={addedFeatured[featured.word] === true}
                      className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#efedff] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
                    >
                      {addedFeatured[featured.word] === true ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Saved
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5 mr-1 text-[#505bdd]" /> Add to Bank
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium line-clamp-2">
                    {featured.definition}
                  </p>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal flex items-center gap-1 truncate">
                    <span className="text-[#505bdd] font-bold">"</span>
                    <span className="italic truncate">{featured.example}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1 shrink-0">
              {FEATURED_WORDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === currentIdx ? 'w-5 bg-[#5661e9]' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
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
