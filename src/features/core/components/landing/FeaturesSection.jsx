import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import {
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Mic2,
  PieChart,
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

const scoreRows = [
  ['Fluency', '7.0', '86%'],
  ['Lexical Resource', '7.5', '92%'],
  ['Pronunciation', '6.5', '78%'],
  ['Coherence', '7.0', '85%'],
];

const planItems = ['Listening Practice', 'Reading Strategy', 'Writing Task 2', 'Speaking Practice'];

function IconTile({ children, tone = 'blue' }) {
  const tones = {
    blue: 'from-[#dbe8ff] to-[#9fc1ff] text-[#185ddd]',
    mint: 'from-[#d9f8ee] to-[#a3ead1] text-[#147a62]',
    purple: 'from-[#eee4ff] to-[#c8a9ff] text-[#6635d3]',
  };
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${tones[tone]} shadow-[0_8px_20px_-10px_currentColor]`}
    >
      {children}
    </div>
  );
}

function SpeakingPanel() {
  return (
    <GlassPanel className="h-full rounded-[28px] p-5 md:p-6">
      <div className="flex items-center gap-3">
        <IconTile tone="mint">
          <Mic2 className="h-6 w-6" />
        </IconTile>
        <div>
          <h3 className="font-extrabold text-[#0a5d4f] dark:text-emerald-300">
            AI Speaking Feedback
          </h3>
          <p className="mt-1 text-xs font-medium text-[#5a6679] dark:text-slate-300">
            Fluency, pronunciation, and coherence—scored instantly.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1.15fr_.9fr]">
        <div className="rounded-[20px] border border-emerald-100/80 bg-white/75 p-5 dark:border-emerald-400/10 dark:bg-white/5">
          <div className="flex gap-5">
            <div className="border-r border-slate-200 pr-5 dark:border-white/10">
              <strong className="block text-5xl font-black tracking-tight text-[#118568]">
                7.0
              </strong>
              <span className="font-bold text-[#08725b]">Good</span>
              <small className="mt-3 block text-[#6b7280]">Target 7.5</small>
            </div>
            <div className="min-w-0 flex-1 space-y-3 pt-1">
              {scoreRows.map(([label, value, width]) => (
                <div
                  key={label}
                  className="grid grid-cols-[1fr_55px_24px] items-center gap-2 text-[11px] font-semibold text-[#526076]"
                >
                  <span className="truncate">{label}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <m.span
                      className="block h-full rounded-full bg-gradient-to-r from-[#38b88f] to-[#8bd8bb]"
                      initial={{ width: 0 }}
                      whileInView={{ width }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9 }}
                    />
                  </span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-[#eefaf6] px-4 py-3 text-xs font-medium leading-5 text-[#385c54] dark:bg-emerald-400/10 dark:text-emerald-100">
            ✦ Great ideas! Link your examples more clearly and soften your final consonants.
          </div>
        </div>
        <div className="rounded-[20px] border border-slate-100 bg-white/75 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-extrabold text-[#263451]">Pronunciation highlights</p>
          <div className="mt-4 space-y-4 text-xs">
            {['environment', 'development', 'sustainable'].map((word, index) => (
              <div key={word} className="flex items-center justify-between gap-2">
                <div>
                  <b className="block text-[#1b2942] dark:text-slate-100">{word}</b>
                  <span className="text-[10px] text-slate-400">/pronunciation/</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 font-bold ${index === 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}
                >
                  {index === 0 ? 'Better' : 'Good'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex h-9 items-center gap-1 rounded-full bg-[#f6f8fc] px-3">
            {Array.from({ length: 22 }).map((_, i) => (
              <m.span
                key={i}
                className="w-0.5 rounded-full bg-[#5f82f5]"
                animate={{ height: [5, 8 + ((i * 7) % 17), 5] }}
                transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.035 }}
              />
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function PlanPanel() {
  return (
    <GlassPanel className="h-full rounded-[28px] p-5">
      <div className="flex items-center gap-3">
        <IconTile tone="purple">
          <CalendarDays className="h-5 w-5" />
        </IconTile>
        <div>
          <h3 className="font-extrabold text-[#3f228f] dark:text-violet-300">
            Personalized Study Plan
          </h3>
          <p className="text-xs text-[#6b7280]">Study 30 mins daily</p>
        </div>
      </div>
      <div className="mt-5 space-y-3 rounded-[18px] border border-violet-100/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
        {planItems.map((item, i) => (
          <div
            key={item}
            className="flex items-center gap-2 text-xs font-semibold text-[#46546b] dark:text-slate-200"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${i === 3 ? 'border-2 border-violet-400' : 'bg-[#56c795] text-white'}`}
            >
              {i < 3 && <Check className="h-3 w-3" />}
            </span>
            <span className="flex-1">{item}</span>
            {i === 2 && (
              <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] text-violet-600">
                75%
              </span>
            )}
          </div>
        ))}
      </div>
      <button className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#5262ef]">
        View full plan <ChevronRight className="h-4 w-4" />
      </button>
    </GlassPanel>
  );
}

