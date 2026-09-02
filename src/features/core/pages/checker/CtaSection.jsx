import React from 'react';
import { ArrowRight, BarChart3, Sparkles } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="px-5 pb-10 sm:pb-12 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-linear-to-r/srgb from-violet-600 via-indigo-600 to-blue-500 px-6 py-9 text-white shadow-[0_24px_70px_rgba(79,70,229,.28)] sm:px-10 sm:py-11 lg:px-14">
        <div className="pointer-events-none absolute -left-28 -top-32 h-80 w-80 rounded-full bg-fuchsia-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/25 blur-3xl" />
        <Sparkles className="pointer-events-none absolute right-[38%] top-8 h-6 w-6 text-white/60" />
        <Sparkles className="pointer-events-none absolute right-[30%] bottom-10 h-4 w-4 text-indigo-100/70" />
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_360px]">
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[.18em] text-indigo-100">
              Ready to improve your IELTS writing?
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Get your next Academic IELTS writing report.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-50 sm:text-base">
              Analyze a Task 1 report or Task 2 essay, review all four IELTS writing criteria, and
              use practical feedback to improve your next draft.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#checker"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-extrabold text-indigo-700 shadow-lg shadow-indigo-950/15 transition hover:-translate-y-0.5 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
              >
                Analyze my writing <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#what-you-receive"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 text-sm font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
              >
                See what you receive <BarChart3 className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 text-xs font-semibold text-indigo-100">
              Your first 3 Academic IELTS writing feedback reports are free.
            </p>
          </div>

          <CtaIllustration />
        </div>
      </div>
    </section>
  );
}

/** Decorative score-card illustration — purely cosmetic. */
function CtaIllustration() {
  return (
    <div className="relative mx-auto hidden h-48 w-full max-w-[350px] lg:block" aria-hidden="true">
      <div className="absolute right-36 top-0 h-44 w-24 rotate-[-5deg] rounded-[22px] border-[5px] border-white/70 bg-white p-2 shadow-2xl shadow-indigo-950/25">
        <div className="h-full rounded-[15px] bg-linear-to-b/srgb from-indigo-50 to-white p-2 text-indigo-700">
          <div className="text-[8px] font-black tracking-wide text-rose-500">IELTS</div>
          <div className="mt-4 text-center text-3xl font-black">7.5</div>
          <div className="mt-2 h-1.5 rounded-full bg-indigo-100">
            <div className="h-full w-4/5 rounded-full bg-indigo-500" />
          </div>
          <div className="mt-4 flex items-end gap-1">
            <span className="h-5 w-2 rounded-t bg-indigo-200" />
            <span className="h-8 w-2 rounded-t bg-indigo-400" />
            <span className="h-11 w-2 rounded-t bg-indigo-600" />
            <span className="h-7 w-2 rounded-t bg-violet-400" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-2 right-8 grid h-24 w-24 place-items-center rounded-full border-8 border-white/80 bg-[#17245c] shadow-2xl shadow-indigo-950/30">
        <div className="text-center">
          <div className="mx-auto mb-1 flex justify-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
          </div>
          <span className="text-[10px] font-black tracking-[.2em] text-white">AI</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-3 h-20 w-20 rotate-[-14deg] rounded-2xl border border-white/40 bg-white/15 p-3 backdrop-blur-sm">
        <BarChart3 className="h-full w-full text-white/80" />
      </div>
    </div>
  );
}
