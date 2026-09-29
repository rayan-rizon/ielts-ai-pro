import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  Loader2,
  MessageSquareText,
  Mic2,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { IconChip, MICRO, MUTED, Pill, WELL } from '@/features/dashboard/components/primitives';

import useSpeakingDeviceChecks from '../hooks/useSpeakingDeviceChecks';
import ExaminerVoiceCarousel from './ExaminerVoiceCarousel';

const DEVICE_COPY = {
  microphone: {
    idle: ['Test microphone', 'Tap, then speak for two seconds'],
    testing: ['Listening…', 'Say a short sentence now'],
    ready: ['Microphone works', 'Your voice was detected clearly'],
    quiet: ['Try microphone again', 'No clear voice was detected'],
    error: ['Microphone unavailable', 'Allow access, then try again'],
  },
  speaker: {
    idle: ['Test speakers', 'Tap to play a short test tone'],
    testing: ['Playing test sound…', 'Listen for a soft two-note tone'],
    ready: ['Test sound played', 'Your speaker check is complete'],
    error: ['Speaker test unavailable', 'Check browser sound permissions'],
  },
};

const PART_INTROS = {
  1: "You'll answer a few questions about yourself and familiar topics.",
  2: "You'll prepare a topic, then speak about it for one to two minutes.",
  3: "You'll discuss broader ideas and explain your opinions in more detail.",
};

const MODES = [
  {
    id: 'practice',
    label: 'Practice',
    detail: '8 min · live AI coach',
    icon: MessageSquareText,
  },
  {
    id: 'exam',
    label: 'Exam',
    detail: '14 min · real test, no coaching',
    icon: ShieldCheck,
  },
];

