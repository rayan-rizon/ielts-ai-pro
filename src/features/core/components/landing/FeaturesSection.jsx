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

const writingCriteria = [
  { name: 'Task Achievement', score: '6.5', color: 'from-blue-600 to-indigo-500' },
  { name: 'Coherence & Cohesion', score: '6.5', color: 'from-indigo-500 to-violet-500' },
  { name: 'Lexical Resource', score: '7.0', color: 'from-indigo-600 to-blue-500' },
  { name: 'Grammatical Range', score: '6.5', color: 'from-blue-500 to-violet-500' },
];

/* ─── Shared Card Styles ─────────────────────────────────────── */
const CARD =
  'h-full rounded-[28px] border p-5 flex flex-col justify-between transition-all duration-350 hover:-translate-y-1.5 select-none relative overflow-hidden group shadow-[0_8px_32px_rgba(15,23,42,0.03)] backdrop-blur-xl';

/* Background Grid Pattern for Cards */
function CardGridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/* Pill Badge */
function Badge({ icon: Icon, label, color }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${color} shadow-sm`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

/* CTA link at the bottom of a card */
function FeatureLink({ to, children }) {
  return (
    <Link
      to={to}
      className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-indigo-650 transition-all duration-200 hover:gap-2.5 dark:text-indigo-400 group/link"
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
    </Link>
  );
}

/* Thin divider */
function Divider() {
  return <div className="my-2.5 h-px w-full bg-slate-100 dark:bg-slate-800/60" />;
}

/* ─── Writing Feedback Card ──────────────────────────────────── */
function WritingFeedbackCard() {
  return (
    <div
      className={`${CARD} bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/60 border-indigo-100 hover:shadow-[0_20px_40px_rgba(99,102,241,0.08)] hover:border-indigo-200/60 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-900/80 dark:to-indigo-950/40 dark:border-indigo-950/60 dark:hover:shadow-[0_20px_45px_rgba(99,102,241,0.15)] dark:hover:border-indigo-500/20`}
    >
      <CardGridBackground />
      {/* Decorative Blob */}
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-indigo-400/10 blur-3xl group-hover:bg-indigo-400/15 transition-all duration-500" />

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_1.15fr] relative z-10">
        {/* Left Column */}
        <div className="flex flex-col justify-between gap-4">
          <div>
            <Badge
              icon={PenTool}
              label="AI Writing Feedback"
              color="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
            />
            <h3 className="mt-3.5 text-[1.85rem] font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white">
              Write it.
              <br />
              <span className="text-indigo-500">Score higher.</span>
            </h3>
            <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Instant AI evaluation across all 4 official grading criteria with dynamic inline
              correction.
            </p>
          </div>

          {/* Grammar Correction Widget */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/50 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Live AI Correction
            </span>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-355 leading-relaxed">
              "Although the graph shows a rise,{' '}
              <span className="line-through text-red-500 bg-red-50 dark:bg-red-950/20 px-1 py-0.5 rounded font-bold">
                but it declines
              </span>{' '}
              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded font-bold">
                it declines
              </span>{' '}
              later."
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-indigo-500">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Reduces grammatical redundancy</span>
            </div>
          </div>
        </div>

        {/* Right Column: Score Report Dashboard */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/40 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {/* Score Ring */}
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-[6px] border-indigo-500 border-t-slate-200 bg-white text-center shadow-md dark:border-t-slate-800 dark:bg-slate-950">
              <span className="text-[8px] font-black uppercase tracking-wide text-slate-455">
                Band
              </span>
              <strong className="text-[20px] font-black leading-none text-slate-900 dark:text-white">
                7.0
              </strong>
              <span className="mt-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7px] font-black text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                Good
              </span>
            </div>

            {/* Criteria Scores */}
            <div className="flex-1 space-y-1.5">
              <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">
                Band Scores
              </span>
              {writingCriteria.map((c) => (
                <div key={c.name} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="truncate max-w-[110px]">{c.name}</span>
                    <span className="font-black text-indigo-500">{c.score}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <m.div
                      className={`h-full rounded-full bg-gradient-to-r ${c.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${c.score === '7.0' ? 78 : 68}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* Feedback snapshot */}
          <div className="space-y-1.5">
            <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">
              Feedback Snapshot
            </span>
            {[
              { text: 'Clear overview and relevant ideas.', positive: true },
              { text: 'Improve logical progression between points.', positive: false },
              { text: 'Excellent range of cohesive devices.', positive: true },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[12px] font-semibold text-slate-600 dark:text-slate-355"
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${item.positive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'}`}
                >
                  <Check className="h-2.5 w-2.5" />
                </span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FeatureLink to="/ielts-writing-checker">Try AI Writing Checker</FeatureLink>
    </div>
  );
}

/* ─── Speaking Feedback Card ─────────────────────────────────── */
function SpeakingFeedbackCard() {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={`${CARD} bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/60 border-emerald-100 hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] hover:border-emerald-200/60 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-900/80 dark:to-emerald-950/30 dark:border-emerald-950/60 dark:hover:shadow-[0_20px_45px_rgba(16,185,129,0.15)] dark:hover:border-emerald-500/20`}
    >
      <CardGridBackground />
      {/* Decorative Blob */}
      <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-emerald-400/5 blur-3xl group-hover:bg-emerald-400/10 transition-all duration-500" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <Badge
              icon={Mic}
              label="Speaking Practice"
              color="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            />
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-[5px] border-emerald-500 border-t-slate-200 bg-white shadow-sm dark:border-t-slate-700 dark:bg-slate-900">
              <strong className="text-base font-black leading-none text-slate-900 dark:text-white">
                7.0
              </strong>
              <span className="mt-0.5 text-[7px] font-bold text-slate-400">Est. Band</span>
            </div>
          </div>

          <h3 className="mt-3.5 text-[1.85rem] font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white">
            Speak up.
            <br />
            <span className="text-emerald-500">Sound fluent.</span>
          </h3>
          <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Practice Parts 1-3 with interactive AI conversational modules and get instant speech
            analysis.
          </p>

          {/* Interactive AI Chat Transcript Mockup */}
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800/60 dark:bg-slate-900/40 flex flex-col gap-2.5">
            {/* Tutor message */}
            <div className="flex items-start gap-2 max-w-[90%]">
              <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                AI
              </div>
              <div className="rounded-2xl rounded-tl-none bg-white px-2.5 py-2 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-[11px] font-semibold text-slate-705 dark:text-slate-300 shadow-sm leading-relaxed">
                "Tell me about your hometown, what is it famous for?"
              </div>
            </div>
            {/* User message with grammar correction */}
            <div className="flex items-start gap-2 self-end max-w-[90%] flex-row-reverse">
              <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                ME
              </div>
              <div className="rounded-2xl rounded-tr-none bg-indigo-500/10 px-2.5 py-2 border border-indigo-100/60 text-[11px] font-semibold text-slate-755 dark:text-slate-355 shadow-sm leading-relaxed">
                "Well, my hometown is famous for its{' '}
                <span className="border-b-2 border-dashed border-red-400 text-red-655 bg-red-50/60 dark:bg-red-950/20 px-1 py-0.5 rounded">
                  historical monuments
                </span>
                ..."
              </div>
            </div>
          </div>
        </div>

        {/* Audio controller & Waveform */}
        <div className="mt-4 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-2.5">
          <div className="flex items-center gap-2.5">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5262ef] hover:bg-[#4150dc] transition text-white shadow-sm shrink-0">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </button>
            <div className="flex items-center gap-0.5 h-5">
              {[4, 10, 16, 7, 3, 11, 6, 14, 5, 8, 3, 7, 2, 4].map((h, i) => (
                <m.span
                  key={i}
                  className="w-[2.5px] rounded-full bg-emerald-400 dark:bg-emerald-600"
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
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-500 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              00:45
            </span>
            <Volume2 className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Practice Tests Card ────────────────────────────────────── */
function PracticeLibraryCard() {
  return (
    <div
      className={`${CARD} bg-gradient-to-br from-white via-slate-50/50 to-blue-50/60 border-blue-100 hover:shadow-[0_20px_40px_rgba(59,130,246,0.08)] hover:border-blue-200/60 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-900/80 dark:to-blue-950/30 dark:border-blue-950/60 dark:hover:shadow-[0_20px_45px_rgba(59,130,246,0.15)] dark:hover:border-blue-500/20`}
    >
      <CardGridBackground />
      <div>
        <Badge
          icon={BookOpen}
          label="Test Library"
          color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
        />
        <h3 className="mt-3.5 text-[1.6rem] font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white">
          Practice.
          <br />
          <span className="text-blue-500">Pass with ease.</span>
        </h3>
        <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          Complete full-length timed tests or practice by section with real-time explanation
          reviews.
        </p>

        {/* Dynamic Modules Progress */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {[
            {
              Icon: BookOpen,
              title: 'Reading',
              sub: '6 / 12 Test Sets',
              pct: 50,
              accent: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
            },
            {
              Icon: Headphones,
              title: 'Listening',
              sub: '8 / 12 Test Sets',
              pct: 66,
              accent: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
            },
          ].map(({ Icon, title, sub, pct, accent }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800/80 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between gap-2.5 hover:border-blue-200 dark:hover:border-blue-800/30 transition"
            >
              <div>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <b className="mt-1.5 block text-[13px] font-black text-slate-800 dark:text-white leading-tight">
                  {title}
                </b>
                <span className="block text-[11px] font-bold text-slate-455 mt-0.5">{sub}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black text-slate-400">
                  <span>Progress</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <m.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Band Progress Spark */}
        <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800/80 dark:bg-slate-900/50 shadow-sm">
          <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">
            Last Attempt Trends
          </span>
          <div className="space-y-1.5">
            {[
              { label: 'Academic Reading Set 4', band: '7.5', date: 'Yesterday' },
              { label: 'Listening Mock Set 2', band: '7.0', date: '3 days ago' },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-355"
              >
                <div className="min-w-0">
                  <span className="block truncate font-bold text-slate-700 dark:text-slate-200">
                    {s.label}
                  </span>
                  <span className="block text-[9px] text-slate-450 font-semibold">{s.date}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] font-black text-emerald-500">✓</span>
                  <b className="font-black text-indigo-500">{s.band}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FeatureLink to="/cambridge-ielts-practice-tests">Explore Test Sets</FeatureLink>
    </div>
  );
}

/* ─── Learning Path Card ─────────────────────────────────────── */
function LearningPathCard() {
  return (
    <div
      className={`${CARD} bg-gradient-to-br from-white via-slate-50/50 to-violet-50/60 border-violet-100 hover:shadow-[0_20px_40px_rgba(139,92,246,0.08)] hover:border-violet-200/60 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-900/80 dark:to-violet-950/30 dark:border-violet-950/60 dark:hover:shadow-[0_20px_45px_rgba(139,92,246,0.15)] dark:hover:border-violet-500/20`}
    >
      <CardGridBackground />
      <div>
        <div className="flex items-start justify-between gap-3">
          <Badge
            icon={Route}
            label="Adaptive Path"
            color="bg-violet-50 text-violet-755 dark:bg-violet-500/10 dark:text-violet-300"
          />
          {/* Circular Robot Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-violet-50 dark:border-violet-900/30 dark:bg-violet-950/20">
            <svg viewBox="0 0 40 40" className="h-9 w-9">
              <rect x="10" y="14" width="20" height="13" rx="4" fill="#7c3aed" />
              <circle cx="16" cy="20.5" r="1.8" fill="#fff" />
              <circle cx="24" cy="20.5" r="1.8" fill="#fff" />
              <path
                d="M17 24.5 Q20 26 23 24.5"
                stroke="#fff"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
              <rect x="7.5" y="18" width="2.5" height="5" rx="1.2" fill="#7c3aed" />
              <rect x="30" y="18" width="2.5" height="5" rx="1.2" fill="#7c3aed" />
              <line
                x1="20"
                y1="14"
                x2="20"
                y2="9.5"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="20" cy="8.5" r="2" fill="#a78bfa" />
            </svg>
          </div>
        </div>

        <h3 className="mt-3.5 text-[1.6rem] font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white">
          AI-built.
          <br />
          <span className="text-violet-500">Just for you.</span>
        </h3>
        <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          AI adjusts daily recommendations according to mock performance strengths and gaps.
        </p>

        {/* Stepper Roadmap */}
        <div className="mt-4 relative space-y-3.5">
          {/* Vertical line segment centered exactly behind the dots */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-violet-150 dark:bg-violet-900/50" />

          {[
            { n: '1', title: 'Diagnostic Test', note: 'Completed · Band 6.0', status: 'done' },
            {
              n: '2',
              title: 'Focus: Grammar & Lexicon',
              note: 'Weak coherence correction active',
              status: 'active',
            },
            {
              n: '3',
              title: 'Intensive Practice Run',
              note: 'Mock tests & interactive tasks',
              status: 'next',
            },
            {
              n: '4',
              title: 'Post-test Evaluation',
              note: 'Evaluate Band 7.5 progress',
              status: 'next',
            },
          ].map((item, idx) => (
            <div key={item.n} className="relative pl-6 flex items-start gap-3 justify-between">
              <div className="flex items-start gap-3 min-w-0">
                {/* Stepper Dot */}
                <m.span
                  className={`absolute left-0 top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-black border transition shrink-0 z-10
                    ${item.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : item.status === 'active' ? 'bg-violet-500 border-violet-500 text-white shadow-[0_0_8px_rgba(124,58,237,0.4)]' : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'}`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: idx * 0.12 }}
                >
                  {item.status === 'done' ? '✓' : item.n}
                </m.span>
                <div className={`min-w-0 ${item.status === 'next' ? 'opacity-50' : ''}`}>
                  <span className="block text-[12px] font-black text-slate-700 dark:text-slate-200 leading-tight">
                    {item.title}
                  </span>
                  <span className="block truncate text-[10px] text-slate-400 font-semibold mt-0.5">
                    {item.note}
                  </span>
                </div>
              </div>
              {item.status === 'active' && (
                <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[8px] font-black text-violet-600 dark:bg-violet-950/30 dark:text-violet-300 animate-pulse self-start mt-0.5">
                  Now
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <FeatureLink to="/learning-path">View My Path</FeatureLink>
    </div>
  );
}

/* ─── Analytics Card ─────────────────────────────────────────── */
function AnalyticsCard() {
  return (
    <div
      className={`${CARD} bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/50 border-emerald-100 hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] hover:border-emerald-200/60 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-900/80 dark:to-emerald-950/30 dark:border-emerald-950/60 dark:hover:shadow-[0_20px_45px_rgba(16,185,129,0.15)] dark:hover:border-emerald-500/20`}
    >
      <CardGridBackground />
      <div>
        <Badge
          icon={TrendingUp}
          label="Analytics"
          color="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        />
        <h3 className="mt-3.5 text-[1.6rem] font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white">
          Know your score.
          <br />
          <span className="text-emerald-500">Watch it rise.</span>
        </h3>

        {/* Radial indicator widget */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 dark:border-slate-800/80 dark:bg-slate-900/50 shadow-sm">
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
              Target Band Achievement
            </span>
            <strong className="mt-0.5 block text-[2.4rem] font-black leading-none text-indigo-500">
              7.0
            </strong>
            <span className="mt-0.5 block text-[11px] font-bold text-slate-400">
              Aiming for Band 7.5
            </span>
          </div>
          {/* Radial progress ring */}
          <div className="relative flex h-16 w-16 items-center justify-center shrink-0">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="33"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="6"
                className="dark:stroke-slate-800"
              />
              <m.circle
                cx="40"
                cy="40"
                r="33"
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeDasharray="207.3"
                initial={{ strokeDashoffset: 207.3 }}
                whileInView={{ strokeDashoffset: 45 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[12px] font-black text-slate-700 dark:text-slate-200">78%</span>
          </div>
        </div>

        {/* Dashboard Progression Chart Mockup */}
        <div className="mt-3 relative bg-slate-50/40 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/60 p-2 text-slate-550">
          <div className="absolute top-2 left-2 flex gap-1.5 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-[8px] font-bold text-slate-400 uppercase">Estimated Trend</span>
          </div>
          <svg viewBox="0 0 260 60" className="w-full overflow-visible">
            <defs>
              <linearGradient id="ag-fill-2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity=".2" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            <line
              x1="0"
              y1="15"
              x2="260"
              y2="15"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeDasharray="3"
            />
            <line
              x1="0"
              y1="35"
              x2="260"
              y2="35"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeDasharray="3"
            />

            <m.path
              d="M4 48 C28 43,40 33,64 36 S96 22,124 26 S158 10,186 13 S216 4,256 1"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            <m.path
              d="M4 48 C28 43,40 33,64 36 S96 22,124 26 S158 10,186 13 S216 4,256 1 L256 60 L4 60Z"
              fill="url(#ag-fill-2)"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.8 }}
            />
            {/* Interactive dot hover */}
            <m.circle
              cx="124"
              cy="26"
              r="4"
              fill="#6366f1"
              stroke="#fff"
              strokeWidth="1.5"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 1 }}
            />
          </svg>
        </div>
      </div>

      <FeatureLink to="/user-analytics">View Analytics</FeatureLink>
    </div>
  );
}

/* ─── Vocabulary Card ────────────────────────────────────────── */
function VocabularyBuilderCard() {
  const tags = [
    {
      word: 'Analysis',
      c: 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/30 dark:text-indigo-300',
    },
    {
      word: 'Sustainable',
      c: 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/30 dark:text-emerald-300',
    },
    {
      word: 'Therefore',
      c: 'bg-violet-50 border-violet-100 text-violet-700 dark:bg-violet-950/30 dark:border-violet-900/30 dark:text-violet-305',
    },
    {
      word: 'In contrast',
      c: 'bg-sky-50 border-sky-100 text-sky-700 dark:bg-sky-950/30 dark:border-sky-900/30 dark:text-sky-300',
    },
    {
      word: 'Evidence',
      c: 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-300',
    },
    {
      word: 'Viable',
      c: 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/30 dark:text-rose-305',
    },
  ];

  return (
    <div
      className={`${CARD} bg-gradient-to-br from-white via-slate-50/50 to-amber-50/60 border-amber-100 hover:shadow-[0_20px_40px_rgba(245,158,11,0.08)] hover:border-amber-200/60 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-900/80 dark:to-amber-950/30 dark:border-amber-950/60 dark:hover:shadow-[0_20px_45px_rgba(245,158,11,0.15)] dark:hover:border-amber-500/20`}
    >
      <CardGridBackground />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.25fr_1fr] lg:gap-6">
        <div>
          <Badge
            icon={Brain}
            label="Vocabulary"
            color="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          />
          <h3 className="mt-4 text-[1.65rem] font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white">
            Smarter words.
            <br />
            <span className="text-emerald-500">Better answers.</span>
          </h3>
          <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Learn academic band booster words using interactive spaced repetition algorithms.
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5 overflow-hidden">
            {tags.map((t) => (
              <span
                key={t.word}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${t.c}`}
              >
                {t.word}
              </span>
            ))}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
              +1,200 more
            </span>
          </div>
        </div>

        {/* Flashcard interactive widget */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-800/80 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between gap-3.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Word of the Day
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
              ★ Band 8.5
            </span>
          </div>
          <div>
            <strong className="block text-base font-black text-slate-900 dark:text-white">
              Elucidate
            </strong>
            <span className="block text-[10px] text-slate-450 italic mt-0.5">
              verb · /ɪˈluːsɪdeɪt/
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
              To make lucid or clear; throw light upon; explain.
            </p>
          </div>
          <div className="h-px bg-slate-200/60 dark:bg-slate-800" />
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-405">
            <span>Progress: 85% mastered</span>
            <button className="text-indigo-500 hover:text-indigo-650 font-black">Flip Card</button>
          </div>
        </div>
      </div>

      <FeatureLink to="/vocabulary">Build Vocabulary</FeatureLink>
    </div>
  );
}

/* ─── Study Resources Card ───────────────────────────────────── */
function StudyResourcesCard() {
  const resources = [
    {
      Icon: FileText,
      title: 'Model Answers',
      sub: 'Writing & Speaking',
      files: '120+ PDFs',
      c: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20',
    },
    {
      Icon: Play,
      title: 'Video Lessons',
      sub: 'Expert strategies',
      files: '45 hours',
      c: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20',
    },
    {
      Icon: FileDown,
      title: 'Practice PDFs',
      sub: 'Topic-based sets',
      files: '80+ resources',
      c: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
    },
    {
      Icon: GraduationCap,
      title: 'Study Guides',
      sub: 'Tips & techniques',
      files: '30+ guides',
      c: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
    },
  ];

  return (
    <div
      className={`${CARD} bg-gradient-to-br from-white via-slate-50/50 to-sky-50/30 border-sky-100 hover:shadow-[0_20px_40px_rgba(14,165,233,0.08)] hover:border-sky-200/60 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-900/80 dark:to-sky-950/10 dark:border-sky-950/60 dark:hover:shadow-[0_20px_45px_rgba(14,165,233,0.15)] dark:hover:border-sky-500/20`}
    >
      <CardGridBackground />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.25fr_1fr] lg:gap-6">
        <div>
          <Badge
            icon={Library}
            label="Study Resources"
            color="bg-sky-50 text-sky-755 dark:bg-sky-500/10 dark:text-sky-300"
          />
          <h3 className="mt-4 text-[1.65rem] font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white">
            Everything you need.
            <br />
            <span className="text-sky-500">Ready to go.</span>
          </h3>
          <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Unlock premium expert materials, curated guides, and answers to ace the test.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {resources.map(({ Icon, title, files, c }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/50 shadow-sm hover:border-sky-200 dark:hover:border-sky-800/30 transition"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 mt-3">
                <b className="block truncate text-[11px] font-black text-slate-800 dark:text-white leading-tight">
                  {title}
                </b>
                <small className="block truncate text-[9px] text-slate-455 mt-0.5 font-bold">
                  {files}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FeatureLink to="/resources">Browse Resources</FeatureLink>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────────── */
export default function FeaturesSection({ viewport }) {
  return (
    <SoftSection id="features" className="scroll-mt-24">
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="BUILT TO HELP YOU SCORE"
          title="Tools that actually"
          script="move the needle."
          description="From AI writing feedback to speaking practice and adaptive study plans — everything you need to hit your target band score."
          viewport={viewport}
        />

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={landingStagger}
          className="mt-12 grid gap-5 lg:grid-cols-12"
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
