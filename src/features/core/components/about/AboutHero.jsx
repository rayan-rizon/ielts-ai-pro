import React from 'react';
import { m } from 'framer-motion';
import Sparkles from 'lucide-react/icons/sparkles';
import { landingReveal, landingStagger } from '../landing/LandingSection';
import { INK, MUTED } from './aboutTokens';

/**
 * About page opening.
 *
 * The old hero led with "The Future of IELTS Preparation" — a slogan, and the
 * same promise the landing hero already makes. An About page's first line
 * should say what the thing *is*, so this states the product and the problem it
 * exists for, in the landing's own display type. The four feature chips are
 * gone: they repeated, verbatim, the four cards that followed immediately
 * below them.
 */
export default function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-[#fcfdff] px-5 pb-16 pt-10 dark:bg-[#08080a] md:px-8 md:pb-24 md:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-24 h-96 w-96 rounded-full bg-[#c9f3eb]/45 blur-[100px] dark:bg-[#5a63df]/8"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-0 h-112 w-112 rounded-full bg-[#d8ddff]/55 blur-[110px] dark:bg-[#5a63df]/10"
      />

      <m.div
        initial="hidden"
        animate="show"
        variants={landingStagger}
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        <m.div variants={landingReveal}>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[#ded9ff] bg-[#f2f0ff]/75 px-5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#5e50ee] shadow-[0_8px_24px_-8px_rgba(98,86,239,0.22)] backdrop-blur-md dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-300">
            <Sparkles
              className="h-4 w-4 shrink-0 text-[#6256ef] dark:text-violet-300"
              aria-hidden
            />
            About IELTS Ai Pro
          </span>
        </m.div>

        <m.h1
          variants={landingReveal}
          className={`mt-5 text-balance text-[clamp(2.35rem,5vw,4.35rem)] font-black leading-[0.98] tracking-[-0.055em] ${INK}`}
        >
          Every IELTS learner deserves{' '}
          <span className="font-handwritten relative inline-block tracking-[-0.03em] text-[#5262ef]">
            a real examiner.
            <span
              aria-hidden
              className="absolute -bottom-1 left-[5%] h-[3px] w-[90%] -rotate-1 rounded-full bg-linear-to-r/srgb from-[#89d9d0] to-[#7086f6] opacity-70"
            />
          </span>
        </m.h1>

        <m.p
          variants={landingReveal}
          className={`mx-auto mt-6 max-w-2xl text-[15px] font-medium leading-7 md:text-[17px] ${MUTED}`}
        >
          IELTS Ai Pro is a web-based practice platform for Reading, Listening, Writing and
          Speaking. It scores your work against the public IELTS band descriptors and, more
          importantly, shows you the evidence behind every band it gives.
        </m.p>
      </m.div>
    </section>
  );
}
