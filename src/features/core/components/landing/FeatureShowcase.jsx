import React, { memo, useMemo, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Headphones,
  Mic2,
  Play,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  GlassPanel,
  SectionHeading,
  SoftSection,
  landingReveal,
  landingStagger,
} from './LandingSection';

const tabs = [
  {
    id: 'speaking',
    label: 'Speaking',
    icon: Mic2,
    eyebrow: 'AI speaking feedback',
    title: 'Speak with confidence.',
    script: 'Get real feedback.',
    score: '7.0',
    color: '#26ad85',
    description:
      'Record your answers and get AI analysis on fluency, vocabulary, grammar, and pronunciation—just like a real examiner.',
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: FileText,
    eyebrow: 'Writing evaluation',
    title: 'Write with clarity.',
    script: 'Score higher.',
    score: '6.5',
    color: '#5262ef',
    description:
      'Turn every essay into a focused lesson with precise band scores, sentence-level corrections, and next-step coaching.',
  },
  {
    id: 'reading',
    label: 'Reading',
    icon: BookOpen,
    eyebrow: 'Reading intelligence',
    title: 'Read with purpose.',
    script: 'Answer faster.',
    score: '8.0',
    color: '#2775e9',
    description:
      'Practice authentic passages, uncover answer logic, and build the timing habits needed for a confident test day.',
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
    eyebrow: 'Listening studio',
    title: 'Hear the detail.',
    script: 'Miss less.',
    score: '7.5',
    color: '#8663e8',
    description:
      'Train with realistic audio, interactive transcripts, and targeted review of the moments that cost you marks.',
  },
  {
    id: 'plan',
    label: 'Study Plan',
    icon: CalendarDays,
    eyebrow: 'Personal study plan',
    title: 'Know what comes next.',
    script: 'Stay on track.',
    score: '82%',
    color: '#25a982',
    description:
      'Follow a flexible weekly plan that turns your weakest skills into clear, achievable daily practice.',
  },
];

const waveform = [
  7, 12, 20, 10, 28, 16, 9, 23, 31, 13, 19, 26, 9, 14, 22, 31, 16, 10, 25, 18, 8, 13, 20, 12, 7, 16,
  9, 5,
];

