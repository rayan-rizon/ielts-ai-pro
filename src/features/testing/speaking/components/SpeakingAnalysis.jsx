import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { BorderBeam } from 'border-beam';
import { LogoIcon } from '@/components/shared/Logo';
import { cn } from '@/lib/cn';

const ANALYSIS_STEPS = [
  {
    id: 'fc',
    label: 'Fluency & Coherence',
    duration: 1800,
  },
  {
    id: 'lr',
    label: 'Lexical Resource',
    duration: 1800,
  },
  {
    id: 'gra',
    label: 'Grammatical Range',
    duration: 1700,
  },
  {
    id: 'pr',
    label: 'Pronunciation Accuracy',
    duration: 1600,
  },
];

/**
 * SpeakingAnalysis
 *
 * Speaking Test AI evaluation loading screen featuring the signature Red/Sunset
 * theme, animated BorderBeam wrapper, seamless circular logo emblem,
 * fluid progress shimmer (no numbers), and clean 4-criteria status tracking.
 */
export default function SpeakingAnalysis({ loadingMessage, colorVariant = 'ocean', size = 'md' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [progress, setProgress] = useState(15);

  // Time-synchronized criteria steps progression (snappy & responsive)
  useEffect(() => {
    const timers = [];
    let elapsed = 0;

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      elapsed += ANALYSIS_STEPS[i].duration;
      const stepIdx = i;
      const t = setTimeout(() => {
        setCompletedSteps((prev) => new Set([...prev, stepIdx]));
        setCurrentStep(Math.min(stepIdx + 1, ANALYSIS_STEPS.length - 1));
      }, elapsed);
      timers.push(t);
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  // Responsive continuous progress meter (purely visual, no numeric text)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return 94;
        const remaining = 95 - prev;
        const increment = Math.max(0.4, remaining * 0.055);
        return Math.min(94, prev + increment);
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  const getStepStatus = (idx) => {
    if (completedSteps.has(idx)) return 'completed';
    if (idx === currentStep) return 'evaluating';
    return 'pending';
  };

  const isFinalStage = completedSteps.size === ANALYSIS_STEPS.length;
  const activeStepMeta = ANALYSIS_STEPS[currentStep];

  const currentStatusText = useMemo(() => {
    if (isFinalStage) return 'Calibrating final speaking band score...';
    if (loadingMessage) return loadingMessage;
    return `Reviewing ${activeStepMeta?.label.toLowerCase()}...`;
  }, [isFinalStage, loadingMessage, activeStepMeta?.label]);

  return (
    <motion.div
      key="speaking-analysis"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative flex min-h-[500px] flex-1 items-center justify-center bg-[#f7f6fd] p-4 sm:p-6 dark:bg-[#08080a]"
    >
      {/* Dynamic Luminous BorderBeam Wrapped Card */}
      <BorderBeam
        size={size}
        colorVariant={colorVariant}
        duration={6}
        brightness={1.6}
        saturation={1.4}
        className="w-full max-w-sm"
      >
        <div className="relative w-full rounded-[20px] border border-[#e4e2f0] bg-white p-6 text-center shadow-sm sm:p-7 dark:border-white/10 dark:bg-[#131315]">
          {/* Seamless Circular Logo & Animated Orbital Ring */}
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            {/* Outer Subtle Dashed Orbit (8s) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-dashed border-rose-500/25 dark:border-rose-400/20"
            />

            {/* Counter-Rotating Rose Accent Arc (4s) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500 dark:border-t-rose-400"
            />

            {/* Centered Neutral Circular Logo Surface */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#e4e2f0] bg-[#fbfbfe] shadow-xs dark:border-white/10 dark:bg-white/[0.04]">
              <LogoIcon className="h-8 w-8" />
            </div>
          </div>

          {/* Eyebrow Badge in Rose Theme */}
          <div className="mb-2 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/[0.07] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/[0.12] dark:text-rose-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75 dark:bg-rose-400" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
              </span>
              IELTS Speaking Review
            </span>
          </div>

          {/* Title & Live Status */}
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Evaluating Your Speaking
          </h2>
          <p className="mt-1 min-h-5 text-xs text-slate-500 transition-opacity duration-200 dark:text-slate-400">
            {currentStatusText}
          </p>

          {/* Smooth Red/Rose Progress Bar (NO NUMBERS) */}
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[#f4f3fb] dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-rose-500 transition-all duration-300 ease-out dark:bg-rose-400"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 4 Speaking Criteria Status Items (NO NUMBERS) */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-left">
            {ANALYSIS_STEPS.map((step, idx) => {
              const status = getStepStatus(idx);
              const isDone = status === 'completed';
              const isCurrent = status === 'evaluating';

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors duration-150',
                    isDone &&
                      'border-[#e4e2f0] bg-[#fbfbfe] text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                    isCurrent &&
                      'border-rose-500/35 bg-rose-500/[0.04] text-slate-900 ring-1 ring-rose-500/15 dark:border-rose-400/30 dark:bg-rose-400/[0.08] dark:text-white dark:ring-rose-400/15',
                    !isDone &&
                      !isCurrent &&
                      'border-[#ebeaf7] bg-white text-slate-400 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-500'
                  )}
                >
                  {/* Status Indicator Icon */}
                  <div className="shrink-0">
                    {isDone ? (
                      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-300">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="flex h-3.5 w-3.5 items-center justify-center text-rose-500 dark:text-rose-400">
                        <Loader2 className="h-3 w-3 animate-spin stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="mx-1 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                    )}
                  </div>

                  <span className="truncate text-[11px] font-semibold">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Minimal Footnote (NO NUMBERS) */}
          <p className="mt-4 border-t border-[#eceafa] pt-3 text-[10.5px] text-slate-400 dark:border-white/[0.07] dark:text-slate-500">
            Evaluated against official IELTS speaking band criteria
          </p>
        </div>
      </BorderBeam>
    </motion.div>
  );
}
