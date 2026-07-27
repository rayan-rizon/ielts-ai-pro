import React from 'react';
import { Link } from 'react-router-dom';
import { m, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  PenTool,
  Headphones,
  Library,
  Mic,
  Route,
  Play,
  TrendingUp,
  FileText,
  FileDown,
  GraduationCap,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { SectionHeading, SoftSection, landingReveal, landingStagger } from './LandingSection';

/* ─── Shared Card Base Style ─────────────────────────────────── */
const CARD_BASE =
  'h-full rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 select-none relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(99,102,241,0.12)] border transform-gpu';

/* Pill Badge */
function Badge({ icon: Icon, label, color }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${color} border shadow-2xs`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  );
}

/* CTA link at the bottom of a card */
function FeatureLink({ to, children }) {
  return (
    <Link
      to={to}
      className="mt-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#635BFF] dark:text-indigo-400 transition-all duration-200 hover:gap-2.5 group/link"
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
    </Link>
  );
}

/* ─── 1. Writing Feedback Card ───────────────────────────────── */
function WritingFeedbackCard() {
  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-white via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border-indigo-150 dark:border-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-500/50`}
    >
      {/* Decorative Glow */}
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <Badge
            icon={PenTool}
            label="AI Writing Feedback"
            color="bg-indigo-50 text-[#635BFF] dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/30"
          />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black shadow-2xs">
            <span>Band 7.0</span>
            <span className="text-[10px] font-extrabold uppercase opacity-80">• Good</span>
          </div>
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
            Write it. <span className="text-[#635BFF] dark:text-indigo-400">Score higher.</span>
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Instant AI evaluation across all 4 official grading criteria with dynamic inline
            correction.
          </p>
        </div>

        {/* Live Correction Pill with High Contrast */}
        <div className="py-3 px-4 rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-indigo-100 dark:border-indigo-900/40 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed flex items-center gap-2.5 shadow-xs">
          <Sparkles className="w-4 h-4 text-[#635BFF] shrink-0" />
          <div>
            "Although the graph rises,{' '}
            <span className="line-through text-rose-500 font-bold px-1">but it declines</span>{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-900/40 px-1.5 py-0.5 rounded-md">
              it declines
            </span>{' '}
            later."
          </div>
        </div>

        {/* 4 Criteria Scores Bar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { label: 'Task Achievement', score: '6.5', pct: 68, color: 'bg-indigo-500' },
            { label: 'Coherence', score: '6.5', pct: 68, color: 'bg-purple-500' },
            { label: 'Lexical Resource', score: '7.0', pct: 78, color: 'bg-[#635BFF]' },
            { label: 'Grammar Range', score: '6.5', pct: 68, color: 'bg-blue-500' },
          ].map((c) => (
            <div
              key={c.label}
              className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-2xs"
            >
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400 truncate">{c.label}</span>
                <span className="text-[#635BFF] dark:text-indigo-400 font-extrabold">
                  {c.score}
                </span>
              </div>
              <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <m.div
                  className={`h-full ${c.color} rounded-full`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${c.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Snapshot Checklist */}
        <div className="pt-2.5 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span className="text-[11px]">Clear overview & key feature comparison</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span className="text-[11px]">High lexical variety & academic tone</span>
          </div>
        </div>
      </div>

      <FeatureLink to="/writing">Try AI Writing Checker</FeatureLink>
    </div>
  );
}

