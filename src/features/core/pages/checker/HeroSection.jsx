import React from 'react';
import { ArrowRight, BarChart3, Check, Sparkles } from 'lucide-react';
import { m } from 'framer-motion';
import CheckerWorkspace from './CheckerWorkspace';
import TrustBadges from './TrustBadges';
import WhatYouReceiveSection from './WhatYouReceiveSection';

export default function HeroSection({ user, authLoading }) {
  return (
    <>
      <section className="relative overflow-hidden pb-4 pt-20 sm:pt-24">
        <div className="pointer-events-none absolute -left-40 top-28 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl dark:bg-[#5a63df]/10" />
        <div className="pointer-events-none absolute -right-40 top-10 h-136 w-136 rounded-full bg-violet-200/40 blur-3xl dark:bg-[#5a63df]/8" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr]">
            <HeroCopy />
            <HeroVisual />
          </div>

          <div className="mt-8">
            <CheckerWorkspace user={user} authLoading={authLoading} />
          </div>
        </div>
      </section>

      <TrustBadges />
      <WhatYouReceiveSection />
    </>
  );
}

/** Left-column hero copy block. */
function HeroCopy() {
  return (
    <m.div
      initial={{ opacity: 0, x: -22, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[.14em] text-indigo-700 shadow-sm dark:border-white/10 dark:bg-white/4 dark:text-indigo-300 dark:shadow-none">
        <Sparkles className="h-3.5 w-3.5" /> Free AI feedback
      </div>
      <h1 className="mt-6 text-[2.25rem] font-black leading-[1.08] tracking-[-.04em] text-[#0d1740] dark:text-white sm:text-[3rem] lg:whitespace-nowrap lg:text-[3.25rem]">
        IELTS Writing Checker
      </h1>
      <p className="font-handwritten mt-4 text-3xl leading-tight text-violet-600 dark:text-violet-400 sm:text-4xl">
        Write Better. Score Higher.
      </p>
      <p className="mt-5 max-w-xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[15.5px]">
        Paste your Academic IELTS Task 1 report or Task 2 essay, then get an estimated band score
        and detailed feedback across all four writing criteria.
      </p>
      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-slate-700 dark:text-slate-300">
        {['3 free feedback reports', 'Task 1 & Task 2', '4-criterion feedback'].map((item) => (
          <span key={item} className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Check className="h-3 w-3" />
            </span>
            {item}
          </span>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="#checker"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 dark:shadow-none transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Check my writing <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="#what-you-receive"
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-extrabold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/4 dark:text-slate-200 dark:shadow-none transition hover:border-indigo-200 hover:text-indigo-700 dark:hover:border-indigo-400/40 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          See sample feedback
        </a>
      </div>
    </m.div>
  );
}

/** Right-column hero visual with floating cards. */
function HeroVisual() {
  return (
    <m.div
      initial={{ opacity: 0, x: 22, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      className="relative mx-auto w-full max-w-2xl"
    >
      <div className="absolute -left-3 top-16 z-10 w-36 -rotate-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-xl sm:-left-8 sm:w-40 dark:border-white/10 dark:bg-[#131315] dark:shadow-none">
        <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">7.0</span>
        <p className="mt-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
          Example band
        </p>
        <p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
          Your personalised report appears after analysis.
        </p>
      </div>
      <div className="absolute -right-2 top-24 z-10 hidden rotate-[5deg] rounded-xl bg-violet-200 p-4 text-center text-xs font-bold leading-5 text-violet-950 shadow-lg sm:block dark:bg-violet-500/15 dark:text-violet-200 dark:shadow-none">
        Task response
        <br />
        Coherence
        <br />
        Vocabulary
        <br />
        Grammar
      </div>
      <div className="overflow-hidden rounded-[38px] bg-linear-to-br/srgb from-indigo-50 via-violet-50 to-white p-3 shadow-[0_35px_90px_rgba(79,70,229,.16)] ring-1 ring-indigo-100 dark:from-[#131315] dark:via-[#131315] dark:to-[#131315] dark:shadow-none dark:ring-white/10">
        <img
          src="/ielts-hero-student.webp"
          alt="Student practising Academic IELTS writing with a laptop and notebook"
          className="aspect-[16/10] w-full rounded-[30px] object-cover"
          width="1200"
          height="900"
        />
      </div>
      <div className="absolute -bottom-4 left-1/2 flex w-[88%] -translate-x-1/2 items-center justify-between rounded-2xl border border-white/80 bg-white/95 px-5 py-4 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#131315] dark:shadow-none dark:backdrop-blur-none">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Your report includes
          </p>
          <p className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100">
            4 criterion scores + next steps
          </p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
          <BarChart3 className="h-5 w-5" />
        </div>
      </div>
    </m.div>
  );
}
