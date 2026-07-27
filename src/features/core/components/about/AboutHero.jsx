import React from 'react';
import { m } from 'framer-motion';
import { Sparkles, FileText, Mic, BookOpen, Calculator } from 'lucide-react';

export default function AboutHero() {
  return (
    <section className="relative pt-4 sm:pt-6 pb-12 md:pb-16 px-6">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-white/90 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-indigo-600 shadow-sm backdrop-blur-xl dark:border-indigo-500/20 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/50 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span>Smart IELTS Preparation</span>
          </div>

          <h1 className="text-[clamp(2.4rem,6.8vw,3.9rem)] font-black leading-[1.03] tracking-[-0.05em] text-slate-950 dark:text-white">
            <span className="block">The Future of</span>
            <span className="relative inline-block font-handwritten mt-2 bg-gradient-to-r from-[#a456ef] via-[#6951ed] to-[#3e70f3] bg-clip-text pb-3 text-[1.05em] leading-[1.08] tracking-[-0.025em] text-transparent drop-shadow-sm">
              IELTS Preparation
              <svg
                className="absolute bottom-0 left-0 w-full h-3 text-[#7384f8]"
                viewBox="0 0 200 10"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 4C60 8 140 8 198 4"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Stop waiting days for essay feedback. Get instant, examiner-grade scoring for Writing,
            Speaking, Reading, and Listening—giving you a clear roadmap to Band 7.5+.
          </p>

          {/* Quick highlight feature badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {[
              { icon: FileText, text: 'Writing Task 1 & 2' },
              { icon: Mic, text: 'AI Speaking Examiner' },
              { icon: BookOpen, text: 'Full Mock Test Suite' },
              { icon: Calculator, text: 'Target Band Analytics' },
            ].map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 px-3 py-1.5 shadow-sm backdrop-blur-md transition-all hover:scale-105"
              >
                <chip.icon className="h-3.5 w-3.5 text-indigo-500" />
                {chip.text}
              </span>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
}
