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
import {
  GlassPanel,
  SectionHeading,
  SoftSection,
  landingReveal,
  landingStagger,
} from './LandingSection';

const steps = [
  {
    number: '01',
    title: 'Take a Test',
    icon: Headphones,
    copy: 'Choose a module and practise under real exam conditions.',
    color: '#5262ef',
  },
  {
    number: '02',
    title: 'Receive AI Feedback',
    icon: Sparkles,
    copy: 'See detailed strengths, weaknesses, and official band descriptors.',
    color: '#2aae83',
  },
  {
    number: '03',
    title: 'Practice with a Smart Plan',
    icon: CalendarDays,
    copy: 'Follow targeted exercises and recommendations that adapt to you.',
    color: '#805be4',
  },
  {
    number: '04',
    title: 'Reach Your Goal',
    icon: Target,
    copy: 'Track real improvement and reach your target band with confidence.',
    color: '#3e67ed',
  },
];

function TestPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-[#f5f8ff] p-3 dark:bg-white/5">
        <span className="flex items-center gap-2 text-xs font-bold">
          <Headphones className="h-4 w-4 text-[#5262ef]" />
          Listening Test
        </span>
        <small className="text-slate-400">30 mins</small>
      </div>
      <div className="flex h-12 items-center gap-1 rounded-xl bg-white/70 px-3 dark:bg-white/5">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="w-0.5 rounded-full bg-[#6c82ed]"
            style={{ height: `${7 + ((i * 9) % 27)}px`, opacity: 0.4 + (i % 4) * 0.15 }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between rounded-xl bg-[#f5f8ff] p-3 dark:bg-white/5">
        <span className="text-xs font-bold">Reading Test</span>
        <small className="text-slate-400">60 mins</small>
      </div>
    </div>
  );
}

function FeedbackPreview() {
  return (
    <div>
      <div className="flex justify-between">
        <div>
          <small className="font-bold text-slate-500">Overall Band Score</small>
          <strong className="block text-4xl font-black text-[#5262ef]">7.0</strong>
          <span className="text-xs font-bold text-[#218b75]">Good · Target 7.5</span>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-[7px] border-[#5262ef] border-l-[#78d6c1] text-lg font-black text-[#5262ef]">
          78%
        </div>
      </div>
      <div className="mt-5 flex h-12 items-center gap-1 rounded-xl bg-[#edf9f5] px-3">
        {Array.from({ length: 26 }).map((_, i) => (
          <span
            key={i}
            className="w-0.5 rounded-full bg-[#25a581]"
            style={{ height: `${6 + ((i * 11) % 25)}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function PlanPreview() {
  return (
    <div>
      <b className="text-xs text-[#4b2ba3]">Personalized Study Plan</b>
      <p className="mt-2 text-xs font-semibold text-slate-500">Study 30 mins daily</p>
      <div className="mt-4 space-y-3">
        {['Listening Practice', 'Reading Strategy', 'Writing Task 2', 'Speaking Practice'].map(
          (x, i) => (
            <div
              key={x}
              className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full ${i < 3 ? 'bg-[#55c998] text-white' : 'border-2 border-violet-400'}`}
              >
                {i < 3 && <Check className="h-2.5 w-2.5" />}
              </span>
              <span className="flex-1">{x}</span>
              {i === 2 && <b className="text-violet-600">75%</b>}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function GoalPreview() {
  return (
    <div>
      <div className="flex justify-between">
        <div>
          <small className="font-bold text-slate-500">Your Progress</small>
          <strong className="block text-4xl font-black text-[#5262ef]">7.5</strong>
          <span className="text-xs font-bold text-[#218b75]">Target reached</span>
        </div>
        <span className="flex h-10 items-center gap-1 rounded-full bg-[#eaf9f4] px-3 text-[10px] font-bold text-[#218b75]">
          <Check className="h-3 w-3" />
          On Track
        </span>
      </div>
      <svg viewBox="0 0 230 80" className="mt-3 w-full">
        <path
          d="M2 72 C30 65, 43 52, 66 56 S98 41, 119 43 S151 25, 176 28 S203 13, 228 6"
          fill="none"
          stroke="#4b70fa"
          strokeWidth="3"
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

export default function HowItWorksSection({ viewport }) {
  return (
    <SoftSection id="how-it-works" className="scroll-mt-24 border-y border-[#e9eef8]/70">
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From practice to progress"
          script="in four simple steps."
          description="AI technology meets proven learning methods, so every practice session moves you closer to your target band."
          viewport={viewport}
        />
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={landingStagger}
          className="mt-12"
        >
          <GlassPanel className="rounded-[32px] p-4 md:p-7">
            <div className="grid gap-4 lg:grid-cols-4">
              {steps.map((step, index) => (
                <m.article
                  key={step.title}
                  variants={landingReveal}
                  className="group relative border-b border-dashed border-[#d9e1ef] px-2 pb-6 last:border-0 lg:border-b-0 lg:border-r lg:px-5 lg:last:border-r-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eff0ff] text-lg font-black text-[#5262ef] ring-1 ring-[#dadcff]">
                      {step.number}
                    </span>
                    <h3 className="font-black tracking-tight text-[#0d1932] dark:text-white">
                      {step.title}
                    </h3>
                  </div>
                  <div className="mt-5 min-h-[240px] rounded-[20px] border border-white bg-white/70 p-4 shadow-[0_15px_36px_-28px_rgba(49,66,116,.5)] transition duration-500 group-hover:-translate-y-1 dark:border-white/10 dark:bg-white/5">
                    {previews[index]}
                  </div>
                  <p className="mt-5 text-sm font-medium leading-6 text-[#59667b] dark:text-slate-300">
                    {step.copy}
                  </p>
                  {index < steps.length - 1 && (
                    <m.span
                      animate={{ x: [0, 7, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -right-3 top-1/2 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-[#5262ef] shadow-md lg:flex"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </m.span>
                  )}
                </m.article>
              ))}
            </div>
            <div className="mt-6 grid gap-3 rounded-[24px] border border-white bg-white/55 p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-4">
              {[
                [Sparkles, 'AI-powered feedback', 'Instant and actionable'],
                [Mic2, 'Personalized plan', 'Tailored to your goals'],
                [BarChart3, 'Track improvement', 'See every step forward'],
                [Target, 'Reach target band', 'Stay motivated'],
              ].map(([Icon, title, copy]) => (
                <div
                  key={title}
                  className="flex items-center gap-3 px-3 md:border-r md:border-[#dce3ef] md:last:border-0"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#e9e4ff] to-[#e7f7f2] text-[#5262ef]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <b className="block text-xs text-[#1b2942] dark:text-white">{title}</b>
                    <small className="text-[10px] text-[#6b7588]">{copy}</small>
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
