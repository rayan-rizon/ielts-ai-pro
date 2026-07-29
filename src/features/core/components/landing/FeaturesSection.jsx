import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  PenTool,
  Mic,
  FileText,
  TrendingUp,
  BookOpen,
  Sparkles,
  Volume2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { SectionHeading, SoftSection, landingReveal, landingStagger } from './LandingSection';

/* ─── Light Lavender Bento Card Base Style ──────────────────── */
const CARD_BASE =
  'group relative bg-white dark:bg-[#0d0f1d] border border-[#E5E2FA] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(99,91,255,0.04)] hover:shadow-[0_16px_36px_rgba(99,91,255,0.12)] dark:hover:shadow-[0_16px_36px_rgba(99,91,255,0.2)] transition-all duration-300 flex flex-col justify-between h-full select-none overflow-hidden';

/* Lavender Card Header */
function FeatureCardHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3.5 mb-3.5 shrink-0">
      <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] dark:bg-indigo-950/80 text-[#635BFF] dark:text-[#A78BFA] border border-[#E0DAFE] dark:border-indigo-900/40 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300">
        <Icon className="w-5.5 h-5.5 stroke-[2.2]" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-[#635BFF] dark:group-hover:text-[#A78BFA] transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ─── 1. Rive-Style Animated AI Writing Feedback Card ───────── */
function RiveWritingFeedbackCard() {
  return (
    <div className={CARD_BASE}>
      <FeatureCardHeader
        icon={PenTool}
        title="AI Writing Feedback"
        subtitle="Get expert corrections and improve faster."
      />

      {/* Rive Canvas Container - Equal Height Flex-1 */}
      <div className="bg-[#F6F4FE] dark:bg-[#121427] p-4 sm:p-4.5 rounded-2xl border border-[#E2DCFE] dark:border-slate-800 flex-1 flex flex-col justify-between space-y-3 min-h-[220px]">
        {/* Top Score Banner Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-[#0d0f1d] px-3.5 py-2 rounded-xl border border-[#E5E2FA] dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#635BFF]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              AI Essay Score
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#635BFF] dark:text-[#A78BFA]">Band 7.0</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-200/50">
              ↑ +0.5
            </span>
          </div>
        </div>

        {/* Main Essay Text Canvas */}
        <div className="bg-white dark:bg-[#0d0f1d] p-3.5 rounded-xl border border-[#E5E2FA] dark:border-slate-800 shadow-2xs space-y-2.5 flex-1 flex flex-col justify-between">
          <p className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
            Many people{' '}
            <span className="relative inline-block text-rose-500 font-bold px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 rounded">
              believes
              <m.span
                className="absolute left-0 bottom-0 w-full h-[2px] bg-rose-500 rounded"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            </span>{' '}
            that technology has made{' '}
            <span className="text-[#635BFF] font-bold px-1.5 py-0.5 bg-[#F0EEFF] dark:bg-indigo-950/60 rounded">
              our life
            </span>{' '}
            easier.
          </p>

          {/* Rive Animated Correction Cards */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
            <m.div
              className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 text-slate-700 dark:text-slate-300 border border-rose-100 dark:border-rose-900/40"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="line-through text-rose-500 font-bold">believes</span>
                <span className="text-slate-400">→</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  believe
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Subject-verb agreement
              </span>
            </m.div>

            <m.div
              className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#F0EEFF]/70 dark:bg-indigo-950/30 text-slate-700 dark:text-slate-300 border border-[#E0DAFE]/60 dark:border-indigo-900/40"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#635BFF] shrink-0" />
                <span className="text-[#635BFF] font-bold">our life</span>
                <span className="text-slate-400">→</span>
                <span className="font-extrabold text-[#635BFF] dark:text-[#A78BFA]">our lives</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Plural noun form
              </span>
            </m.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 2. Rive-Style Animated Speaking Practice Card ──────────── */
function RiveSpeakingPracticeCard() {
  return (
    <div className={CARD_BASE}>
      <FeatureCardHeader
        icon={Mic}
        title="Speaking Practice"
        subtitle="Practice fluency and get real-time feedback."
      />

      {/* Rive Sound Studio Canvas - Equal Height Flex-1 */}
      <div className="bg-[#F6F4FE] dark:bg-[#121427] p-5 sm:p-6 rounded-2xl border border-[#E2DCFE] dark:border-slate-800 flex-1 flex flex-col items-center justify-between min-h-[220px] relative overflow-hidden text-center">
        {/* Animated Prompt Tooltip */}
        <m.div
          className="px-3.5 py-1 rounded-full bg-white dark:bg-[#0d0f1d] border border-[#E5E2FA] dark:border-slate-800 shadow-2xs text-[11px] font-semibold text-[#635BFF] dark:text-[#A78BFA] flex items-center gap-1.5"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-3 h-3 text-[#635BFF]" />
          <span>"Describe a trip you enjoyed taking..."</span>
        </m.div>

        {/* Rive Concentric Sonar Ring Waves */}
        <div className="relative flex items-center justify-center my-auto py-2">
          <m.div
            className="absolute w-24 h-24 rounded-full border border-[#635BFF]/30 dark:border-[#635BFF]/20"
            animate={{ scale: [0.8, 1.45, 0.8], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <m.div
            className="absolute w-32 h-32 rounded-full border border-purple-400/20 dark:border-purple-500/10"
            animate={{ scale: [0.8, 1.55, 0.8], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
          />

          {/* Left Sound Wave Equalizer Bars */}
          <div className="flex items-center gap-1 mr-3 z-10">
            {[8, 14, 22, 12, 18, 10, 16].map((h, i) => (
              <m.span
                key={`left-${i}`}
                className="w-1 rounded-full bg-[#635BFF]"
                animate={{ height: [6, h * 1.1, 6] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }}
              />
            ))}
          </div>

          {/* Mic Center Button */}
          <div className="relative z-10 group/mic cursor-pointer">
            <div className="absolute -inset-2.5 rounded-full bg-[#635BFF]/25 blur-md animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#635BFF] via-[#7C3AED] to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 relative z-10">
              <Mic className="w-6.5 h-6.5 stroke-[2.2]" />
            </div>
          </div>

          {/* Right Sound Wave Equalizer Bars */}
          <div className="flex items-center gap-1 ml-3 z-10">
            {[16, 10, 18, 12, 22, 14, 8].map((h, i) => (
              <m.span
                key={`right-${i}`}
                className="w-1 rounded-full bg-[#635BFF]"
                animate={{ height: [6, h * 1.1, 6] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }}
              />
            ))}
          </div>
        </div>

        {/* Live Recording Pill */}
        <div className="z-10 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-[#0d0f1d] border border-[#E5E2FA] dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#635BFF] animate-ping" />
          <span>Recording Fluency...</span>
          <span className="font-mono text-slate-400 ml-1">00:38</span>
        </div>
      </div>
    </div>
  );
}

/* ─── 3. Rive-Style Animated Practice Tests Card ─────────────── */
function RivePracticeLibraryCard() {
  return (
    <div className={CARD_BASE}>
      <FeatureCardHeader
        icon={FileText}
        title="Full Practice Tests"
        subtitle="Simulate real IELTS tests with timed sections."
      />

      {/* Rive Practice Tests Canvas - Equal Height Flex-1 */}
      <div className="bg-[#F6F4FE] dark:bg-[#121427] p-4 sm:p-4.5 rounded-2xl border border-[#E2DCFE] dark:border-slate-800 flex-1 flex flex-col justify-between min-h-[220px]">
        <div className="bg-white dark:bg-[#0d0f1d] p-3.5 rounded-xl border border-[#E5E2FA] dark:border-slate-800 shadow-2xs space-y-2.5 flex-1 flex flex-col justify-between">
          {/* Header with Live Exam Status */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#635BFF]" />
              Cambridge Mock Tests
            </span>
            <div className="flex items-center gap-1 text-[10.5px] font-bold text-[#635BFF] dark:text-[#A78BFA] bg-[#F0EEFF] dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-[#E0DAFE] dark:border-indigo-900/40">
              <Clock className="w-3 h-3 text-[#635BFF]" />
              <span>Timed Exam Mode</span>
            </div>
          </div>

          {/* Test Cards List with Rive Vector Progress Arc Rings */}
          <div className="space-y-2 flex-1 flex flex-col justify-between">
            {[
              {
                title: 'IELTS Academic Test 12',
                modules: '4/4 Sections',
                score: '7.5',
                strokeDash: '0',
              },
              {
                title: 'IELTS Academic Test 11',
                modules: '4/4 Sections',
                score: '7.0',
                strokeDash: '8',
              },
              {
                title: 'IELTS Academic Test 10',
                modules: '4/4 Sections',
                score: '6.5',
                strokeDash: '16',
              },
            ].map((t, idx) => (
              <m.div
                key={t.title}
                className="flex items-center justify-between p-2 rounded-lg bg-[#F6F4FE]/70 dark:bg-slate-950/40 border border-[#E2DCFE]/50 dark:border-slate-800/60 group/test hover:border-[#635BFF]/40 transition-colors"
                whileHover={{ scale: 1.01, x: 2 }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rive SVG Circular Progress Ring */}
                  <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 36 36" className="w-7 h-7 transform -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        className="stroke-[#E0DAFE] dark:stroke-indigo-950"
                        strokeWidth="3.5"
                        fill="none"
                      />
                      <m.circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        className="stroke-[#635BFF]"
                        strokeWidth="3.5"
                        strokeDasharray="97.4"
                        strokeDashoffset={t.strokeDash}
                        strokeLinecap="round"
                        fill="none"
                        initial={{ strokeDashoffset: 97.4 }}
                        animate={{ strokeDashoffset: t.strokeDash }}
                        transition={{ duration: 1.5, delay: idx * 0.2 }}
                      />
                    </svg>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#635BFF] absolute inset-0 m-auto" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-[12px] group-hover/test:text-[#635BFF] transition-colors">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{t.modules}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#F0EEFF] dark:bg-indigo-950/80 text-[#635BFF] dark:text-[#A78BFA] font-black text-xs border border-[#E0DAFE] dark:border-indigo-900/40">
                    {t.score}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/test:text-[#635BFF] transition-colors" />
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 4. Rive-Style Animated Analytics Card ──────────────────── */
function RiveAnalyticsCard() {
  return (
    <div className={CARD_BASE}>
      <FeatureCardHeader
        icon={TrendingUp}
        title="Progress Analytics"
        subtitle="Track your band score and see your improvement."
      />

      {/* Rive Chart & Analytics Canvas - Equal Height Flex-1 */}
      <div className="bg-[#F6F4FE] dark:bg-[#121427] p-4 sm:p-4.5 rounded-2xl border border-[#E2DCFE] dark:border-slate-800 flex-1 flex flex-col justify-between min-h-[220px]">
        <div className="flex flex-col sm:flex-row gap-3.5 items-stretch h-full">
          {/* Left Stat Card with Band Score Gauge Arc */}
          <div className="bg-white dark:bg-[#0d0f1d] p-4 rounded-xl border border-[#E5E2FA] dark:border-slate-800 shadow-2xs flex flex-col justify-between shrink-0 sm:w-44 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Overall Band
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                ↑ +0.5
              </span>
            </div>

            <div className="my-1.5 flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#635BFF] dark:text-[#A78BFA]">7.0</span>
              <span className="text-xs font-bold text-slate-400">/ 9.0</span>
            </div>

            {/* Rive Progress Breakdown Bars */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span>Writing</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">7.0</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <m.div
                    className="h-full rounded-full bg-[#635BFF]"
                    initial={{ width: 0 }}
                    animate={{ width: '77%' }}
                    transition={{ duration: 1.2 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span>Speaking</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">7.5</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <m.div
                    className="h-full rounded-full bg-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: '83%' }}
                    transition={{ duration: 1.2, delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Rive Animated SVG Chart with Interactive Floating Tooltip */}
          <div className="flex-1 bg-white dark:bg-[#0d0f1d] p-4 rounded-xl border border-[#E5E2FA] dark:border-slate-800 shadow-2xs relative flex flex-col justify-between min-h-[145px] min-w-0">
            {/* Floating Rive Score Tooltip */}
            <m.div
              className="absolute top-2 right-4 px-2.5 py-1 rounded-lg bg-[#635BFF] text-white text-[10px] font-black shadow-md flex items-center gap-1 z-20"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-3 h-3 text-purple-200" />
              <span>Target Reached: 7.5</span>
            </m.div>

            <div className="absolute inset-x-3 top-3 bottom-7 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-dashed border-[#635BFF] w-full" />
              <div className="border-b border-dashed border-[#635BFF] w-full" />
              <div className="border-b border-dashed border-[#635BFF] w-full" />
            </div>

            <div className="relative z-10 w-full mt-2">
              <svg viewBox="0 0 300 80" className="w-full h-24 overflow-visible">
                <defs>
                  <linearGradient id="riveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#635BFF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#635BFF" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="riveLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#635BFF" />
                    <stop offset="50%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#A78BFA" />
                  </linearGradient>
                </defs>

                <path
                  d="M 10,60 Q 75,48 140,36 T 290,15 L 290,75 L 10,75 Z"
                  fill="url(#riveAreaGrad)"
                />
                <m.path
                  d="M 10,60 Q 75,48 140,36 T 290,15"
                  fill="none"
                  stroke="url(#riveLineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 2.2,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                />
                <path
                  d="M 10,60 Q 75,48 140,36 T 290,15"
                  fill="none"
                  stroke="#635BFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Pulsing Node Rings */}
                <circle cx="10" cy="60" r="4" fill="#635BFF" stroke="#ffffff" strokeWidth="2" />
                <circle cx="75" cy="48" r="4" fill="#635BFF" stroke="#ffffff" strokeWidth="2" />
                <circle cx="140" cy="36" r="4" fill="#7C3AED" stroke="#ffffff" strokeWidth="2" />
                <circle cx="215" cy="24" r="4" fill="#7C3AED" stroke="#ffffff" strokeWidth="2" />
                <m.circle
                  cx="290"
                  cy="15"
                  r="5.5"
                  fill="#A78BFA"
                  stroke="#ffffff"
                  strokeWidth="2"
                  animate={{ r: [4.5, 7, 4.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-1 px-1 relative z-10">
              <span>May 1</span>
              <span>May 15</span>
              <span>Jun 1</span>
              <span>Jun 15</span>
              <span>Jun 30</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 5. Rive-Style Animated Vocabulary Builder Card ─────────── */
function RiveVocabularyBuilderCard() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = () => {
    setIsPlaying(true);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Pragmatic');
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  return (
    <div className={CARD_BASE}>
      <FeatureCardHeader
        icon={BookOpen}
        title="Vocabulary Builder"
        subtitle="Learn high-frequency words that boost your band."
      />

      {/* Rive 3D Flashcard Deck Canvas - Equal Height Flex-1 */}
      <div className="bg-[#F6F4FE] dark:bg-[#121427] p-5 rounded-2xl border border-[#E2DCFE] dark:border-slate-800 flex-1 flex flex-col items-center justify-between min-h-[220px] relative overflow-hidden">
        <div className="relative w-full max-w-xs sm:max-w-sm my-auto">
          {/* Rive Card Layer 3 */}
          <div className="absolute inset-0 bg-[#635BFF]/10 dark:bg-[#635BFF]/20 rounded-xl transform translate-x-4 translate-y-3 rotate-6 border border-[#635BFF]/20 opacity-40" />

          {/* Rive Card Layer 2 */}
          <div className="absolute inset-0 bg-[#635BFF]/15 dark:bg-[#635BFF]/30 rounded-xl transform translate-x-2 translate-y-1.5 rotate-3 border border-[#635BFF]/30 opacity-70" />

          {/* Main Front Flashcard with Audio Rive Waves */}
          <div className="relative z-10 bg-white dark:bg-[#0d0f1d] p-4.5 sm:p-5 rounded-xl border border-[#E5E2FA] dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#635BFF] dark:text-[#A78BFA]">
                  WORD OF THE DAY
                </span>
                <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 text-[9px] font-extrabold border border-purple-200/50">
                  Band 8.0+
                </span>
              </div>

              {/* Speaker Button with Expanding Rive Waves */}
              <button
                type="button"
                onClick={handleSpeak}
                aria-label="Pronounce Pragmatic"
                className={`w-7.5 h-7.5 rounded-full bg-[#F0EEFF] dark:bg-indigo-950/60 text-[#635BFF] dark:text-[#A78BFA] flex items-center justify-center hover:scale-105 transition-transform relative ${
                  isPlaying ? 'ring-2 ring-purple-400' : ''
                }`}
              >
                <Volume2 className="w-4 h-4" />
                {isPlaying && (
                  <>
                    <m.span
                      className="absolute inset-0 rounded-full border border-[#635BFF]"
                      animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <m.span
                      className="absolute inset-0 rounded-full border border-purple-400"
                      animate={{ scale: [1, 2.3], opacity: [0.8, 0] }}
                      transition={{ duration: 0.8, delay: 0.2, repeat: Infinity }}
                    />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Pragmatic</h4>
              <span className="text-[11px] font-semibold text-slate-400">/pɹæɡˈmæt.ɪk/</span>
            </div>
            <p className="text-[11px] font-bold text-[#635BFF] dark:text-[#A78BFA] mt-0.5">
              adjective
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
              Dealing with things sensibly and in a realistic way.
            </p>
          </div>
        </div>

        {/* Rive Card Deck Indicators */}
        <div className="flex items-center gap-1.5 mt-3.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#635BFF]" />
          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Section Component ─────────────────────────────────── */
export default function FeaturesSection({ viewport }) {
  return (
    <SoftSection
      id="features"
      className="scroll-mt-24 bg-[#F7F6FE] dark:bg-[#070914] py-16 lg:py-24"
    >
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8 space-y-10">
        <SectionHeading
          eyebrow="BUILT TO HELP YOU SCORE"
          title="Everything you need to"
          script="reach your target band."
          description="AI tools to practice smarter and achieve your best IELTS score."
          viewport={viewport}
        />

        {/* Bento Grid layout with equal height items-stretch */}
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={landingStagger}
          className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-12 items-stretch"
        >
          {/* Top Row: 3 equal height cards */}
          <m.div
            variants={landingReveal}
            className="md:col-span-1 lg:col-span-4 flex flex-col h-full"
          >
            <RiveWritingFeedbackCard />
          </m.div>
          <m.div
            variants={landingReveal}
            className="md:col-span-1 lg:col-span-4 flex flex-col h-full"
          >
            <RiveSpeakingPracticeCard />
          </m.div>
          <m.div
            variants={landingReveal}
            className="md:col-span-2 lg:col-span-4 flex flex-col h-full"
          >
            <RivePracticeLibraryCard />
          </m.div>

          {/* Bottom Row: 2 equal height cards */}
          <m.div
            variants={landingReveal}
            className="md:col-span-1 lg:col-span-6 flex flex-col h-full"
          >
            <RiveAnalyticsCard />
          </m.div>
          <m.div
            variants={landingReveal}
            className="md:col-span-1 lg:col-span-6 flex flex-col h-full"
          >
            <RiveVocabularyBuilderCard />
          </m.div>
        </m.div>
      </div>
    </SoftSection>
  );
}