/* ─── 2. Speaking Feedback Card ──────────────────────────────── */
function SpeakingFeedbackCard() {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-white via-white to-emerald-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border-emerald-150 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-500/50`}
    >
      {/* Decorative Glow */}
      <div className="absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none" />

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <Badge
            icon={Mic}
            label="Speaking Practice"
            color="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/30"
          />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black shadow-2xs">
            <span>Est. Band 7.0</span>
          </div>
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
            Speak up. <span className="text-emerald-600 dark:text-emerald-400">Sound fluent.</span>
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Practice Parts 1-3 with interactive AI conversational modules and get instant speech
            analysis.
          </p>
        </div>

        {/* AI Chat Prompt Pill */}
        <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              AI
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 italic">
              "Tell me about your hometown, what is it famous for?"
            </p>
          </div>
        </div>

        {/* Waveform Player Bar */}
        <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-[#635BFF] text-white flex items-center justify-center shrink-0 shadow-xs hover:scale-105 transition-transform"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
            <div className="flex items-center gap-0.5 h-4">
              {[4, 10, 14, 7, 3, 11, 6, 12, 5, 8, 3, 7, 2, 4].map((h, i) => (
                <m.span
                  key={i}
                  className="w-[2.5px] rounded-full bg-emerald-500 dark:bg-emerald-400"
                  initial={{ height: 4 }}
                  animate={reduceMotion ? { height: h * 1.1 } : { height: [4, h * 1.1, 4] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    delay: i * 0.08,
                  }}
                />
              ))}
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
            00:45
          </span>
        </div>
      </div>

      <FeatureLink to="/speaking">Start Speaking Practice</FeatureLink>
    </div>
  );
}

/* ─── 3. Practice Tests Card ─────────────────────────────────── */
function PracticeLibraryCard() {
  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-white via-white to-blue-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 border-blue-150 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-500/50`}
    >
      <div className="space-y-4">
        <Badge
          icon={BookOpen}
          label="Test Library"
          color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200/80 dark:border-blue-500/30"
        />

        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
            Practice. <span className="text-blue-600 dark:text-blue-400">Pass with ease.</span>
          </h3>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Complete full-length timed tests or practice by section with real-time explanation
            reviews.
          </p>
        </div>

        {/* Clean Progress Bars */}
        <div className="space-y-2.5 pt-1">
          {[
            { title: 'Academic Reading', sub: '6 / 12 Test Sets', pct: 50, color: 'bg-blue-600' },
            { title: 'Listening Master', sub: '8 / 12 Test Sets', pct: 66, color: 'bg-indigo-600' },
          ].map((item) => (
            <div key={item.title} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>{item.title}</span>
                <span className="text-slate-400 text-[10px] font-semibold">{item.sub}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <m.div
                  className={`h-full ${item.color} rounded-full`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Attempts Breakdown */}
        <div className="pt-2 space-y-1.5 border-t border-slate-150 dark:border-slate-800">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Recent Attempts
          </span>
          {[
            {
              name: 'Reading Mock Set 4',
              band: 'Band 7.5 ✓',
              color:
                'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
            },
            {
              name: 'Listening Set 2',
              band: 'Band 7.0 ✓',
              color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
            },
          ].map((attempt) => (
            <div
              key={attempt.name}
              className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800 text-xs font-bold shadow-2xs"
            >
              <span className="text-slate-800 dark:text-slate-200 text-[11px] font-bold truncate">
                {attempt.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md border text-[9px] font-black shrink-0 ${attempt.color}`}
              >
                {attempt.band}
              </span>
            </div>
          ))}
        </div>
      </div>

      <FeatureLink to="/cambridge-tests">Explore Test Sets</FeatureLink>
    </div>
  );
}

/* ─── 4. Learning Path Card ─────────────────────────────────── */
function LearningPathCard() {
  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-white via-white to-purple-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/40 border-purple-150 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-500/50`}
    >
      <div className="space-y-4">
        <Badge
          icon={Route}
          label="Adaptive Path"
          color="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300 border-purple-200/80 dark:border-purple-500/30"
        />

        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
            AI-built. <span className="text-purple-600 dark:text-purple-400">Just for you.</span>
          </h3>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            AI adjusts daily recommendations according to mock performance strengths and gaps.
          </p>
        </div>

        {/* Clean Roadmap Steps */}
        <div className="space-y-2 pt-1">
          {[
            { step: '01', title: 'Diagnostic Test', status: 'Completed · Band 6.0' },
            { step: '02', title: 'Grammar & Lexicon Focus', status: 'Active Goal' },
            { step: '03', title: 'Intensive Practice Run', status: 'Upcoming' },
          ].map((s) => (
            <div
              key={s.step}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 shadow-2xs"
            >
              <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                {s.step}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {s.title}
                </h4>
                <p className="text-[10px] font-medium text-slate-400 truncate">{s.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FeatureLink to="/learning-path">View My Path</FeatureLink>
    </div>
  );
}

/* ─── 5. Analytics Card ─────────────────────────────────────── */
function AnalyticsCard() {
  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-white via-white to-emerald-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border-emerald-150 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-500/50`}
    >
      <div className="space-y-4">
        <Badge
          icon={TrendingUp}
          label="Analytics"
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/30"
        />

        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
            Know your score.{' '}
            <span className="text-emerald-600 dark:text-emerald-400">Watch it rise.</span>
          </h3>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Track target band progress and performance trends over time.
          </p>
        </div>

        {/* Clean Progress Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Target Band Goal
            </span>
            <span className="text-2xl font-extrabold text-[#635BFF] dark:text-indigo-400">
              7.5 Band
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black text-sm shadow-2xs">
            <span>78%</span>
            <span className="text-[10px] font-bold uppercase">Achieved</span>
          </div>
        </div>

        {/* Dynamic & Expressive Trend SVG */}
        <div className="relative pt-2">
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0" />
            <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0" />
            <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0" />
          </div>

          <svg viewBox="0 0 280 85" className="w-full overflow-visible relative z-10">
            <defs>
              <linearGradient id="ag-fill-dynamic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#635BFF" stopOpacity=".2" />
                <stop offset="70%" stopColor="#635BFF" stopOpacity=".03" />
                <stop offset="100%" stopColor="#635BFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gradient Area Fill */}
            <path
              d="M6 68 C 30 60, 45 48, 60 52 S 85 60, 100 56 S 135 30, 150 36 S 175 44, 190 40 S 220 12, 240 18 S 260 4, 274 8 L 274 85 L 6 85 Z"
              fill="url(#ag-fill-dynamic)"
            />

            {/* Main Dynamic Trend Line */}
            <path
              d="M6 68 C 30 60, 45 48, 60 52 S 85 60, 100 56 S 135 30, 150 36 S 175 44, 190 40 S 220 12, 240 18 S 260 4, 274 8"
              fill="none"
              stroke="#635BFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Data Dots & Band Nodes */}
            <circle cx="6" cy="68" r="3" fill="#635BFF" />
            <circle cx="60" cy="52" r="2.5" fill="#635BFF" opacity="0.5" />
            <circle cx="150" cy="36" r="3.5" fill="#635BFF" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="190" cy="40" r="2.5" fill="#635BFF" opacity="0.5" />
            <circle cx="274" cy="8" r="4" fill="#635BFF" stroke="#ffffff" strokeWidth="1.5" />
          </svg>

          {/* Floating Score Badges */}
          <div className="flex items-center justify-between text-[9px] font-black text-slate-400 mt-1">
            <span>Band 5.5 (Start)</span>
            <span className="text-[#635BFF] dark:text-indigo-400">Band 6.5</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              Band 7.5 (Peak) ✓
            </span>
          </div>
        </div>
      </div>

      <FeatureLink to="/user-analytics">View Analytics</FeatureLink>
    </div>
  );
}

/* ─── 6. Vocabulary Card ────────────────────────────────────── */
function VocabularyBuilderCard() {
  const tags = ['Analysis', 'Sustainable', 'Therefore', 'In contrast', 'Evidence', 'Viable'];

  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-white via-white to-amber-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/40 border-amber-150 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-500/50`}
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-5">
        <div className="space-y-3">
          <Badge
            icon={Brain}
            label="Vocabulary"
            color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/30"
          />
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
              Smarter words.{' '}
              <span className="text-emerald-600 dark:text-emerald-400">Better answers.</span>
            </h3>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Learn academic band booster words using interactive spaced repetition algorithms.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-slate-200/80 bg-white/90 dark:bg-slate-950/40 dark:border-slate-800 px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs"
              >
                {t}
              </span>
            ))}
            <span className="rounded-lg border border-indigo-200/80 bg-indigo-50 dark:bg-indigo-950/40 text-[#635BFF] dark:text-indigo-400 px-2 py-1 text-[10px] font-extrabold shadow-2xs">
              +1,200 more
            </span>
          </div>
        </div>

        {/* Word of the Day Compact Banner */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-amber-200/80 dark:border-amber-900/40 flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
              Word of the Day
            </span>
            <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
              ★ Band 8.5
            </span>
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Elucidate</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              verb · To make lucid or clear; throw light upon; explain.
            </p>
          </div>
          <div className="text-[10px] font-extrabold text-[#635BFF] dark:text-indigo-400">
            85% Mastered • Spaced Repetition Active
          </div>
        </div>
      </div>

      <FeatureLink to="/vocabulary">Build Vocabulary</FeatureLink>
    </div>
  );
}

/* ─── 7. Study Resources Card ────────────────────────────────── */
function StudyResourcesCard() {
  const resources = [
    {
      Icon: FileText,
      title: 'Model Answers',
      count: '120+ PDFs',
      desc: 'Task 1 & 2 Band 9 Samples',
      color:
        'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20',
    },
    {
      Icon: Play,
      title: 'Video Lessons',
      count: '45 Hours',
      desc: 'Expert Strategy Walkthroughs',
      color:
        'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200/60 dark:border-rose-500/20',
    },
    {
      Icon: FileDown,
      title: 'Practice PDFs',
      count: '80+ Sets',
      desc: 'Topic-Based Practice Worksheets',
      color:
        'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200/60 dark:border-blue-500/20',
    },
    {
      Icon: GraduationCap,
      title: 'Study Guides',
      count: '30+ Guides',
      desc: 'Tips, Hacks & Band Descriptors',
      color:
        'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20',
    },
  ];

  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-white via-white to-sky-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/40 border-sky-150 dark:border-sky-900/40 hover:border-sky-300 dark:hover:border-sky-500/50`}
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1.1fr_1.1fr] lg:gap-5">
        <div className="space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <Badge
              icon={Library}
              label="Study Resources"
              color="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300 border-sky-200/80 dark:border-sky-500/30"
            />
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
                Everything you need.{' '}
                <span className="text-sky-600 dark:text-sky-400">Ready to go.</span>
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Unlock premium expert materials, curated guides, and answers to ace the test.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Instant PDF Downloads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Updated for 2026 Test Format</span>
            </div>
          </div>
        </div>

        {/* 4 Clean Stacked Resource Rows */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {resources.map(({ Icon, title, count, desc, color }) => (
            <div
              key={title}
              className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs hover:border-sky-300 dark:hover:border-sky-800/40 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {title}
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 truncate">{desc}</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-700 dark:text-slate-300 shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <FeatureLink to="/resources">Browse Resources</FeatureLink>
    </div>
  );
}

/* ─── Main Section Component ─────────────────────────────────── */
export default function FeaturesSection({ viewport }) {
  return (
    <SoftSection id="features" className="scroll-mt-24 bg-slate-100/60 dark:bg-slate-950/60 py-16">
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="BUILT TO HELP YOU SCORE"
          title="IELTS tools that actually"
          script="move the needle."
          description="From AI writing feedback to speaking practice and adaptive study plans — everything you need to hit your target band score."
          viewport={viewport}
        />

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={landingStagger}
          className="mt-10 grid gap-4 sm:gap-5 lg:grid-cols-12"
        >
          <m.div variants={landingReveal} className="lg:col-span-7 flex flex-col h-full">
            <WritingFeedbackCard />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-5 flex flex-col h-full">
            <SpeakingFeedbackCard />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-4 flex flex-col h-full">
            <PracticeLibraryCard />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-4 flex flex-col h-full">
            <LearningPathCard />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-4 flex flex-col h-full">
            <AnalyticsCard />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-6 flex flex-col h-full">
            <VocabularyBuilderCard />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-6 flex flex-col h-full">
            <StudyResourcesCard />
          </m.div>
        </m.div>
      </div>
    </SoftSection>
  );
}
