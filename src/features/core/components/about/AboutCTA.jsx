import React from 'react';
import { m } from 'framer-motion';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Sparkles from 'lucide-react/icons/sparkles';
import Check from 'lucide-react/icons/check';
import { ABOUT_VIEWPORT, INK, INSET, MUTED, RULE } from './aboutTokens';

/**
 * Closing call to action.
 *
 * Two revisions on from the original saturated gradient slab. The centred
 * version that replaced it put pill, headline, paragraph, two buttons and three
 * assurances in one narrow column, so the actions sat at the bottom of a stack
 * of text with nothing to separate them from it — and the long script clause
 * wrapped mid-phrase, stranding "is" at the start of the second line.
 *
 * Now a split banner: the argument on the left, a bordered action panel on the
 * right holding the buttons and what you get with them. The headline is short
 * enough that the handwritten clause always sets on one line.
 */
const ASSURANCES = [
  'Free practice included',
  'Instant estimated band scores',
  'Aligned to the public descriptors',
];

export default function AboutCTA({ onSignup, onPricing }) {
  return (
    <section className="relative overflow-hidden bg-[#fcfdff] px-5 pb-20 pt-4 dark:bg-[#08080a] md:px-8 md:pb-28">
      <m.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={ABOUT_VIEWPORT}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto grid max-w-[1100px] items-center gap-8 rounded-[26px] border border-[#e2e5fa] bg-white/95 p-6 shadow-[0_20px_50px_-25px_rgba(79,66,220,0.22)] backdrop-blur-md dark:border-white/10 dark:bg-[#131315] dark:shadow-none dark:backdrop-blur-none sm:p-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:p-10"
      >
        {/* The argument. */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ded9ff] bg-[#f2f0ff]/75 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#5e50ee] dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Start practising
          </span>

          <h2
            className={`mt-5 text-balance text-[clamp(1.7rem,3vw,2.5rem)] font-black leading-[1.06] tracking-[-0.045em] ${INK}`}
          >
            Find the one criterion{' '}
            <span className="font-handwritten relative inline-block whitespace-nowrap tracking-[-0.03em] text-[#5262ef]">
              holding you back.
              <span
                aria-hidden
                className="absolute -bottom-1 left-[3%] h-[3px] w-[94%] -rotate-1 rounded-full bg-linear-to-r/srgb from-[#89d9d0] to-[#7086f6] opacity-70"
              />
            </span>
          </h2>

          <p className={`mt-5 max-w-md text-sm font-medium leading-6 ${MUTED}`}>
            Write one Task 2 response and read the report it comes back with. That is the fastest
            way to judge whether any of this is useful to you.
          </p>
        </div>

        {/* The action panel. */}
        <div className={`${INSET} p-5 sm:p-6`}>
          <button
            type="button"
            onClick={onSignup}
            className="group/btn inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6256ef] px-6 text-sm font-black text-white shadow-md shadow-[#6256ef]/25 transition-all duration-200 hover:bg-[#5246e0] active:scale-[0.98]"
          >
            Start free practice
            <ArrowRight
              className="h-4 w-4 stroke-[2.5] transition-transform group-hover/btn:translate-x-0.5"
              aria-hidden
            />
          </button>

          <button
            type="button"
            onClick={onPricing}
            className={`mt-2.5 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-[#ded9ff] bg-white px-6 text-sm font-black transition-all duration-200 hover:border-[#6256ef]/40 hover:bg-[#f2f0ff] active:scale-[0.98] dark:border-white/12 dark:bg-white/5 dark:hover:border-violet-400/30 dark:hover:bg-white/8 ${INK}`}
          >
            Compare the plans
          </button>

          <ul className={`mt-5 space-y-2.5 border-t pt-4 ${RULE}`}>
            {ASSURANCES.map((item) => (
              <li key={item} className={`flex items-center gap-2 text-xs font-semibold ${MUTED}`}>
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-[#6256ef] dark:text-violet-300"
                  strokeWidth={3}
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </m.div>
    </section>
  );
}
