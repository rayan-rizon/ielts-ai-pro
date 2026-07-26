import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  Mic2,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import {
  GlassPanel,
  SectionHeading,
  SoftSection,
  landingReveal,
  landingStagger,
} from './LandingSection';

const steps = [
  {
    number: '1',
    title: 'Mock Test',
    copy: 'Take a real test, just like the real thing.',
    icon: ClipboardCheck,
    color: '#5262ef',
    lift: 'lg:mt-28',
  },
  {
    number: '2',
    title: 'AI Analysis',
    copy: 'Get instant, AI-powered feedback.',
    icon: Sparkles,
    color: '#2aae83',
    lift: 'lg:mt-20',
  },
  {
    number: '3',
    title: 'Smart Study Plan',
    copy: 'Follow a plan made just for you.',
    icon: CalendarDays,
    color: '#8358e8',
    lift: 'lg:mt-10',
  },
  {
    number: '4',
    title: 'Real Improvement',
    copy: 'Track progress. Hit your target.',
    icon: Target,
    color: '#3f66ef',
    lift: 'lg:mt-0',
  },
];

function MockTestBody() {
  return (
    <div className="mt-4 rounded-2xl bg-[#f7f9ff] p-4 dark:bg-white/5">
      <b className="text-xs text-[#284dc2]">Full Mock Test</b>
      <div className="mt-3 space-y-2">
        {[
          ['Listening', '30 mins'],
          ['Reading', '60 mins'],
          ['Writing', '60 mins'],
          ['Speaking', '11–14 mins'],
        ].map(([a, b]) => (
          <div key={a} className="flex justify-between text-[11px] text-[#5d6980]">
            <span>{a}</span>
            <b>{b}</b>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-3">
        <span className="text-[10px] font-bold text-slate-500">Estimated band</span>
        <strong className="text-3xl font-black text-[#5262ef]">6.5</strong>
      </div>
    </div>
  );
}

function AnalysisBody() {
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl bg-[#edfaf6] p-4 dark:bg-emerald-400/10">
        <span className="text-xs font-bold text-[#38594e]">Overall Band Estimate</span>
        <div className="mt-1 flex items-center justify-between">
          <strong className="text-4xl font-black text-[#199174]">6.5</strong>
          <span className="text-xs font-bold text-[#176d5d]">Good</span>
        </div>
      </div>
      {[
        ['Speaking Feedback', '6.0'],
        ['Writing Feedback', '6.5'],
      ].map(([x, y]) => (
        <div
          key={x}
          className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/70 p-3 text-[11px] dark:border-white/10 dark:bg-white/5"
        >
          <Mic2 className="h-4 w-4 text-[#5262ef]" />
          <span className="flex-1 font-bold text-[#344159]">{x}</span>
          <b className="text-[#5262ef]">{y}</b>
        </div>
      ))}
    </div>
  );
}

function PlanBody() {
  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
      <b className="text-xs text-[#4d2ca6]">Your Weekly Plan</b>
      <div className="mt-3 space-y-3">
        {['Listening Practice', 'Reading Strategy', 'Writing Task 2', 'Speaking Practice'].map(
          (x, i) => (
            <div key={x} className="flex items-center gap-2 text-[11px] text-[#526076]">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full ${i < 3 ? 'bg-[#55c998] text-white' : 'border-2 border-violet-400'}`}
              >
                {i < 3 && <Check className="h-2.5 w-2.5" />}
              </span>
              <span className="flex-1">{x}</span>
              <b>{[30, 45, 60, 30][i]}m</b>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ProgressBody({ reduceMotion }) {
  return (
    <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#f4f7ff] to-white p-4 dark:from-white/10 dark:to-white/5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#30405d]">Your Progress</span>
          <strong className="mt-1 block text-4xl font-black text-[#5262ef]">7.5</strong>
          <span className="text-xs font-bold text-[#176d5d]">Target 7.5</span>
        </div>
        <m.div
          initial={{ rotate: -90 }}
          whileInView={{ rotate: reduceMotion ? 0 : 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="flex h-16 w-16 items-center justify-center rounded-full border-[7px] border-[#5262ef] border-l-[#7ad6c0]"
        >
          <b className="text-[#5262ef]">80%</b>
        </m.div>
      </div>
      <svg viewBox="0 0 230 70" className="mt-3 w-full">
        <path
          d="M2 62 C28 53, 40 43, 62 46 S94 33, 116 35 S147 22, 169 23 S199 12, 228 5"
          fill="none"
          stroke="#4e70f6"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#eaf9f4] p-3 text-xs font-bold text-[#1a795f]">
        <Trophy className="h-5 w-5" />
        You’re almost there!
      </div>
    </div>
  );
}

function StepCard({ step, index, reduceMotion }) {
  const bodies = [
    <MockTestBody key="mock" />,
    <AnalysisBody key="analysis" />,
    <PlanBody key="plan" />,
    <ProgressBody key="progress" reduceMotion={reduceMotion} />,
  ];
  return (
    <m.article
      variants={landingReveal}
      whileHover={reduceMotion ? {} : { y: -8, rotate: index % 2 ? 0.4 : -0.4 }}
      className={`relative ${step.lift}`}
    >
      <GlassPanel className="relative min-h-[405px] overflow-visible rounded-[28px] p-5 transition-shadow duration-500 hover:shadow-[0_30px_75px_-35px_rgba(47,73,150,.5)]">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-black text-white shadow-lg"
            style={{ background: `linear-gradient(145deg, ${step.color}, #8f77f7)` }}
          >
            {step.number}
          </span>
          <div>
            <h3 className="text-xl font-black tracking-tight text-[#0b1731] dark:text-white">
              {step.title}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-[#647086]">{step.copy}</p>
          </div>
        </div>
        {bodies[index]}
        <button className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#5262ef]">
          View details <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </GlassPanel>
    </m.article>
  );
}

export default function ModulesSection({ handlePrimaryCta, viewport }) {
  const reduceMotion = useReducedMotion();
  return (
    <SoftSection id="modules" className="scroll-mt-24">
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="Your learning path"
          title="Step by step to your"
          script="target band."
          description="A clear journey from your first realistic test to measurable, confident improvement."
          viewport={viewport}
        />
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={landingStagger}
          className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
        >
          <svg
            className="pointer-events-none absolute left-[9%] top-[18%] hidden h-24 w-[82%] lg:block"
            viewBox="0 0 1000 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 105 C180 85, 160 95, 310 75 S500 60, 610 46 S820 22, 1000 7"
              fill="none"
              stroke="#5a70f1"
              strokeWidth="2"
              strokeDasharray="7 8"
              opacity=".55"
            />
          </svg>
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} reduceMotion={reduceMotion} />
          ))}
        </m.div>
        <m.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          className="mt-10 flex justify-center"
        >
          <button
            onClick={handlePrimaryCta}
            className="inline-flex h-14 items-center gap-3 rounded-[16px] bg-gradient-to-r from-[#2468ed] to-[#6658ef] px-8 text-sm font-extrabold text-white shadow-[0_18px_35px_-18px_rgba(61,83,225,.75)] transition hover:-translate-y-1"
          >
            Start your free test <ArrowRight className="h-5 w-5" />
          </button>
        </m.div>
      </div>
    </SoftSection>
  );
}
