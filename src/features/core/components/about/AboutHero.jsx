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
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-linear-to-r/srgb from-indigo-50/90 via-purple-50/80 to-white/90 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-indigo-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/4 dark:bg-none dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span>Smart IELTS Preparation</span>
          </div>

          <h1 className="text-[clamp(2.4rem,6.8vw,3.9rem)] font-black leading-[1.03] tracking-tighter text-slate-950 dark:text-white">
            <span className="block">The Future of</span>
            <span className="relative inline-block font-handwritten mt-2 bg-linear-to-r/srgb from-[#a456ef] via-[#6951ed] to-[#3e70f3] bg-clip-text pb-3 text-[1.05em] leading-[1.08] tracking-tight text-transparent drop-shadow-sm">
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
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/4 px-3 py-1.5 shadow-sm dark:shadow-none backdrop-blur-md dark:backdrop-blur-none transition-all hover:scale-105"
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
