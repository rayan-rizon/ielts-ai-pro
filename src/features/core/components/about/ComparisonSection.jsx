import React from 'react';
import { Sparkles } from 'lucide-react';

const TRADITIONAL_POINTS = [
  { title: 'Slow Turnaround', desc: 'Wait 3 to 7 days for tutors to grade your practice essays.' },
  { title: 'High Hourly Rates', desc: 'Pay $30–$60 per hour for 1-on-1 private tutoring.' },
  { title: 'Subjective Scoring', desc: 'Inconsistent feedback without precise rubric breakdowns.' },
  { title: 'Fixed Class Timings', desc: 'Locked schedules that limit daily practice flexibility.' },
];

const AI_PRO_POINTS = [
  {
    title: 'Instant Feedback (< 5 Seconds)',
    desc: 'Get line-by-line grammar, vocabulary, and structural corrections immediately.',
  },
  {
    title: 'Unlimited Daily Practice',
    desc: 'Practice Task 1, Task 2, and Speaking interviews as often as you like.',
  },
  {
    title: 'Official 4-Rubric Breakdown',
    desc: 'Clear scores for Task Achievement, Coherence, Vocabulary, and Grammar.',
  },
  {
    title: '24/7 On-Demand Access',
    desc: 'Practice anytime on mobile or desktop with zero waiting time.',
  },
];

export default function ComparisonSection() {
  return (
    <section className="py-16 md:py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 block">
            Why Switch
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">
            Traditional Tutoring vs. IELTS AI Pro
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            See how our instant AI platform accelerates your preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Way */}
          <div className="rounded-[28px] border border-rose-200/70 bg-rose-50/20 dark:border-rose-900/30 dark:bg-rose-950/10 p-6 sm:p-7 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold mb-5">
              Traditional Offline Coaching
            </div>

            <ul className="space-y-3.5">
              {TRADITIONAL_POINTS.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-sm"
                >
                  <div className="h-5 w-5 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                    ✕
                  </div>
                  <div>
                    <strong className="block font-bold text-slate-800 dark:text-slate-200">
                      {item.title}
                    </strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* IELTS AI Pro Way */}
          <div className="rounded-[28px] border border-indigo-500/30 bg-gradient-to-br from-white via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-950 p-6 sm:p-7 shadow-[0_15px_45px_-15px_rgba(79,70,229,0.15)] relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-xs font-extrabold mb-5 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              IELTS AI Pro Experience
            </div>

            <ul className="space-y-3.5 relative z-10">
              {AI_PRO_POINTS.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-slate-700 dark:text-slate-200 text-sm"
                >
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                    ✓
                  </div>
                  <div>
                    <strong className="block font-extrabold text-slate-900 dark:text-white">
                      {item.title}
                    </strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