function WritingPanel() {
  return (
    <GlassPanel className="h-full rounded-[28px] p-5">
      <div className="flex items-center gap-3">
        <IconTile>
          <FileText className="h-5 w-5" />
        </IconTile>
        <div>
          <h3 className="font-extrabold text-[#174baf] dark:text-blue-300">Writing Evaluation</h3>
          <p className="text-xs text-[#6b7280]">Detailed band-score feedback</p>
        </div>
      </div>
      <div className="mt-5 rounded-[18px] border border-blue-100/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
        <span className="text-xs font-semibold text-slate-500">Task Achievement</span>
        <strong className="mt-1 block text-3xl font-black text-[#396df2]">
          6.5 <small className="text-sm text-slate-400">/ 9</small>
        </strong>
        <svg viewBox="0 0 240 65" className="mt-2 w-full" aria-hidden="true">
          <path
            d="M3 55 C32 48, 44 34, 70 39 S111 31, 127 34 S159 23, 178 26 S213 13, 237 12"
            fill="none"
            stroke="#4c6fff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M3 55 C32 48, 44 34, 70 39 S111 31, 127 34 S159 23, 178 26 S213 13, 237 12 L237 64 L3 64Z"
            fill="url(#writingFill)"
            opacity=".25"
          />
          <defs>
            <linearGradient id="writingFill" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#5877ff" />
              <stop offset="1" stopColor="#5877ff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="mt-4 space-y-2 text-xs font-medium text-[#526076]">
        {[
          ['Coherence & Cohesion', '6.5'],
          ['Lexical Resource', '7.0'],
          ['Grammatical Range', '6.5'],
        ].map(([x, y]) => (
          <div key={x} className="flex justify-between">
            <span>{x}</span>
            <b className="text-[#396df2]">{y}</b>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function AnalyticsPanel() {
  return (
    <GlassPanel className="h-full rounded-[28px] p-5 md:p-6">
      <div className="flex items-center gap-3">
        <IconTile tone="purple">
          <PieChart className="h-5 w-5" />
        </IconTile>
        <div>
          <h3 className="font-extrabold text-[#3f228f] dark:text-violet-300">Progress Analytics</h3>
          <p className="text-xs text-[#6b7280]">See every step toward your target band.</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[110px_1fr] items-end gap-4">
        <div>
          <span className="text-xs text-slate-500">Overall Progress</span>
          <strong className="block text-4xl font-black text-[#5262ef]">7.0</strong>
          <span className="text-xs font-bold text-[#218b75]">Target 7.5</span>
        </div>
        <svg viewBox="0 0 300 110" className="w-full" aria-hidden="true">
          <path
            d="M4 93 C40 76, 57 66, 88 61 S126 45, 158 39 S204 29, 238 24 S270 14, 296 8"
            fill="none"
            stroke="#4774ff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M4 105 C40 97, 70 89, 100 79 S154 68, 188 59 S245 48, 296 31"
            fill="none"
            stroke="#55cbaa"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
        </svg>
      </div>
    </GlassPanel>
  );
}

function MiniPanel({ icon: Icon, title, copy, tone = 'blue', children }) {
  return (
    <GlassPanel className="h-full rounded-[28px] p-5 transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_65px_-34px_rgba(63,81,181,.48)]">
      <div className="flex items-center gap-3">
        <IconTile tone={tone}>
          <Icon className="h-5 w-5" />
        </IconTile>
        <div>
          <h3 className="font-extrabold text-[#152442] dark:text-white">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-[#657086]">{copy}</p>
        </div>
      </div>
      {children}
    </GlassPanel>
  );
}

export default function FeaturesSection({ viewport }) {
  const reduceMotion = useReducedMotion();
  return (
    <SoftSection id="features" className="scroll-mt-24">
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="Platform features"
          title="All the support you need,"
          script="in one smart platform."
          viewport={viewport}
        />
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={landingStagger}
          className="mt-12 grid auto-rows-auto grid-cols-1 gap-4 lg:grid-cols-12"
        >
          <m.div variants={landingReveal} className="lg:col-span-6">
            <SpeakingPanel />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-3">
            <PlanPanel />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-3">
            <WritingPanel />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-5">
            <AnalyticsPanel />
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-2">
            <MiniPanel
              icon={Target}
              title="Vocabulary Builder"
              copy="Expand your word power with smart learning."
              tone="mint"
            >
              <div className="mt-5 rounded-2xl bg-white/70 p-4 text-sm shadow-inner dark:bg-white/5">
                <b>Articulate</b>
                <span className="mt-1 block text-xs text-slate-400">adjective · Band 7+</span>
              </div>
            </MiniPanel>
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-3">
            <MiniPanel
              icon={TrendingUp}
              title="Mock Tests"
              copy="Real exam experience, real results."
              tone="purple"
            >
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                {['Listening 7.5', 'Writing 6.5', 'Reading 7.0', 'Speaking 7.0'].map((x) => (
                  <span key={x} className="rounded-lg bg-white/70 p-2 dark:bg-white/5">
                    {x}
                  </span>
                ))}
              </div>
            </MiniPanel>
          </m.div>
          <m.div variants={landingReveal} className="lg:col-span-2">
            <MiniPanel icon={Bot} title="AI Tutor" copy="Your 24/7 guide for IELTS success.">
              <m.div
                animate={reduceMotion ? {} : { y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#dce9ff] to-[#907cff] shadow-lg"
              >
                <Bot className="h-8 w-8 text-white" />
              </m.div>
            </MiniPanel>
          </m.div>
        </m.div>
      </div>
    </SoftSection>
  );
}