function PracticeCoachCard() {
  return (
    <section className="mt-3 w-full max-w-2xl text-left" aria-labelledby="practice-coach-title">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className={cn(MICRO, MUTED)}>Before you begin</p>
          <h3
            id="practice-coach-title"
            className="text-xs font-extrabold text-slate-800 dark:text-slate-100 sm:text-sm"
          >
            Meet your live AI coach
          </h3>
        </div>
        <Pill tone="emerald">Live coaching</Pill>
      </div>

      <div
        className={cn(
          WELL,
          'flex min-h-[256px] flex-col justify-center rounded-xl border border-[#e4e2f0] p-3 sm:p-4 dark:border-white/[0.07]'
        )}
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-28 shrink-0 sm:w-36">
            <img
              src="/speaking-assets/examiner-welcome-v1.png"
              alt="AI speaking examiner wearing a headset"
              className="aspect-3/2 w-full rounded-lg object-cover object-center mix-blend-multiply dark:mix-blend-normal"
              loading="eager"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t/srgb from-white to-transparent dark:from-[#131315]"
              aria-hidden="true"
            />
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5 sm:gap-2">
            <div className="flex items-start gap-2.5 rounded-lg border border-[#e4e2f0]/70 bg-white/80 p-2 text-left dark:border-white/[0.06] dark:bg-white/4">
              <IconChip icon={MessageSquareText} tone="rose" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  Live voice coaching
                </p>
                <p className={cn(MUTED, 'text-[10px] leading-tight')}>
                  Your coach speaks aloud after each response to guide and improve your phrasing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-[#e4e2f0]/70 bg-white/80 p-2 text-left dark:border-white/[0.06] dark:bg-white/4">
              <IconChip icon={Sparkles} tone="amber" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  Instant vocabulary hints
                </p>
                <p className={cn(MUTED, 'text-[10px] leading-tight')}>
                  Get high-band suggestions, collocations, and grammatical corrections in real time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-[#e4e2f0]/70 bg-white/80 p-2 text-left dark:border-white/[0.06] dark:bg-white/4">
              <IconChip icon={Mic2} tone="emerald" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  Hands-free flow with pause
                </p>
                <p className={cn(MUTED, 'text-[10px] leading-tight')}>
                  Answers submit automatically. You can pause anytime to take notes or gather
                  thoughts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-2 flex flex-wrap justify-center gap-1 sm:gap-1.5"
        role="group"
        aria-label="Practice highlights"
      >
        <span className="inline-flex min-h-7 items-center gap-1 rounded-full border border-[#e4e2f0] bg-white/70 px-2.5 text-[10px] font-bold text-slate-600 dark:border-white/[0.07] dark:bg-white/3 dark:text-slate-300">
          <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />8 min active time
        </span>
        <span className="inline-flex min-h-7 items-center gap-1 rounded-full border border-[#e4e2f0] bg-white/70 px-2.5 text-[10px] font-bold text-slate-600 dark:border-white/[0.07] dark:bg-white/3 dark:text-slate-300">
          <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
          Interactive transcript
        </span>
        <span className="inline-flex min-h-7 items-center gap-1 rounded-full border border-[#e4e2f0] bg-white/70 px-2.5 text-[10px] font-bold text-slate-600 dark:border-white/[0.07] dark:bg-white/3 dark:text-slate-300">
          <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
          Full coaching report
        </span>
      </div>

      <p className={cn(MUTED, 'mt-1.5 text-center text-[10px] leading-4')}>
        Your coach listens actively and speaks after each answer. Your choice stays with this
        session.
      </p>
    </section>
  );
}

function ReadinessCard({ device, icon: Icon, status, onClick }) {
  const [label, detail] = DEVICE_COPY[device][status] || DEVICE_COPY[device].idle;
  const isTesting = status === 'testing';
  const isReady = status === 'ready';
  const needsAttention = status === 'quiet' || status === 'error';
  const toneClass = isReady
    ? 'border-emerald-500/20 bg-emerald-500/5.5'
    : needsAttention
      ? 'border-amber-500/25 bg-amber-500/5.5'
      : 'border-[#e4e2f0] bg-white/70 hover:border-rose-500/25 hover:bg-white dark:border-white/[0.07] dark:bg-white/3 dark:hover:bg-white/6';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isTesting}
      whileTap={isTesting ? undefined : { scale: 0.985 }}
      className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left transition-colors sm:gap-3 sm:p-3 ${toneClass}`}
      aria-label={label}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${
          device === 'microphone'
            ? 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/8 text-rose-600 dark:text-rose-400'
        }`}
      >
        {isTesting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[10px] font-extrabold text-slate-800 dark:text-slate-100 sm:gap-1.5 sm:text-xs">
          {label}
          {isReady ? (
            <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
          ) : needsAttention ? (
            <AlertCircle className="h-3 w-3 text-amber-500" aria-hidden="true" />
          ) : null}
        </span>
        <span
          className={cn(
            MUTED,
            'mt-0.5 hidden truncate text-[9px] min-[360px]:block sm:text-[10px]'
          )}
        >
          {detail}
        </span>
      </span>
    </motion.button>
  );
}

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
  const { microphoneStatus, speakerStatus, testMicrophone, testSpeaker } =
    useSpeakingDeviceChecks();

  return (
    <div className="flex min-h-full w-full justify-center px-0 py-2 sm:px-4 sm:py-3">
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full max-w-3xl flex-col items-center text-center"
      >
        <h2 className="mt-0.5 text-xl font-extrabold tracking-[-0.035em] text-slate-900 dark:text-slate-50 sm:text-3xl">
          Ready to start Part {partNumber}?
        </h2>
        <p className="mt-1 text-xs font-bold text-rose-500 sm:text-sm">{title}</p>
        <p className={cn(MUTED, 'mt-1.5 max-w-xl text-xs leading-5 sm:text-sm sm:leading-6')}>
          {PART_INTROS[partNumber] || 'Answer naturally, listen carefully, and speak clearly.'}
          <br className="hidden sm:block" /> Answer naturally and speak clearly.
        </p>

        {speakingV2Available && (
          <div
            className="relative mt-3 grid w-full max-w-lg grid-cols-2 gap-2"
            aria-label="Speaking mode"
          >
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const selected = speakingMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSpeakingMode?.(mode.id)}
                  aria-pressed={selected}
                  aria-label={mode.label}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer select-none',
                    selected
                      ? 'border-[#5a63df]/40 text-[#444cc7] dark:text-[#aeb3ff]'
                      : 'border-[#e4e2f0] bg-white text-slate-700 hover:border-[#5a63df]/25 hover:bg-slate-50/50 dark:border-white/[0.07] dark:bg-white/3 dark:text-slate-200 dark:hover:bg-white/6'
                  )}
                >
                  {selected && (
                    <motion.div
                      layoutId="speakingModeActiveIndicator"
                      className="absolute -inset-px rounded-xl border-2 border-[#5a63df] bg-[#5a63df]/8 dark:border-[#8f97ff] dark:bg-[#5a63df]/15 pointer-events-none"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 500, damping: 36 }
                      }
                    />
                  )}
                  <span
                    className={cn(
                      'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      selected
                        ? 'bg-[#5a63df]/12 text-[#5a63df] dark:bg-[#5a63df]/25 dark:text-[#aeb3ff]'
                        : 'bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-400'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="relative z-10 min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em]">
                      {mode.label}
                      {selected && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[#5a63df] dark:bg-[#aeb3ff]"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className={cn(MUTED, 'block truncate text-[9px] sm:text-[10px]')}>
                      {mode.detail}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="relative w-full max-w-2xl min-h-[340px]">
          <AnimatePresence mode="wait" initial={false}>
            {speakingMode === 'exam' ? (
              <motion.div
                key="exam-mode-stage"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <ExaminerVoiceCarousel
                  examinerVoice={examinerVoice}
                  onExaminerVoiceChange={onExaminerVoiceChange}
                  onVoicePreview={onVoicePreview}
                  previewVoice={previewVoice}
                />
              </motion.div>
            ) : (
              <motion.div
                key="practice-mode-stage"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <PracticeCoachCard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          layout
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
          }
          className="mt-2.5 grid w-full max-w-lg grid-cols-2 gap-2"
        >
          <ReadinessCard
            device="microphone"
            icon={Mic2}
            status={microphoneStatus}
            onClick={testMicrophone}
          />
          <ReadinessCard
            device="speaker"
            icon={Volume2}
            status={speakerStatus}
            onClick={testSpeaker}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default InitialWelcomeScreen;
