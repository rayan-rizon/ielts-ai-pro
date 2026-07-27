import React from 'react';
import { m } from 'framer-motion';
import { ArrowRight, BookOpen, Headphones, Sparkles } from 'lucide-react';
import { SectionHeading, SoftSection } from './LandingSection';

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

function TestPreview() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/50 p-2.5 border border-slate-200/70 dark:border-slate-800">
        <span className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-slate-200">
          <Headphones className="h-3.5 w-3.5 text-[#635BFF]" />
          Listening Test
        </span>
        <span className="text-[10px] font-bold text-slate-400">30 mins</span>
      </div>

      {/* Dynamic Waveform */}
      <div className="flex h-10 items-center justify-between gap-1 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 px-3 border border-indigo-100 dark:border-indigo-900/30">
        {Array.from({ length: 24 }).map((_, i) => (
          <m.span
            key={i}
            className="w-0.5 rounded-full bg-[#635BFF]"
            animate={{
              height: [
                `${6 + ((i * 7) % 20)}px`,
                `${12 + ((i * 11) % 18)}px`,
                `${6 + ((i * 7) % 20)}px`,
              ],
            }}
            transition={{
              duration: 1.4 + (i % 4) * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ opacity: 0.6 + (i % 4) * 0.1 }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/50 p-2.5 border border-slate-200/70 dark:border-slate-800">
        <span className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-slate-200">
          <BookOpen className="h-3.5 w-3.5 text-blue-500" />
          Reading Test
        </span>
        <span className="text-[10px] font-bold text-slate-400">60 mins</span>
      </div>
    </div>
  );
}

function FeedbackPreview() {
  return (
    <div className="space-y-2.5 text-left">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Writing Evaluation
          </span>
          <strong className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
            Band 7.0
          </strong>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
          AI Evaluated
        </span>
      </div>

      {/* Grammar error highlights */}
      <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300 space-y-1.5">
        <div>
          <span className="text-slate-400">Sample: </span>
          &quot;Governments{' '}
          <span className="line-through text-rose-500 font-bold px-0.5">should provides</span>{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
            should provide
          </span>{' '}
          more funding.&quot;
        </div>
      </div>
    </div>
  );
}

function PlanPreview() {
  return (
    <div className="text-left space-y-2.5">
      <div>
        <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
          Personalized Study Plan
        </span>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Daily Goal: 30 mins
        </span>
      </div>

      <div className="space-y-1.5 pt-0.5">
        {[
          { name: 'Listening Practice', done: true },
          { name: 'Reading Strategy', done: true },
          { name: 'Writing Task 2', done: true, pct: '75%' },
        ].map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                ✓
              </span>
              <span className="truncate">{item.name}</span>
            </div>
            {item.pct && (
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400">
                {item.pct}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalPreview() {
  return (
    <div className="text-left space-y-2.5">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Practice History
          </span>
          <strong className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
            Band 7.5
          </strong>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
          Saved ✓
        </span>
      </div>

      {/* SVG Path */}
      <div className="relative pt-1">
        <svg viewBox="0 0 220 50" className="w-full overflow-visible">
          <path
            d="M2 42 C30 35, 43 25, 66 28 S98 15, 119 18 S151 8, 176 10 S203 4, 218 2"
            fill="none"
            stroke="#635BFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="218" cy="2" r="3" fill="#635BFF" />
        </svg>
      </div>
    </div>
  );
}

const previews = [
  <TestPreview key="test" />,
  <FeedbackPreview key="feedback" />,
  <PlanPreview key="plan" />,
  <GoalPreview key="goal" />,
];

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
  return (
    <SoftSection
      id="how-it-works"
      className="scroll-mt-24 bg-[#f5f7fc] dark:bg-[#080d1e] py-16 lg:py-24"
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
              className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Step Header */}
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-[#635BFF] dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
                    {step.number}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-[#635BFF] dark:group-hover:text-indigo-400 transition-colors">
                    {step.title}
                  </h3>
                </div>

                {/* Preview Graphic */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800">
                  {previews[index]}
                </div>

                <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.copy}
                </p>
              </div>

              {/* Visible Connector Arrow between cards */}
              {index < steps.length - 1 && (
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center pointer-events-none">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#635BFF] bg-white dark:bg-slate-900 text-[#635BFF] dark:text-indigo-400 shadow-md">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              )}
            </m.article>
          ))}
        </m.div>
      </div>
    </SoftSection>
  );
}
