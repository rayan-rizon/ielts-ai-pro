import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MessageSquareText, Mic2, ShieldCheck, Sparkles } from 'lucide-react';

import { cn } from '@/lib/cn';
import { MUTED } from '@/features/dashboard/components/primitives';

import { SPEAKING_MODE_MINUTES } from '../utils/speakingV2';
import DeviceSetupCheck from './DeviceSetupCheck';
import ExaminerVoiceCarousel from './ExaminerVoiceCarousel';

const PART_INTROS = {
  1: "You'll answer a few questions about yourself and familiar topics.",
  2: "You'll prepare a topic, then speak about it for one to two minutes.",
  3: "You'll discuss broader ideas and explain your opinions in more detail.",
};

const MODES = [
  {
    id: 'practice',
    label: 'Practice',
    minutes: SPEAKING_MODE_MINUTES.practice,
    short: 'Live coach',
    detail: 'A coach helps after each answer.',
    icon: MessageSquareText,
  },
  {
    id: 'exam',
    label: 'Exam',
    minutes: SPEAKING_MODE_MINUTES.exam,
    short: 'Timed, no help',
    detail: 'Timed, with feedback in your report.',
    icon: ShieldCheck,
  },
];

const PRACTICE_BENEFITS = [
  {
    icon: MessageSquareText,
    title: 'Live voice coaching',
    detail: 'Your coach speaks after each answer with guidance on your phrasing.',
    tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  {
    icon: Sparkles,
    title: 'Instant vocabulary hints',
    detail: 'Get useful vocabulary, collocations, and grammar suggestions as you practise.',
    tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    icon: Mic2,
    title: 'Hands-free flow with pause',
    detail: 'Answers submit automatically. Pause anytime to gather your thoughts.',
    tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
];

const InitialWelcomeScreen = ({
  partNumber,
  title,
  speakingMode = 'exam',
  setSpeakingMode,
  speakingV2Available = false,
  examinerVoice = 'british-female',
  onExaminerVoiceChange,
  onVoicePreview,
  previewVoice,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-start px-0 pb-2 pt-4 sm:px-3 sm:pb-3 sm:pt-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative flex w-full max-w-2xl flex-col items-center text-center"
      >
        <h2 className="text-xl font-extrabold tracking-[-0.03em] text-slate-900 dark:text-slate-50 sm:text-2xl md:text-[26px]">
          {speakingV2Available
            ? 'How do you want to take this test?'
            : `Ready to start Part ${partNumber}?`}
        </h2>
        <p className={cn(MUTED, 'mt-1.5 max-w-lg text-[13px] leading-relaxed sm:text-sm')}>
          <span className="font-bold text-slate-700 dark:text-slate-200">
            Part {partNumber}
            {title ? `: ${title}` : ''}.
          </span>{' '}
          {PART_INTROS[partNumber] || 'Answer naturally, listen carefully, and speak clearly.'}
        </p>

        {speakingV2Available && (
          <div
            className="relative mt-3 mb-3 grid w-full max-w-lg grid-cols-2 gap-2"
            role="group"
            aria-label="Speaking mode"
          >
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const selected = speakingMode === mode.id;
              return (
                <motion.button
                  key={mode.id}
                  type="button"
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                  onClick={() => setSpeakingMode?.(mode.id)}
                  aria-pressed={selected}
                  aria-label={`${mode.label}, ${mode.minutes} minutes. ${mode.detail}`}
                  className={cn(
                    'relative flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left sm:gap-2.5 sm:px-3 sm:py-2 transition-colors duration-200 ease-out cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#141319]',
                    selected
                      ? 'border-transparent text-[#444cc7] dark:text-[#aeb3ff]'
                      : 'border-[#e4e2f0] bg-white text-slate-700 hover:border-[#5a63df]/30 hover:bg-slate-50/60 dark:border-white/[0.07] dark:bg-white/3 dark:text-slate-200 dark:hover:bg-white/6'
                  )}
                >
                  {selected && (
                    <motion.div
                      layoutId="speakingModeActivePill"
                      className="absolute -inset-px rounded-lg border-1.5 border-[#5a63df] bg-[#5a63df]/8 dark:border-[#8f97ff] dark:bg-[#5a63df]/15 pointer-events-none shadow-xs"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }
                      }
                    />
                  )}
                  <span
                    className={cn(
                      'relative z-10 hidden h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200 ease-out sm:flex',
                      selected
                        ? 'bg-[#5a63df]/12 text-[#5a63df] dark:bg-[#5a63df]/25 dark:text-[#aeb3ff]'
                        : 'bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-400'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="relative z-10 min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
                        {mode.label}
                      </span>
                      <span className="font-mono text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                        {mode.minutes} min
                      </span>
                    </span>
                    <span className="block text-[11px] leading-snug text-slate-600 sm:hidden dark:text-slate-300">
                      {mode.short}
                    </span>
                    <span className="hidden text-[11px] leading-snug text-slate-600 sm:block dark:text-slate-300">
                      {mode.detail}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        <div
          className={cn(
            'relative isolate w-full max-w-2xl rounded-xl border border-[#e4e2f0] bg-[#f5f4fa] dark:border-white/[0.07] dark:bg-[#141319] sm:h-[290px] overflow-hidden',
            // The voice carousel needs a fixed stage; the practice list sizes
            // itself on small screens so nothing is clipped.
            speakingMode === 'exam' && 'h-[284px]',
            !speakingV2Available && 'mt-3 sm:mt-4'
          )}
        >
          <div className="grid grid-cols-1 grid-rows-1 w-full h-full overflow-hidden">
            <AnimatePresence initial={false}>
              {speakingMode === 'practice' ? (
                <motion.div
                  key="practice-mode-stage"
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.18,
                    ease: [0.2, 0, 0, 1],
                  }}
                  className="col-start-1 row-start-1 flex w-full h-full flex-col justify-center"
                  role="group"
                  aria-label="Practice mode"
                >
                  <div className="grid w-full grid-cols-1 items-center gap-2 p-2.5 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1.7fr)] sm:gap-3.5 sm:p-3.5">
                    <div className="relative mx-auto hidden w-full max-w-40 sm:block">
                      <img
                        src="/speaking-assets/examiner-welcome-v1.png"
                        alt="AI speaking examiner wearing a headset"
                        className="aspect-3/2 w-full object-cover object-center mix-blend-multiply dark:mix-blend-normal"
                        loading="eager"
                      />
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t/srgb from-[#f5f4fa] to-transparent dark:from-[#141319]"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="grid min-w-0 gap-1.5 sm:gap-2">
                      {PRACTICE_BENEFITS.map(
                        ({ icon: Icon, title: benefitTitle, detail, tone }) => (
                          <div
                            key={benefitTitle}
                            className="flex min-w-0 items-center gap-2.5 rounded-lg border border-[#e4e2f0]/80 bg-white px-2.5 py-1.5 text-left dark:border-white/[0.07] dark:bg-[#19181f] sm:gap-3 sm:px-3 sm:py-2"
                          >
                            <span
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-7.5 sm:w-7.5',
                                tone
                              )}
                            >
                              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[11px] font-extrabold leading-snug text-slate-800 dark:text-slate-100 sm:text-xs">
                                {benefitTitle}
                              </span>
                              <span
                                className={cn(
                                  MUTED,
                                  'block text-[9.5px] leading-snug sm:text-[10.5px]'
                                )}
                              >
                                {detail}
                              </span>
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="exam-mode-stage"
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.18,
                    ease: [0.2, 0, 0, 1],
                  }}
                  className="col-start-1 row-start-1 flex w-full h-full flex-col justify-center"
                  role="group"
                  aria-label="Exam mode"
                >
                  <ExaminerVoiceCarousel
                    examinerVoice={examinerVoice}
                    onExaminerVoiceChange={onExaminerVoiceChange}
                    onVoicePreview={onVoicePreview}
                    previewVoice={previewVoice}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-4 w-full max-w-2xl">
          <DeviceSetupCheck />
        </div>
      </motion.div>
    </div>
  );
};

export default InitialWelcomeScreen;
