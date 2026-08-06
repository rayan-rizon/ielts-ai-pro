import React, { useEffect, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookOpen, FileText, Mic, PenTool, TrendingUp, Volume2 } from 'lucide-react';
import { SectionHeading, SoftSection, landingReveal, landingStagger } from './LandingSection';

const cardClass =
  'group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-[#e2e5fa] bg-white/95 p-5 shadow-[0_20px_50px_-25px_rgba(79,66,220,0.22)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:border-[#6256ef]/40 hover:shadow-[0_30px_65px_-24px_rgba(82,98,239,0.38)] dark:border-white/8 dark:bg-[#111114] dark:shadow-none dark:backdrop-blur-none dark:hover:-translate-y-0.5 dark:hover:border-violet-400/20 dark:hover:shadow-none';
const canvasClass =
  'relative mt-5 min-h-[194px] overflow-hidden rounded-[18px] border border-[#e7e4fb] bg-linear-to-b from-[#fcfbff] via-[#faf9ff] to-[#f4f2ff] dark:border-white/[0.07] dark:bg-white/2 dark:bg-none';
const smoothLoop = { ease: [0.45, 0, 0.55, 1] };

function FeatureHeader({ icon: Icon, title, description }) {
  return (
    <div className="relative z-10 flex items-start gap-3.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[#ded9ff] bg-[#f2f0ff] text-[#6256ef] shadow-[0_8px_20px_-16px_rgba(83,70,225,.85)] dark:border-violet-400/15 dark:bg-violet-500/[0.07] dark:text-violet-300">
        <Icon className="h-5.5 w-5.5 stroke-2" />
      </div>
      <div>
        <h3 className="text-[17px] font-extrabold tracking-[-.035em] text-[#0b1230] dark:text-white sm:text-lg">
          {title}
        </h3>
        <p className="mt-1 text-xs font-medium leading-5 text-[#5c6687] dark:text-slate-300">
          {description}
        </p>
      </div>
    </div>
  );
}

function WritingCard({ reduceMotion }) {
  const corrections = [
    ['believes', 'believe', 'rose'],
    ['our life', 'our lives', 'indigo'],
    ['easier', 'easier to manage', 'violet'],
  ];
  return (
    <article className={`${cardClass} min-h-[390px]`}>
      <FeatureHeader
        icon={PenTool}
        title="AI Writing Feedback"
        description="Get expert corrections and improve faster."
      />
      <div className={`${canvasClass} min-h-[242px] flex-1 p-4 sm:p-5`}>
        <div className="grid grid-cols-[minmax(0,1fr)_92px] items-start gap-3 sm:grid-cols-[minmax(0,1fr)_104px]">
          <p className="pt-1 text-[13px] font-medium leading-7 text-[#384469] dark:text-slate-300 sm:text-sm">
            Many people{' '}
            <span className="relative font-bold text-[#b8344a] dark:text-rose-400">
              believes
              <m.span
                className="absolute -bottom-0.5 left-0 h-px w-full bg-[#e14d62]"
                initial={{ scaleX: 0 }}
                animate={reduceMotion ? { scaleX: 1 } : { scaleX: [0, 1, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.2, ...smoothLoop }}
              />
            </span>{' '}
            that technology has made{' '}
            <span className="relative font-bold text-[#4d46eb] dark:text-indigo-400">
              our life
              <m.span
                className="absolute -bottom-0.5 left-0 h-px w-full bg-[#6256ef]"
                initial={{ scaleX: 0 }}
                animate={reduceMotion ? { scaleX: 1 } : { scaleX: [0, 1, 1] }}
                transition={{
                  duration: 2.5,
                  delay: 0.35,
                  repeat: Infinity,
                  repeatDelay: 1.2,
                  ...smoothLoop,
                }}
              />
            </span>{' '}
            easier.
          </p>
          <m.div
            className="rounded-xl border border-[#e5e2fa] bg-white px-3 py-2.5 shadow-[0_12px_22px_-18px_rgba(73,61,201,.6)] dark:border-white/10 dark:bg-white/5 dark:shadow-none"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -2, 0],
                    boxShadow: [
                      '0 12px 22px -18px rgba(73,61,201,.6)',
                      '0 17px 25px -18px rgba(73,61,201,.78)',
                      '0 12px 22px -18px rgba(73,61,201,.6)',
                    ],
                  }
            }
            transition={{ duration: 3.2, repeat: Infinity, ...smoothLoop }}
          >
            <span className="block whitespace-nowrap text-[10px] font-bold text-[#59617b] dark:text-slate-400">
              Band Score
            </span>
            <m.strong
              className="mt-0.5 block text-[28px] font-black leading-none tracking-[-.06em] text-[#6256ef] dark:text-indigo-400"
              animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ...smoothLoop }}
            >
              7.0
            </m.strong>
            <span className="mt-1 inline-flex rounded bg-[#ecfaf5] px-1.5 py-0.5 text-[10px] font-extrabold text-[#168367] dark:bg-emerald-500/15 dark:text-emerald-300">
              ↑ 0.5
            </span>
          </m.div>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-[#e7e8f3] bg-white/95 dark:border-white/10 dark:bg-white/4">
          {corrections.map(([from, to, color], index) => (
            <m.div
              key={from}
              className="flex items-center gap-3 border-b border-[#ececf5] px-3 py-2 last:border-0 dark:border-white/10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.55, delay: index * 0.12, ...smoothLoop }}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${color === 'rose' ? 'bg-rose-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-violet-500'}`}
              />
              <span className="min-w-0 flex-1 text-[11px] font-semibold text-[#354063] dark:text-slate-500">
                <s>{from}</s>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[#8b92ae] dark:text-slate-500" />
              <span className="min-w-0 flex-[1.4] text-[11px] font-bold text-[#243058] dark:text-slate-200">
                {to}
              </span>
            </m.div>
          ))}
        </div>
      </div>
    </article>
  );
}