function FeedbackMockup({ tab, reduceMotion }) {
  const rows = useMemo(() => {
    if (tab.id === 'writing')
      return ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammar'];
    if (tab.id === 'reading') return ['Skimming', 'Answer Accuracy', 'Timing', 'Vocabulary'];
    if (tab.id === 'listening')
      return ['Detail Accuracy', 'Map Questions', 'Spelling', 'Prediction'];
    if (tab.id === 'plan') return ['Listening', 'Reading', 'Writing', 'Speaking'];
    return ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'];
  }, [tab.id]);

  return (
    <div className="relative min-h-[325px] overflow-hidden rounded-[25px] border border-[#dce6fb] bg-gradient-to-br from-white/90 via-white/75 to-[#eef5ff]/75 p-5 shadow-[0_22px_55px_-35px_rgba(41,78,150,.5)] dark:border-white/10 dark:from-white/10 dark:via-white/5 dark:to-indigo-400/5 md:p-6">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2 text-xs font-extrabold"
          style={{ color: tab.color }}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label} Feedback
        </div>
        <span className="rounded-full bg-[#eaf8f3] px-3 py-1 text-[10px] font-bold text-[#188064]">
          On track
        </span>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-[180px_1fr]">
        <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <span className="text-[11px] font-bold text-[#48566e]">Overall band</span>
          <strong
            className="mt-2 block text-5xl font-black tracking-[-.05em]"
            style={{ color: tab.color }}
          >
            {tab.score}
          </strong>
          <span className="mt-2 inline-block rounded-full bg-[#eaf8f3] px-3 py-1 text-xs font-bold text-[#188064]">
            Good progress
          </span>
          <p className="mt-4 text-xs leading-5 text-[#657086]">
            Clear ideas, relevant detail, and a stronger structure.
          </p>
        </div>
        <div className="space-y-4 pt-1">
          <p className="text-xs font-extrabold text-[#27344e] dark:text-slate-100">
            Score breakdown
          </p>
          {rows.map((row, index) => (
            <div
              key={row}
              className="grid grid-cols-[1fr_120px_28px] items-center gap-3 text-[11px] font-semibold text-[#536078]"
            >
              <span className="truncate">{row}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-[#dce4f1]">
                <m.span
                  initial={{ width: 0 }}
                  animate={{ width: `${76 + ((index * 7) % 18)}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.8, delay: index * 0.08 }}
                  className="block h-full rounded-full"
                  style={{ backgroundColor: tab.color }}
                />
              </span>
              <b>{['7.5', '7.0', '6.5', '7.0'][index]}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white bg-white/75 p-3 dark:border-white/10 dark:bg-white/5">
        <button
          aria-label="Play feedback"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5262ef] text-white"
        >
          <Play className="h-4 w-4 fill-current" />
        </button>
        <span className="text-[10px] font-bold text-slate-400">00:00</span>
        <div className="flex h-8 flex-1 items-center justify-center gap-[3px] overflow-hidden">
          {waveform.map((height, i) => (
            <m.span
              key={i}
              className="w-[3px] rounded-full"
              style={{ backgroundColor: i > 18 ? '#7ad7c1' : tab.color }}
              animate={
                reduceMotion ? { height } : { height: [height * 0.45, height, height * 0.6] }
              }
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.025 }}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold text-slate-400">02:45</span>
      </div>
    </div>
  );
}

function SupportCard({ icon: Icon, eyebrow, title, copy, color, children }) {
  return (
    <GlassPanel className="group h-full rounded-[24px] p-5 transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_65px_-34px_rgba(63,81,181,.5)]">
      <div
        className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide"
        style={{ color }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-white/10">
          <Icon className="h-4 w-4" />
        </span>
        {eyebrow}
      </div>
      <h3 className="mt-4 text-lg font-black tracking-tight text-[#0d1b36] dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-xs font-medium leading-5 text-[#657086]">{copy}</p>
      {children}
      <button className="mt-5 inline-flex items-center gap-1 rounded-xl border border-[#d8e0f2] bg-white/65 px-3 py-2 text-xs font-bold text-[#5262ef] transition hover:border-[#5262ef] dark:border-white/10 dark:bg-white/5">
        Explore <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </GlassPanel>
  );
}

function FeatureShowcase({ viewport }) {
  const [activeId, setActiveId] = useState('speaking');
  const reduceMotion = useReducedMotion();
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  return (
    <SoftSection id="showcase" className="scroll-mt-24 border-y border-[#e9eef8]/70">
      <div className="relative z-10 mx-auto max-w-[1260px] px-5 md:px-8">
        <SectionHeading
          eyebrow="Core features"
          title="Practice smarter across"
          script="every"
          suffix="IELTS skill."
          description="AI-powered tools, real feedback, and personalized guidance to help you improve faster and score higher."
          viewport={viewport}
        />
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={landingStagger}
          className="mt-10"
        >
          <m.div
            variants={landingReveal}
            role="tablist"
            aria-label="IELTS skills"
            className="mx-auto flex max-w-4xl snap-x gap-2 overflow-x-auto px-1 pb-3 md:justify-center"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeId === tab.id}
                onClick={() => setActiveId(tab.id)}
                className={`relative flex min-w-[150px] snap-center items-center justify-center gap-2 rounded-[14px] border px-5 py-3 text-sm font-bold transition ${activeId === tab.id ? 'border-[#5262ef] bg-white text-[#3454de] shadow-[0_12px_30px_-18px_rgba(51,76,210,.65)] dark:bg-white/10' : 'border-[#e0e6f0] bg-white/45 text-[#26334e] hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </m.div>
          <m.div
            variants={landingReveal}
            className="relative mt-2 rounded-[30px] border border-[#d6e2fb] bg-white/65 p-4 shadow-[0_28px_80px_-42px_rgba(47,72,150,.48)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-8"
          >
            <div
              className="pointer-events-none absolute -top-4 left-[18%] rotate-[-4deg] rounded-sm bg-[#d9c3ff] px-3 py-3 text-sm font-bold text-[#543b96] shadow-lg"
              style={{ fontFamily: "'Bradley Hand', 'Segoe Print', cursive" }}
            >
              Keep going! ♥
            </div>
            <AnimatePresence mode="wait">
              <m.div
                key={activeId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: reduceMotion ? 0 : 0.35 }}
                className="grid items-center gap-8 lg:grid-cols-[1.08fr_.92fr]"
              >
                <FeedbackMockup tab={activeTab} reduceMotion={reduceMotion} />
                <div className="px-2 py-4 lg:px-8">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#bfe9df] bg-[#f2fbf8] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#218b75]">
                    <activeTab.icon className="h-3.5 w-3.5" />
                    {activeTab.eyebrow}
                  </span>
                  <h3 className="mt-4 text-[clamp(2rem,4vw,3.35rem)] font-black leading-[1.02] tracking-[-.05em] text-[#07142f] dark:text-white">
                    {activeTab.title}
                    <br />
                    <span
                      className="font-normal tracking-[-.03em] text-[#5262ef]"
                      style={{
                        fontFamily: "'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive",
                      }}
                    >
                      {activeTab.script}
                    </span>
                  </h3>
                  <p className="mt-5 max-w-lg text-sm font-medium leading-6 text-[#5c687c] dark:text-slate-300">
                    {activeTab.description}
                  </p>
                  <ul className="mt-5 space-y-3 text-sm font-semibold text-[#4f5d73] dark:text-slate-200">
                    {[
                      'Detailed band scores and breakdowns',
                      'Personalized tips for your next practice',
                      'Progress tracking that stays motivating',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#54c89a] text-white">
                          <Check className="h-3 w-3" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </m.div>
            </AnimatePresence>
          </m.div>
          <m.div variants={landingStagger} className="mt-4 grid gap-4 md:grid-cols-3">
            <m.div variants={landingReveal}>
              <SupportCard
                icon={FileText}
                eyebrow="Writing evaluation"
                title="Write better. Score higher."
                copy="Get detailed feedback on Task Achievement, coherence, vocabulary, and grammar."
                color="#356cea"
              >
                <div className="mt-4 h-1.5 rounded-full bg-slate-100">
                  <span className="block h-full w-[78%] rounded-full bg-[#5262ef]" />
                </div>
              </SupportCard>
            </m.div>
            <m.div variants={landingReveal}>
              <SupportCard
                icon={TrendingUp}
                eyebrow="Progress tracking"
                title="See progress. Stay motivated."
                copy="Visualize your improvement with smart insights and performance trends."
                color="#218b75"
              >
                <svg viewBox="0 0 220 48" className="mt-3 w-full">
                  <path
                    d="M2 43 C25 36, 35 26, 54 30 S88 21, 106 24 S135 12, 153 17 S187 5, 218 4"
                    fill="none"
                    stroke="#4f70f7"
                    strokeWidth="2.5"
                  />
                </svg>
              </SupportCard>
            </m.div>
            <m.div variants={landingReveal}>
              <SupportCard
                icon={Target}
                eyebrow="Mock tests"
                title="Real tests. Real results."
                copy="Full-length mock tests designed to mirror the real IELTS experience."
                color="#7650db"
              >
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <span key={i} className="h-2 rounded-full bg-violet-100">
                      <span
                        className="block h-full rounded-full bg-violet-400"
                        style={{ width: `${55 + i * 12}%` }}
                      />
                    </span>
                  ))}
                </div>
              </SupportCard>
            </m.div>
          </m.div>
        </m.div>
      </div>
    </SoftSection>
  );
}

export default memo(FeatureShowcase);
