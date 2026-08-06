import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookOpen, Check, Headphones, Sparkles, TrendingUp } from 'lucide-react';
import { SectionHeading, SoftSection } from './LandingSection';

const cardClass =
  'group relative flex h-full flex-col justify-between rounded-[26px] border border-[#e2e5fa] bg-white/95 p-5 sm:p-6 shadow-[0_20px_50px_-25px_rgba(79,66,220,0.22)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:border-[#6256ef]/40 hover:shadow-[0_30px_65px_-24px_rgba(82,98,239,0.38)] dark:border-white/10 dark:bg-linear-to-b dark:from-[#131315] dark:to-[#131315] dark:backdrop-blur-none dark:hover:border-violet-500/35';

const canvasClass =
  'relative mt-4 flex flex-1 flex-col justify-center overflow-hidden rounded-[18px] border border-[#e7e4fb] bg-linear-to-b from-[#fcfbff] via-[#faf9ff] to-[#f4f2ff] p-3.5 sm:p-4 dark:border-white/10 dark:bg-white/3 dark:bg-none';

const smoothLoop = { ease: [0.45, 0, 0.55, 1] };

const steps = [
  {
    number: '01',
    title: 'Choose a Practice Task',
    copy: 'Select Reading, Listening, Writing, or Speaking and practice in a focused workspace.',
  },
  {
    number: '02',
    title: 'Review Your Feedback',
    copy: 'Review answers or estimated AI feedback, depending on the skill you completed.',
  },
  {
    number: '03',
    title: 'Follow a Focused Plan',
    copy: 'Turn your practice history, target band, and schedule into clear daily next steps.',
  },
  {
    number: '04',
    title: 'Track Your Progress',
    copy: 'Use saved attempts and skill analytics to decide where your next session should go.',
  },
];