const leftWaveform = [6, 12, 22, 14, 32, 20, 10, 26, 38, 18, 8, 24, 15, 9, 18, 12];
const rightWaveform = [12, 18, 9, 15, 24, 8, 18, 38, 26, 10, 20, 32, 14, 22, 12, 6];

function SpeakingCard({ reduceMotion }) {
  return (
    <article className={`${cardClass} min-h-[390px]`}>
      <FeatureHeader
        icon={Mic}
        title="Speaking Practice"
        description="Practice fluency and get real-time feedback."
      />
      <div
        className={`${canvasClass} relative flex flex-1 flex-col justify-between overflow-hidden p-5`}
      >
        {/* Soft center ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-[42%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c5cff]/15 blur-3xl dark:bg-[#7c5cff]/6" />

        {/* Main Audio Visualizer Hub (Single center anchor for everything) */}
        <div className="relative flex flex-1 items-center justify-center">
          {/* Concentric subtle aura rings */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[220px] w-[220px] rounded-full border border-[#7d6cf4]/12 dark:border-indigo-400/10" />
            <div className="absolute h-[170px] w-[170px] rounded-full border border-[#7d6cf4]/18 dark:border-indigo-400/14" />
            <div className="absolute h-[124px] w-[124px] rounded-full border border-[#7d6cf4]/24 dark:border-indigo-400/18" />
          </div>

          {/* Audio Waveform Bars (Flanking Left & Right of center mic) */}
          <div className="pointer-events-none absolute inset-x-1 flex items-center justify-between sm:inset-x-3">
            {/* Left Waveform Group */}
            <div className="flex flex-1 items-center justify-end gap-[3px] pr-12 sm:gap-[4px] sm:pr-14">
              {leftWaveform.map((height, index) => {
                const opacity = 0.35 + (index / leftWaveform.length) * 0.65;
                return (
                  <m.span
                    key={`left-wave-${index}`}
                    className="w-[3px] rounded-full bg-[#8b7cff] dark:bg-[#a08fff] sm:w-[3.5px]"
                    style={{ opacity }}
                    animate={
                      reduceMotion
                        ? { height }
                        : {
                            height: [
                              Math.max(4, height * 0.3),
                              height,
                              Math.max(5, height * 0.65),
                              Math.max(4, height * 0.4),
                            ],
                          }
                    }
                    transition={{
                      duration: 1.35,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      delay: index * 0.055,
                      ease: 'easeInOut',
                    }}
                  />
                );
              })}
            </div>

            {/* Right Waveform Group */}
            <div className="flex flex-1 items-center justify-start gap-[3px] pl-12 sm:gap-[4px] sm:pl-14">
              {rightWaveform.map((height, index) => {
                const opacity = 1 - (index / rightWaveform.length) * 0.65;
                return (
                  <m.span
                    key={`right-wave-${index}`}
                    className="w-[3px] rounded-full bg-[#8b7cff] dark:bg-[#a08fff] sm:w-[3.5px]"
                    style={{ opacity }}
                    animate={
                      reduceMotion
                        ? { height }
                        : {
                            height: [
                              Math.max(4, height * 0.35),
                              height,
                              Math.max(5, height * 0.6),
                              Math.max(4, height * 0.45),
                            ],
                          }
                    }
                    transition={{
                      duration: 1.35,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      delay: index * 0.055,
                      ease: 'easeInOut',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Central Microphone Button with Ripple Waves */}
          <div className="relative z-10 flex h-[90px] w-[90px] items-center justify-center">
            {[0, 0.38, 0.76].map((delay) => (
              <m.span
                key={delay}
                className="absolute inset-0 rounded-full border border-[#7d6cf4]/35 bg-[#7d6cf4]/5 dark:border-indigo-400/25 dark:bg-indigo-400/2"
                animate={reduceMotion ? undefined : { scale: [0.85, 1.75], opacity: [0.7, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, delay, ease: 'easeOut' }}
              />
            ))}
            <m.div
              className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-linear-to-br from-[#7e69ff] via-[#6852ff] to-[#5136f5] text-white shadow-[0_12px_30px_rgba(95,73,255,0.45),0_0_18px_rgba(124,92,255,0.22)] border border-white/20"
              animate={reduceMotion ? undefined : { y: [0, -3, 0], scale: [1, 1.02, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Mic className="h-7 w-7 stroke-[2.2] drop-shadow-sm" />
            </m.div>
          </div>
        </div>

        {/* Live Recording Status Badge */}
        <div className="relative z-10 flex justify-center pt-2">
          <div className="flex items-center gap-2.5 rounded-full border border-[#e5e1ff] bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[#30395b] shadow-sm backdrop-blur-md dark:border-white/8 dark:bg-slate-900/75 dark:text-slate-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#6b55ff] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#6b55ff]" />
            </span>
            <span>Recording…</span>
            <span className="ml-1 font-mono font-medium text-[#737d9c] dark:text-slate-400">
              00:38
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function TestsCard({ reduceMotion }) {
  const tests = [
    ['IELTS Academic Test 12', '7.5'],
    ['IELTS Academic Test 11', '7.0'],
    ['IELTS Academic Test 10', '6.5'],
    ['IELTS Academic Test 9', '7.0'],
  ];
  return (
    <article className={`${cardClass} min-h-[390px]`}>
      <FeatureHeader
        icon={FileText}
        title="Full Practice Tests"
        description="Simulate real IELTS tests with timed sections."
      />
      <div className={`${canvasClass} flex-1 p-3`}>
        <div className="mb-2 flex items-center justify-between border-b border-[#ededf5] px-1 pb-2 text-xs dark:border-white/10">
          <span className="font-bold text-[#394260] dark:text-slate-200">Recent Tests</span>
          <span className="font-bold text-[#5d4df0] dark:text-indigo-400">View all</span>
        </div>
        <div className="relative h-[164px] overflow-hidden">
          <m.div
            className="space-y-1.5"
            animate={reduceMotion ? { y: 0 } : { y: [0, -194] }}
            transition={{ duration: 9, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
          >
            {[...tests, ...tests].map(([title, score], index) => (
              <div
                key={`${title}-${index}`}
                aria-hidden={index >= tests.length}
                className="flex h-[43px] items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 transition hover:border-[#e2ddff] hover:bg-[#faf9ff] dark:hover:bg-white/3"
              >
                <m.div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f1efff] text-[#6256ef] dark:bg-indigo-500/15 dark:text-indigo-300"
                  animate={reduceMotion ? undefined : { rotate: [0, -6, 0] }}
                  transition={{
                    duration: 2.6,
                    delay: (index % tests.length) * 0.2,
                    repeat: Infinity,
                    ...smoothLoop,
                  }}
                >
                  <FileText className="h-3.5 w-3.5" />
                </m.div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-[#283252] dark:text-slate-200">
                    {title}
                  </p>
                  <p className="text-[10px] font-medium text-[#77809d] dark:text-slate-500">
                    Completed just now
                  </p>
                </div>
                <m.span
                  className="rounded-lg bg-[#f3f1ff] px-2.5 py-1 text-xs font-black text-[#5d4df0] dark:bg-indigo-500/15 dark:text-indigo-300"
                  animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 2.7,
                    delay: (index % tests.length) * 0.3,
                    repeat: Infinity,
                    ...smoothLoop,
                  }}
                >
                  {score}
                </m.span>
              </div>
            ))}
          </m.div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-linear-to-b from-[#fbfbff] to-transparent dark:from-[#131315]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-[#fbfbff] to-transparent dark:from-[#131315]" />
        </div>
      </div>
    </article>
  );
}

function AnalyticsCard({ reduceMotion }) {
  return (
    <article className={`${cardClass} min-h-[390px]`}>
      <FeatureHeader
        icon={TrendingUp}
        title="Progress Analytics"
        description="Track your band score and see your improvement."
      />
      <div className={`${canvasClass} flex flex-1 items-center gap-3.5 p-4 sm:p-5`}>
        {/* Left Score Card Container */}
        <div className="flex flex-col justify-between self-stretch rounded-xl border border-[#e9e7fa] bg-white/80 p-3.5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] sm:p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737d9b] dark:text-slate-400">
            Overall Band Score
          </span>
          <div>
            <strong className="block text-[40px] font-black tracking-[-.07em] bg-clip-text text-transparent bg-linear-to-br from-[#6256ef] via-[#7a6bff] to-[#5136f5] dark:from-[#8b7cff] dark:via-[#a08fff] dark:to-[#7a6bff] sm:text-[44px]">
              7.0
            </strong>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-md border border-[#ded9ff] bg-[#f2f0ff] px-2 py-0.5 text-[10px] font-black text-[#5e50ee] dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300">
                ↑ 0.5
              </span>
              <span className="text-[10px] font-medium text-[#737d9b] dark:text-slate-400">
                vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Right Chart Inner Card Container */}
        <div className="relative flex flex-1 flex-col justify-between self-stretch rounded-xl border border-[#e9e7fa] bg-white/80 p-3.5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737d9b] dark:text-slate-400">
              Band Improvement
            </span>
            <span className="rounded-md border border-[#ded9ff] bg-[#f2f0ff] px-2 py-0.5 text-[9px] font-black text-[#5e50ee] dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300">
              🎯 Band 8.0 Goal
            </span>
          </div>

          <svg
            viewBox="0 0 320 136"
            className="h-[128px] w-full overflow-visible"
            aria-label="Band score improvement chart"
          >
            <defs>
              <linearGradient id="feature-area-single" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#635bff" stopOpacity=".32" />
                <stop offset="1" stopColor="#635bff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Reference Grid Lines */}
            <line
              x1="10"
              y1="48"
              x2="307"
              y2="48"
              className="stroke-[#e8e5fa] dark:stroke-white/10"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <line
              x1="10"
              y1="88"
              x2="307"
              y2="88"
              className="stroke-[#e8e5fa] dark:stroke-white/10"
              strokeDasharray="3 3"
              strokeWidth="1"
            />

            {/* Single Clean Band Score Line Path */}
            <path
              d="M10 100 L10 108 L307 108 L307 28 L248 48 L184 56 L117 69 L50 88 Z"
              fill="url(#feature-area-single)"
            />
            <m.path
              d="M10 100 L50 88 L117 69 L184 56 L248 48 L307 28"
              fill="none"
              stroke="#635bff"
              strokeWidth="2.8"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 1.8,
                repeat: reduceMotion ? 0 : Infinity,
                repeatDelay: 2.5,
              }}
            />

            {/* Actual Score Data Nodes */}
            {[
              [10, 100],
              [50, 88],
              [117, 69],
              [184, 56],
              [248, 48],
              [307, 28],
            ].map(([cx, cy], i) => (
              <m.circle
                key={cx}
                cx={cx}
                cy={cy}
                r="4.5"
                fill="#635bff"
                stroke="#ffffff"
                strokeWidth="1.5"
                // Framer needs an explicit starting radius; without it the first
                // SVG render emits r="undefined" and the browser logs an error.
                initial={{ r: 4.5 }}
                animate={reduceMotion ? undefined : { r: i === 5 ? [4.5, 7, 4.5] : 4.5 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </svg>

          <div className="flex justify-between text-[9px] font-semibold text-[#737d9b] dark:text-slate-500">
            <span>May 1</span>
            <span>May 15</span>
            <span>Jun 1</span>
            <span>Jun 15</span>
            <span>Jun 30</span>
          </div>
        </div>
      </div>
    </article>
  );
}

const wordList = [
  {
    word: 'Resilient',
    pos: 'adjective',
    definition: 'Able to recover quickly and keep improving after setbacks.',
    level: 'C1',
    retention: 78,
  },
  {
    word: 'Meticulous',
    pos: 'adjective',
    definition: 'Showing great attention to detail; careful and precise.',
    level: 'C1',
    retention: 85,
  },
  {
    word: 'Eloquence',
    pos: 'noun',
    definition: 'Fluent or persuasive speaking or writing that moves listeners.',
    level: 'C2',
    retention: 92,
  },
  {
    word: 'Pragmatic',
    pos: 'adjective',
    definition: 'Dealing with things sensibly and realistically based on practical considerations.',
    level: 'B2',
    retention: 64,
  },
];

function VocabularyCard({ reduceMotion }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % wordList.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  const current = wordList[activeIndex];
  const nextWord1 = wordList[(activeIndex + 1) % wordList.length];
  const nextWord2 = wordList[(activeIndex + 2) % wordList.length];
  const nextWord3 = wordList[(activeIndex + 3) % wordList.length];

  const pronounce = () => {
    setIsPlaying(true);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(current.word);
      utterance.onend = utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else setTimeout(() => setIsPlaying(false), 700);
  };

  const smoothCurve = [0.16, 1, 0.3, 1];

  return (
    <article className={`${cardClass} min-h-[390px]`}>
      <FeatureHeader
        icon={BookOpen}
        title="Vocabulary Builder"
        description="Learn high-frequency words that boost your band."
      />
      <div
        className={`${canvasClass} relative flex flex-1 items-center justify-center p-4 sm:p-5 overflow-hidden`}
      >
        {/* Layer 4 (Deepest Back - Soft Pastel Pink/Rose Tint peeking furthest right) */}
        <m.div
          key={`layer4-${nextWord3.word}`}
          className="absolute h-[166px] w-[75%] rounded-2xl border border-[#e8c6e5] bg-linear-to-br from-[#f8e6f6] to-[#f1d4ed] p-3.5 shadow-sm dark:border-white/[0.07] dark:from-pink-950/20 dark:to-purple-950/20 sm:w-[70%]"
          animate={
            reduceMotion
              ? { rotate: 6, x: 44, y: 0, opacity: 0.75 }
              : { rotate: [6, 7.5, 6], x: [44, 48, 44], y: [0, -2, 0], opacity: 0.75 }
          }
          transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Layer 3 (Second Back - Soft Pastel Lilac/Violet Tint peeking right) */}
        <m.div
          key={`layer3-${nextWord2.word}`}
          className="absolute h-[168px] w-[77%] rounded-2xl border border-[#d5c7ff] bg-linear-to-br from-[#e4dcfd] to-[#d8cbfe] p-3.5 shadow-sm dark:border-white/[0.07] dark:from-violet-950/25 dark:to-indigo-950/25 sm:w-[72%]"
          animate={
            reduceMotion
              ? { rotate: 4, x: 28, y: -2, opacity: 0.85 }
              : { rotate: [4, 5.5, 4], x: [28, 32, 28], y: [-2, -4, -2], opacity: 0.85 }
          }
          transition={{ duration: 5.0, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Layer 2 (First Back - Soft Pastel Light Lavender Tint peeking right) */}
        <m.div
          key={`layer2-${nextWord1.word}`}
          className="absolute h-[170px] w-[79%] rounded-2xl border border-[#ded4fe] bg-linear-to-br from-[#eeeafe] to-[#e4dcfe] p-4 shadow-md dark:border-white/[0.07] dark:bg-none dark:bg-[#24233a] sm:w-[74%]"
          animate={
            reduceMotion
              ? { rotate: 2, x: 14, y: -4, opacity: 0.95 }
              : { rotate: [2, 3.5, 2], x: [14, 18, 14], y: [-4, -6, -4], opacity: 0.95 }
          }
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Floating Skill Badge (Top-left) */}
        <m.div
          key={`badge-${current.level}`}
          className="absolute left-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-xl border border-[#ded9ff] bg-white text-xs font-black text-[#6256ef] shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-violet-300"
          animate={reduceMotion ? { rotate: -8 } : { y: [0, -4, 0], rotate: [-8, -4, -8] }}
          transition={{ duration: 3.6, repeat: Infinity, ...smoothLoop }}
        >
          {current.level}
        </m.div>

        {/* Floating Mastered Pill (Bottom-right) */}
        <m.div
          className="absolute bottom-3 right-3 z-30 flex items-center gap-1 rounded-full border border-[#ded9ff] bg-[#f2f0ff] px-2.5 py-1 text-xs font-black text-[#5e50ee] shadow-sm dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300"
          animate={reduceMotion ? { scale: 1 } : { y: [0, 4, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 3.2, delay: 0.35, repeat: Infinity, ...smoothLoop }}
        >
          <span>✨</span> +12 words
        </m.div>

        {/* Layer 1 (Front Active Card - Pure Crisp White on left side) */}
        <AnimatePresence>
          <m.div
            key={current.word}
            initial={{ opacity: 0, x: 40, y: 10, scale: 0.95, rotate: 3 }}
            animate={{ opacity: 1, x: -16, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: -130, y: -12, rotate: -12, scale: 0.88 }}
            transition={{ duration: 0.55, ease: smoothCurve }}
            className="absolute z-20 w-[78%] rounded-2xl border border-[#e4e3f2] bg-white/95 p-4 shadow-[0_20px_45px_-16px_rgba(40,35,125,0.38)] backdrop-blur-md dark:border-white/[0.07] dark:bg-slate-900/90 dark:shadow-none sm:w-[73%]"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-extrabold tracking-[.14em] text-[#5e50ee] dark:text-violet-300">
                WORD OF THE DAY
              </span>
              <button
                type="button"
                aria-label={`Pronounce ${current.word}`}
                onClick={pronounce}
                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f0ff] text-[#6256ef] transition hover:bg-[#e4e0ff] dark:bg-violet-500/15 dark:text-violet-300"
              >
                <Volume2 className="h-4 w-4" />
                {isPlaying && (
                  <m.span
                    className="absolute inset-0 rounded-full border border-[#6256ef]"
                    animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                    transition={{ duration: 0.65, repeat: Infinity }}
                  />
                )}
              </button>
            </div>
            <h4 className="mt-1 text-[23px] font-black tracking-[-.055em] text-[#101836] dark:text-white">
              {current.word}
            </h4>
            <p className="text-[11px] font-bold text-[#5e50ee] dark:text-violet-300">
              {current.pos}
            </p>
            <p className="mt-1.5 text-xs font-medium leading-5 text-[#56617f] dark:text-slate-300">
              {current.definition}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[#5e50ee] dark:text-violet-300">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ede9ff] dark:bg-slate-800">
                <m.span
                  className="block h-full rounded-full bg-linear-to-r from-[#6256ef] to-[#8b7cff]"
                  initial={{ width: 0 }}
                  animate={{ width: `${current.retention}%` }}
                  transition={{ duration: 0.7, ease: smoothCurve }}
                />
              </span>
              {current.retention}% retained
            </div>
          </m.div>
        </AnimatePresence>

        {/* Stack Dots Indicator */}
        <div className="absolute bottom-2.5 z-30 flex gap-1.5">
          {wordList.map((w, i) => (
            <button
              key={w.word}
              type="button"
              aria-label={`View word ${w.word}`}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-4 bg-[#6256ef]' : 'w-1.5 bg-[#dedbf5] hover:bg-[#b0a7ff] dark:bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function FeaturesSection({ viewport }) {
  const reduceMotion = useReducedMotion();
  return (
    <SoftSection className="bg-[#faf9ff] py-16 dark:bg-[#08080a] lg:py-24">
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="BUILT TO HELP YOU SCORE"
          title="Everything you need to"
          script="reach your target band."
          description="AI tools to practice smarter and achieve your best IELTS score."
          viewport={viewport}
        />
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={landingStagger}
          className="mt-10 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-12"
        >
          <m.div variants={landingReveal} className="h-full lg:col-span-4">
            <WritingCard reduceMotion={reduceMotion} />
          </m.div>
          <m.div variants={landingReveal} className="h-full lg:col-span-4">
            <SpeakingCard reduceMotion={reduceMotion} />
          </m.div>
          <m.div variants={landingReveal} className="h-full md:col-span-2 lg:col-span-4">
            <TestsCard reduceMotion={reduceMotion} />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-6">
            <AnalyticsCard reduceMotion={reduceMotion} />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-6">
            <VocabularyCard reduceMotion={reduceMotion} />
          </m.div>
        </m.div>
      </div>
    </SoftSection>
  );
}
