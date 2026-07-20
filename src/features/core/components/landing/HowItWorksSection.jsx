import React from 'react';
import { m } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  Headphones,
  Mic2,
  Sparkles,
  Target,
} from 'lucide-react';
import { GlassPanel, SectionHeading, SoftSection } from './LandingSection';

const steps = [
  {
    number: '01',
    title: 'Choose a Practice Task',
    icon: Headphones,
    copy: 'Choose Reading, Listening, Writing, or Speaking and practise in a focused workspace.',
    color: '#5262ef',
  },
  {
    number: '02',
    title: 'Review Your Feedback',
    icon: Sparkles,
    copy: 'Review answers or estimated AI feedback, depending on the skill you completed.',
    color: '#2aae83',
  },
  {
    number: '03',
    title: 'Follow a Focused Plan',
    icon: CalendarDays,
    copy: 'Eligible plans turn your practice history, target band, and schedule into next steps.',
    color: '#805be4',
  },
  {
    number: '04',
    title: 'Track Your Progress',
    icon: Target,
    copy: 'Use saved attempts and skill analytics to decide where your next session should go.',
    color: '#3e67ed',
  },
];

function TestPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-[#f5f8ff] p-3 dark:bg-white/5">
        <span className="flex items-center gap-2 text-xs font-bold text-[#1b2942] dark:text-slate-200">
          <Headphones className="h-4 w-4 text-[#5262ef]" />
          Listening Test
        </span>
        <small className="text-slate-400">30 mins</small>
      </div>
      {/* Dynamic Pulsing Waveform */}
      <div className="flex h-12 items-center justify-between gap-1 rounded-xl bg-white/70 px-3 dark:bg-white/5">
        {Array.from({ length: 28 }).map((_, i) => (
          <m.span
            key={i}
            className="w-0.5 rounded-full bg-[#6c82ed]"
            animate={{
              height: [
                `${7 + ((i * 9) % 27)}px`,
                `${14 + ((i * 13) % 20)}px`,
                `${7 + ((i * 9) % 27)}px`,
              ],
            }}
            transition={{
              duration: 1.5 + (i % 4) * 0.35,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ opacity: 0.5 + (i % 4) * 0.15 }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between rounded-xl bg-[#f5f8ff] p-3 dark:bg-white/5">
        <span className="text-xs font-bold text-[#1b2942] dark:text-slate-200">Reading Test</span>
        <small className="text-slate-400">60 mins</small>
      </div>
    </div>
  );
}

function FeedbackPreview() {
  return (
    <div className="space-y-3 text-left">
      <div className="flex justify-between items-start">
        <div>
          <small className="font-bold text-slate-400 dark:text-slate-400">Writing Evaluation</small>
          <strong className="block text-2xl font-black text-[#0f172a] dark:text-white">
            Band 7.0
          </strong>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ecfdf5] border border-emerald-100 text-xs font-black text-[#10b981] dark:bg-emerald-950/20 dark:border-emerald-900/30">
          AI
        </div>
      </div>

      {/* Grammar error highlights */}
      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-[11px] font-medium leading-relaxed text-slate-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-slate-300">
        <span className="text-slate-400">... IELTS Essay sample: </span>
        &quot;Governments{' '}
        <span className="bg-red-100 dark:bg-red-950/60 px-1 py-0.5 rounded text-red-700 dark:text-red-300 font-bold border-b border-red-400">
          should provides
        </span>{' '}
        more funding for public transportation.&quot;
        {/* Tooltip suggestions */}
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-900 p-2 shadow-sm border border-amber-200/50 text-[10px] font-bold text-[#5262ef]">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Grammar: Change to &quot;should provide&quot;</span>
        </div>
      </div>
    </div>
  );
}

function PlanPreview() {
  return (
    <div className="text-left">
      <b className="text-xs text-[#4b2ba3] dark:text-violet-300">Personalized Study Plan</b>
      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        Study 30 mins daily
      </p>
      <div className="mt-3.5 space-y-2.5">
        {['Listening Practice', 'Reading Strategy', 'Writing Task 2', 'Speaking Practice'].map(
          (x, i) => (
            <div
              key={x}
              className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300"
            >
              <m.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.3 }}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${i < 3 ? 'bg-[#55c998] text-white' : 'border-2 border-violet-400'}`}
              >
                {i < 3 && <Check className="h-2.5 w-2.5" />}
              </m.span>
              <span className="flex-1 truncate">{x}</span>
              {i === 2 && <b className="text-violet-600 dark:text-violet-400">75%</b>}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function GoalPreview() {
  return (
    <div className="text-left">
      <div className="flex justify-between items-start">
        <div>
          <small className="font-bold text-slate-400 dark:text-slate-400">Practice History</small>
          <strong className="block text-2xl font-black text-[#0f172a] dark:text-white">
            Band 7.5
          </strong>
        </div>
        <span className="flex h-7 items-center gap-1 rounded-full bg-[#eaf9f4] px-2.5 text-[9px] font-bold text-[#218b75]">
          <Check className="h-2.5 w-2.5" />
          Saved
        </span>
      </div>
      {/* Animated SVG Path drawing */}
      <svg viewBox="0 0 230 80" className="mt-3 w-full overflow-visible">
        <path
          d="M2 72 C30 65, 43 52, 66 56 S98 41, 119 43 S151 25, 176 28 S203 13, 228 6"
          fill="none"
          stroke="#4b70fa"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
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
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 90,
      damping: 14,
    },
  },
};

export default function HowItWorksSection({ viewport }) {
  return (
    <SoftSection id="how-it-works" className="scroll-mt-24 border-y border-[#e9eef8]/70">
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="How IELTS Ai Pro works"
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
          className="mt-12"
        >
          <GlassPanel className="rounded-[32px] p-4 md:p-7 shadow-[0_24px_55px_-30px_rgba(30,41,59,0.06)]">
            <div className="grid gap-6 lg:grid-cols-4">
              {steps.map((step, index) => (
                <m.article
                  key={step.title}
                  variants={cardVariants}
                  className="group relative bg-gradient-to-b from-white to-slate-50/50 dark:from-[#111827] dark:to-[#0f172a] border border-[#cbd5e1]/70 dark:border-white/15 rounded-[28px] p-5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.07)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.55)] transition-all duration-300 hover:shadow-[0_25px_55px_-12px_rgba(82,98,239,0.22)] hover:border-[#a4b5fc]/60 hover:-translate-y-1.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#eff0ff] to-[#e7e9ff] text-lg font-black text-[#5262ef] ring-1 ring-[#dadcff]/60 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      {step.number}
                    </span>
                    <h3 className="font-black tracking-tight text-[#0d1932] dark:text-white transition-colors duration-300 group-hover:text-[#5262ef]">
                      {step.title}
                    </h3>
                  </div>
                  {/* Premium Glowing Card Container */}
                  <div className="mt-4 min-h-[225px] rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-slate-950/40 p-4 transition-all duration-300 group-hover:bg-slate-50 dark:group-hover:bg-slate-950/70">
                    {previews[index]}
                  </div>
                  <p className="mt-4 text-xs font-semibold leading-relaxed text-[#59667b] dark:text-slate-300 text-left">
                    {step.copy}
                  </p>

                  {/* Pulsing Arrow Flow Connector */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-7 top-[42%] z-10 hidden items-center justify-center lg:flex select-none">
                      <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-[#5262ef]/15 opacity-75" />
                      <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#dadcff] bg-white text-[#5262ef] shadow-sm cursor-default transition-all duration-300 group-hover:bg-[#5262ef] group-hover:text-white group-hover:border-[#5262ef]">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  )}
                </m.article>
              ))}
            </div>
            <div className="mt-8 grid gap-4 p-1.5 md:grid-cols-4">
              {[
                {
                  icon: Sparkles,
                  title: 'Writing feedback',
                  copy: 'Criterion-level guidance',
                  bg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 border-amber-100/50 dark:border-amber-900/20',
                },
                {
                  icon: Mic2,
                  title: 'Speaking review',
                  copy: 'Practice estimates and tips',
                  bg: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 border-indigo-100/50 dark:border-indigo-900/20',
                },
                {
                  icon: BarChart3,
                  title: 'Progress analytics',
                  copy: 'Saved practice history',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border-emerald-100/50 dark:border-emerald-900/20',
                },
                {
                  icon: Target,
                  title: 'Adaptive learning path',
                  copy: 'Available on eligible plans',
                  bg: 'bg-sky-50 dark:bg-sky-950/20 text-sky-500 border-sky-100/50 dark:border-sky-900/20',
                },
              ].map(({ icon: Icon, title, copy, bg }) => (
                <div
                  key={title}
                  className="group/item flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3.5 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_36px_-10px_rgba(82,98,239,0.18)] hover:border-slate-350 dark:border-white/10 dark:from-slate-900 dark:to-slate-950 dark:hover:border-white/15"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${bg} transition-transform duration-300 group-hover/item:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <b className="block text-xs font-bold text-[#1b2942] dark:text-white transition-colors duration-300 group-hover/item:text-[#5262ef]">
                      {title}
                    </b>
                    <small className="mt-0.5 block text-[10px] font-medium text-[#6b7588] dark:text-slate-400 leading-tight">
                      {copy}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </m.div>
      </div>
    </SoftSection>
  );
}
