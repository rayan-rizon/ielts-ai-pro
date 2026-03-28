import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, Activity, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SpeakingAnalysis
 *
 * Interactive and visually engaging evaluation screen for Speaking Test.
 * Uses time-based step progression (not message-matching) so steps advance
 * naturally while the API call is in flight.
 */
export default function SpeakingAnalysis({ loadingMessage }) {
  const analysisSteps = [
    { label: 'Fluency & Coherence', duration: 2800 },
    { label: 'Lexical Resource', duration: 2600 },
    { label: 'Grammatical Range', duration: 2400 },
    { label: 'Pronunciation Accuracy', duration: 2200 },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Advance steps on a natural timing schedule
  useEffect(() => {
    const timers = [];
    let elapsed = 0;
    for (let i = 0; i < analysisSteps.length; i++) {
      elapsed += analysisSteps[i].duration;
      const step = i;
      const t = setTimeout(() => {
        setCompletedSteps((prev) => new Set([...prev, step]));
        setCurrentStep(Math.min(step + 1, analysisSteps.length - 1));
      }, elapsed);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatus = (idx) => {
    if (completedSteps.has(idx)) return 'completed';
    if (idx === currentStep && !completedSteps.has(idx)) return 'current';
    return 'pending';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 min-h-[70vh] relative overflow-hidden"
    >
      {/* Background Aesthetic Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-[80px] animate-pulse [animation-delay:1s]" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-12 flex flex-col items-center">
        {/* Dynamic AI Orb Animation */}
        <div className="relative w-40 h-40">
          {/* Outer Rotating Glowing Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-t-2 border-b-2 border-rose-500/30 dark:border-rose-400/20"
          />

          {/* Middle Counter-Rotating Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-3 rounded-full border-r-2 border-l-2 border-orange-500/40 dark:border-orange-400/30"
          />

          {/* Central Glowing Orb */}
          <div className="absolute inset-7 rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            <div className="relative">
              <Bot className="w-10 h-10 text-rose-500 dark:text-rose-400 animate-pulse" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-4 bg-rose-500/20 rounded-full blur-md"
              />
            </div>
          </div>

          {/* Orbiting Elements */}
          {[0, 90, 180, 270].map((angle, i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]"
                style={{ transformOrigin: 'center 80px' }}
              />
            </motion.div>
          ))}
        </div>

        {/* Status Information */}
        <div className="text-center space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Analyzing{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600 dark:from-rose-400 dark:to-orange-400">
              Speaking
            </span>{' '}
            Performance
          </motion.h2>

          <div className="h-6 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]"
              >
                {completedSteps.size === analysisSteps.length
                  ? 'Calculating Final Band...'
                  : loadingMessage || `Analyzing ${analysisSteps[currentStep]?.label || ''}...`}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Step Progress Grid */}
        <div className="w-full grid grid-cols-1 gap-3 px-8">
          {analysisSteps.map((step, idx) => {
            const status = getStatus(idx);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-2xl border transition-all duration-500 shadow-sm',
                  status === 'completed'
                    ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-500/20'
                    : status === 'current'
                      ? 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-500/30 scale-[1.02] shadow-md ring-1 ring-rose-500/20'
                      : 'bg-white/50 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-50'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500',
                    status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : status === 'current'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  )}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : status === 'current' ? (
                    <Activity className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-black tracking-widest uppercase',
                    status === 'completed'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : status === 'current'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500 dark:text-slate-600'
                  )}
                >
                  {step.label}
                </span>
                {status === 'current' && (
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-auto flex gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar Footer */}
        <div className="w-full space-y-3 pt-6 border-t border-dashed border-border/60 px-4">
          <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-border/40">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 rounded-full"
              animate={{
                width: ['5%', '95%'],
                backgroundPosition: ['0% 50%', '100% 50%'],
              }}
              transition={{
                width: { duration: 12, ease: 'linear' },
                backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <span>EST. TIME: ~10–15s</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>AI POWERED ANALYSIS</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
