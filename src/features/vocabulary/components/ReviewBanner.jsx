import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/**
 * Review Banner Component
 * Shows the daily review call-to-action with flashcard preview
 */
export default function ReviewBanner({ dueForReview, onStartReview, totalWords = 0 }) {
  const hasDueItems = dueForReview.length > 0;
  const nextItem = dueForReview[0];

  const isEmpty = totalWords === 0;
  const isCaughtUp = !hasDueItems && !isEmpty;

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-slate-900/80 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] text-white p-8 md:p-10 border border-white/10 group"
      data-oid="37qn-0y"
    >
      {/* Premium Gradient Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-600/20 group-hover:opacity-100 opacity-60 transition-opacity duration-1000"
        data-oid="tkiy:k_"
      />

      {/* Decorative Elements */}
      <div
        className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"
        data-oid="kfw8qdm"
      />

      <div
        className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"
        data-oid=".e6w228"
      />

      <div
        className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10"
        data-oid="1y--giy"
      >
        <div className="space-y-6 max-w-lg" data-oid="ik:z2iq">
          <div className="flex items-center gap-3" data-oid="fegwgn:">
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-[10px] font-black tracking-[0.2em] uppercase shadow-inner text-indigo-100"
              data-oid="ys3v0qi"
            >
              <Zap className="w-3 h-3 text-amber-400 fill-current" data-oid="dkgdg52" />
              <span data-oid="tea_wxe">Daily Goal</span>
            </div>
            {hasDueItems && (
              <span
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 animate-pulse"
                data-oid="jlzb-m0"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  data-oid="m97h2a5"
                />
                Review Needed
              </span>
            )}
          </div>

          <div className="space-y-3" data-oid="v7i:8zr">
            <h2
              className="text-3xl md:text-4xl font-black leading-tight tracking-tight"
              data-oid="s6awo_z"
            >
              {isEmpty ? 'Start Your' : isCaughtUp ? 'All Caught' : 'Daily Review'}{' '}
              <br data-oid="7udn1wi" />
              <span className="text-indigo-400" data-oid="e07nrvy">
                {isEmpty ? 'Journey' : isCaughtUp ? 'Up!' : 'Session'}
              </span>
            </h2>
            <p
              className="text-indigo-100/70 leading-relaxed font-medium text-sm md:text-base"
              data-oid="b4iqqe."
            >
              {isEmpty ? (
                'Your library is waiting to be filled. Add new words to begin your active recall journey.'
              ) : isCaughtUp ? (
                "Excellent progress! You've reviewed all pending items. Come back later for more."
              ) : (
                <>
                  You have{' '}
                  <span
                    className="text-white font-black underline decoration-indigo-500/50 underline-offset-4"
                    data-oid="ye.wles"
                  >
                    {dueForReview.length} items
                  </span>{' '}
                  waiting for review. Practice now to remember them better.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2" data-oid="ngn9z41">
            <Button
              onClick={onStartReview}
              disabled={!hasDueItems}
              className={cn(
                'h-14 px-10 rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all duration-500 group-active:scale-95 shadow-xl shadow-indigo-500/20',
                hasDueItems
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-b-4 border-indigo-800 active:border-b-0 translate-y-[-2px] active:translate-y-[2px]'
                  : 'bg-slate-800 text-slate-500 border-none cursor-not-allowed opacity-50'
              )}
              data-oid="4c3:be6"
            >
              <Play className="w-3.5 h-3.5 mr-2 fill-current" data-oid="f:8_u3x" />
              Start Review
            </Button>
            {!hasDueItems && (
              <div
                className="text-slate-500 text-xs font-bold uppercase tracking-widest italic flex items-center gap-2"
                data-oid=":uflwqj"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" data-oid="r7b703g" />
                System Synchronized
              </div>
            )}
          </div>
        </div>

        {/* Interactive Flashcard Preview */}
        <div
          className="hidden lg:block relative w-80 h-56 perspective-1000 group/card cursor-pointer"
          onClick={hasDueItems ? onStartReview : undefined}
          data-oid="ie5bjpe"
        >
          <div
            className="absolute inset-0 bg-indigo-500/10 rounded-3xl border border-indigo-400/20 transform rotate-6 scale-95 transition-transform duration-700 group-hover/card:rotate-[12deg]"
            data-oid="uu:yvfa"
          />

          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-8 text-center transition-all duration-500 group-hover/card:-translate-y-4 group-hover/card:shadow-[0_40px_80px_rgba(79,70,229,0.3)]"
            data-oid="i3zd7vj"
          >
            <div
              className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent rounded-t-full"
              data-oid="k2fou3v"
            />

            <div
              className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6 opacity-100"
              data-oid="6.z-nms"
            >
              {hasDueItems ? 'Up Next' : isCaughtUp ? 'Victory' : 'Get Started'}
            </div>

            <div className="relative mb-4 w-full px-6" data-oid="icke5sq">
              <div
                className="absolute inset-0 blur-3xl bg-indigo-500/30 animate-pulse pointer-events-none"
                data-oid="5sg6erd"
              />

              <h3
                className="text-4xl md:text-5xl font-black text-white relative z-10 italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] truncate"
                data-oid="72.qwsi"
              >
                {hasDueItems ? nextItem?.word : isCaughtUp ? 'Caught Up!' : 'Empty List'}
              </h3>
            </div>

            <div
              className="text-[11px] text-indigo-200 font-bold uppercase tracking-[0.2em] leading-relaxed line-clamp-2 max-w-[220px] opacity-80 italic"
              data-oid="9ovogor"
            >
              {hasDueItems
                ? nextItem?.definition
                : isCaughtUp
                  ? "You've mastered all your words for today."
                  : 'Add words to your library to begin your review sessions.'}
            </div>

            <div
              className="text-[10px] text-indigo-300/80 font-black uppercase tracking-[0.3em] mt-4"
              data-oid="e-yowq5"
            >
              {hasDueItems ? 'Click to begin' : isCaughtUp ? 'Check back later' : 'Start learning'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