function TestPreview({ reduceMotion }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between rounded-xl border border-[#ded9ff] bg-white/80 p-2.5 shadow-xs dark:border-white/10 dark:bg-white/5">
        <span className="flex items-center gap-2 text-xs font-extrabold text-[#1a1d36] dark:text-slate-200">
          <Headphones className="h-3.5 w-3.5 text-[#6256ef]" />
          Listening Test
        </span>
        <span className="text-[10px] font-bold text-[#737d9b]">30 mins</span>
      </div>

      {/* Dynamic Animated Waveform */}
      <div className="flex h-10 items-center justify-between gap-1 rounded-xl border border-[#ded9ff] bg-[#f2f0ff]/60 px-3 dark:border-violet-500/20 dark:bg-violet-950/30">
        {Array.from({ length: 22 }).map((_, i) => (
          <m.span
            key={i}
            className="w-0.5 rounded-full bg-[#6256ef]"
            animate={
              reduceMotion
                ? undefined
                : {
                    height: [
                      `${6 + ((i * 7) % 18)}px`,
                      `${14 + ((i * 11) % 18)}px`,
                      `${6 + ((i * 7) % 18)}px`,
                    ],
                  }
            }
            transition={{
              duration: 1.4 + (i % 4) * 0.25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ opacity: 0.65 + (i % 4) * 0.1 }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#e8e5fa] bg-white/60 p-2.5 dark:border-white/10 dark:bg-white/5">
        <span className="flex items-center gap-2 text-xs font-extrabold text-[#2d334e] dark:text-slate-200">
          <BookOpen className="h-3.5 w-3.5 text-[#8b7cff]" />
          Reading Test
        </span>
        <span className="text-[10px] font-bold text-[#737d9b]">60 mins</span>
      </div>
    </div>
  );
}

function FeedbackPreview({ reduceMotion }) {
  return (
    <div className="space-y-2.5 text-left">
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#737d9b]">
            Writing Evaluation
          </span>
          <strong className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-[#6256ef] to-[#8b7cff] dark:to-violet-300">
            Band 7.0
          </strong>
        </div>
        <span className="rounded-md border border-[#ded9ff] bg-[#f2f0ff] px-2 py-0.5 text-[10px] font-black text-[#5e50ee] dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300">
          ✨ AI Evaluated
        </span>
      </div>

      {/* Grammar Error Correction Highlight */}
      <div className="rounded-xl border border-[#ded9ff] bg-white/80 p-2.5 text-xs font-medium leading-relaxed text-[#2d334e] dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200">
        <div>
          <span className="text-[#737d9b]">Sample: </span>
          &quot;Governments{' '}
          <span className="line-through text-rose-500 font-bold px-0.5">should provides</span>{' '}
          <m.span
            animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ...smoothLoop }}
            className="inline-block rounded-md border border-[#ded9ff] bg-[#f2f0ff] px-1.5 py-0.5 font-black text-[#5e50ee] dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300"
          >
            should provide
          </m.span>{' '}
          more funding.&quot;
        </div>
      </div>
    </div>
  );
}

function PlanPreview({ reduceMotion }) {
  return (
    <div className="space-y-2.5 text-left">
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5e50ee] dark:text-violet-400">
            Personalized Study Plan
          </span>
          <span className="text-xs font-bold text-[#737d9b]">Daily Goal: 30 mins</span>
        </div>
        <span className="rounded-md border border-[#ded9ff] bg-[#f2f0ff] px-2 py-0.5 text-[9px] font-black text-[#5e50ee] dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300">
          3/3 Done
        </span>
      </div>

      <div className="space-y-1.5">
        {[
          { name: 'Listening Practice', done: true },
          { name: 'Reading Strategy', done: true },
          { name: 'Writing Task 2', done: true, pct: '75%' },
        ].map((item, idx) => (
          <m.div
            key={item.name}
            initial={reduceMotion ? undefined : { opacity: 0, x: -8 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="flex items-center justify-between rounded-xl border border-[#ded9ff] bg-white/80 p-2 text-xs font-bold text-[#2d334e] shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#6256ef] text-[10px] font-black text-white shadow-xs">
                <Check className="h-2.5 w-2.5 stroke-3" />
              </span>
              <span className="truncate">{item.name}</span>
            </div>
            {item.pct && (
              <span className="text-[10px] font-black text-[#5e50ee] dark:text-violet-300">
                {item.pct}
              </span>
            )}
          </m.div>
        ))}
      </div>
    </div>
  );
}

function GoalPreview({ reduceMotion }) {
  return (
    <div className="space-y-2.5 text-left">
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#737d9b]">
            Practice History
          </span>
          <strong className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-[#6256ef] to-[#8b7cff] dark:to-violet-300">
            Band 7.5
          </strong>
        </div>
        <span className="rounded-md border border-[#ded9ff] bg-[#f2f0ff] px-2 py-0.5 text-[10px] font-black text-[#5e50ee] dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300">
          Saved ✓
        </span>
      </div>

      {/* SVG Animated Chart Line */}
      <div className="relative pt-1">
        <svg viewBox="0 0 220 50" className="w-full overflow-visible" aria-label="Progress graph">
          <defs>
            <linearGradient id="goal-area" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#635bff" stopOpacity=".25" />
              <stop offset="1" stopColor="#635bff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d="M2 42 C30 35, 43 25, 66 28 S98 15, 119 18 S151 8, 176 10 S203 4, 218 2 L218 50 L2 50 Z"
            fill="url(#goal-area)"
          />
          <m.path
            d="M2 42 C30 35, 43 25, 66 28 S98 15, 119 18 S151 8, 176 10 S203 4, 218 2"
            fill="none"
            stroke="#635bff"
            strokeWidth="2.8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 2.2,
              repeat: reduceMotion ? 0 : Infinity,
              repeatDelay: 2,
            }}
          />
          <m.circle
            cx="218"
            cy="2"
            r="4"
            fill="#635bff"
            stroke="#ffffff"
            strokeWidth="1.5"
            // Explicit starting radius keeps the first SVG render from emitting
            // r="undefined", which the browser reports as a console error.
            initial={{ r: 4 }}
            animate={reduceMotion ? undefined : { r: [4, 6, 4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </svg>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function HowItWorksSection({ viewport }) {
  const reduceMotion = useReducedMotion();

  const previews = [
    <TestPreview key="test" reduceMotion={reduceMotion} />,
    <FeedbackPreview key="feedback" reduceMotion={reduceMotion} />,
    <PlanPreview key="plan" reduceMotion={reduceMotion} />,
    <GoalPreview key="goal" reduceMotion={reduceMotion} />,
  ];

  return (
    <SoftSection
      id="how-it-works"
      className="scroll-mt-24 bg-[#faf9ff] dark:bg-[#08080a] py-16 lg:py-24"
    >
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8 space-y-10">
        <SectionHeading
          eyebrow="HOW IELTS AI PRO WORKS"
          title="Practice. Review."
          script="Improve."
          description="Use one clear workflow across IELTS Reading, Listening, Writing, and Speaking practice."
          viewport={viewport}
        />

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="grid gap-5 lg:grid-cols-4 relative"
        >
          {steps.map((step, index) => (
            <m.article
              key={step.title}
              variants={cardVariants}
              className={cardClass}
              style={{ zIndex: 40 - index }}
            >
              <div className="space-y-4">
                {/* Step Header */}
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#ded9ff] bg-[#f2f0ff] text-xs font-black text-[#5e50ee] shadow-2xs dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300">
                    {step.number}
                  </span>
                  <h3 className="text-sm font-extrabold text-[#101836] transition-colors group-hover:text-[#5e50ee] dark:text-white dark:group-hover:text-violet-300">
                    {step.title}
                  </h3>
                </div>

                {/* Inner Canvas Preview Container matching FeaturesSection */}
                <div className={canvasClass}>{previews[index]}</div>

                <p className="text-xs font-medium leading-relaxed text-[#56617f] dark:text-slate-400">
                  {step.copy}
                </p>
              </div>

              {/* Animated Floating Connector Arrow between cards */}
              {index < steps.length - 1 && (
                <div className="absolute right-[-22px] top-1/2 z-40 hidden -translate-y-1/2 items-center justify-center pointer-events-none lg:flex">
                  <m.span
                    animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ...smoothLoop }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ded9ff] bg-white text-[#5e50ee] shadow-sm backdrop-blur-md dark:border-violet-500/30 dark:bg-slate-900 dark:text-violet-300"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </m.span>
                </div>
              )}
            </m.article>
          ))}
        </m.div>
      </div>
    </SoftSection>
  );
}
