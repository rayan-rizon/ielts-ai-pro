import React from 'react';
import { m } from 'framer-motion';
import {
  FileText,
  Mic,
  BookOpen,
  Calculator,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkle,
} from 'lucide-react';

function CardGridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        <defs>
          <pattern id="grid-about" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-about)" />
      </svg>
    </div>
  );
}

const FEATURE_ITEMS = [
  {
    icon: FileText,
    title: 'AI Writing Evaluator',
    tag: 'Task 1 & 2',
    desc: 'Instant line-by-line essay feedback with sub-scores for Task Response, Coherence, Vocabulary, and Grammar.',
    color:
      'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200/50 dark:border-blue-500/20',
  },
  {
    icon: Mic,
    title: 'Real-Time Speaking Coach',
    tag: 'Parts 1, 2 & 3',
    desc: 'Practice live voice interviews with an AI examiner that scores your fluency, pronunciation, and grammar.',
    color:
      'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-500/20',
  },
  {
    icon: BookOpen,
    title: 'Full-Length Mock Test Suite',
    tag: 'Exam Simulator',
    desc: 'Simulate real test conditions for Reading & Listening with auto-grading and instant answer explanations.',
    color:
      'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300 border-violet-200/50 dark:border-violet-500/20',
  },
  {
    icon: Calculator,
    title: 'Band Calculator & Analytics',
    tag: 'Target Band Tools',
    desc: 'Track score growth over time and pinpoint exact weak areas needed to push past your current band limits.',
    color:
      'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200/50 dark:border-amber-500/20',
  },
];

function FeatureList() {
  return (
    <ul className="space-y-3.5">
      {FEATURE_ITEMS.map((item, i) => (
        <li
          key={i}
          className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-linear-to-r/srgb from-white via-slate-50/50 to-white dark:border-white/10 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:via-[#131315] dark:to-[#131315] p-4 transition-all duration-300 hover:scale-[1.015] hover:shadow-md dark:hover:shadow-none hover:border-indigo-500/30 dark:hover:border-[#5a63df]/30 backdrop-blur-md dark:backdrop-blur-none"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
          >
            <item.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {item.title}
              </h3>
              <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/6 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 shrink-0">
                {item.tag}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {item.desc}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatsGrid() {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {/* Card 1: Reach */}
      <div className="col-span-1 sm:col-span-2 rounded-[24px] border border-indigo-200/70 bg-linear-to-br/srgb from-white via-indigo-50/30 to-slate-50 dark:border-white/10 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:via-[#131315] dark:to-[#131315] p-6 shadow-sm dark:shadow-none backdrop-blur-xl dark:backdrop-blur-none hover:scale-[1.015] transition-all duration-300 relative overflow-hidden group">
        <CardGridBackground />
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl dark:bg-[#5a63df]/10 group-hover:bg-indigo-500/20 dark:group-hover:bg-[#5a63df]/15 transition-all duration-500" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Global Reach
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Active Across 85+ Countries
          </span>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <span className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight bg-linear-to-r/srgb from-slate-950 via-indigo-950 to-indigo-700 dark:from-white dark:via-indigo-100 dark:to-indigo-300 bg-clip-text text-transparent">
              10,000+
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5 block">
              Active IELTS Students
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Empowering candidates worldwide
          </div>
        </div>
      </div>

      {/* Card 2: Impact */}
      <div className="rounded-[24px] border border-emerald-200/70 bg-linear-to-br/srgb from-white via-emerald-50/25 to-slate-50 dark:border-white/10 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:via-[#131315] dark:to-[#131315] p-5 shadow-sm dark:shadow-none backdrop-blur-xl dark:backdrop-blur-none hover:scale-[1.015] transition-all duration-300 relative overflow-hidden group">
        <CardGridBackground />
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Score Boost
            </span>
          </div>

          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            Fast Track
          </span>
        </div>

        <div className="relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">
              +1.5
            </span>
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              Avg Band Upgrade
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-300">
              Band 6.0
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold">
              Band 7.5+
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Accuracy */}
      <div className="rounded-[24px] border border-violet-200/70 bg-linear-to-br/srgb from-white via-violet-50/25 to-slate-50 dark:border-white/10 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:via-[#131315] dark:to-[#131315] p-5 shadow-sm dark:shadow-none backdrop-blur-xl dark:backdrop-blur-none hover:scale-[1.015] transition-all duration-300 relative overflow-hidden group">
        <CardGridBackground />
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all duration-500" />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-400">
              AI Accuracy
            </span>
          </div>

          <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md">
            Verified
          </span>
        </div>

        <div className="relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">
              98.4%
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
              Examiner Match
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-violet-500" />
            <span>Official Cambridge rubric aligned</span>
          </div>
        </div>
      </div>
    </m.div>
  );
}

export default function AboutStoryAndStats() {
  return (
    <section className="py-12 md:py-20 px-6 relative border-y border-slate-200/60 dark:border-white/[0.07] bg-slate-50/50 dark:bg-white/2">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center relative z-10">
        <m.div
          initial={{ opacity: 0, x: -25 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Sparkle className="w-3.5 h-3.5" />
              <span>Built for Band 7+ Success</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">
              Everything You Need to Ace IELTS
            </h2>
            <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              Get instant examiner-level scoring for Writing, Speaking, Reading, and
              Listening—without paying for expensive tutoring classes.
            </p>
          </div>

          <FeatureList />
        </m.div>

        <StatsGrid />
      </div>
    </section>
  );
}
