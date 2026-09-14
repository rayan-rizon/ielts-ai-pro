import React from 'react';
import { Loader2, Mic, MicOff, Pause, Play, PlayCircle, Square } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { MICRO, MUTED } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

function MicrophoneError({ message }) {
  const prefersReducedMotion = useReducedMotion();
  if (!message) return null;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="flex w-full max-w-2xl items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/50 dark:bg-red-950/30"
      role="alert"
    >
      <MicOff className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
      <p className="text-xs leading-snug text-red-700 dark:text-red-300">{message}</p>
    </motion.div>
  );
}

function ExaminerStatus({ isProcessing, processingStatus }) {
  if (!isProcessing) return null;

  return (
    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400" role="status">
      <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
      <span className={cn(MICRO, 'tracking-[0.14em]')}>
        {processingStatus || 'Preparing next question…'}
      </span>
    </div>
  );
}

const RecordingControls = React.memo(function RecordingControls({
  testStarted,
  isPart2Prep,
  isListening,
  isProcessing,
  isSpeaking,
  isTTSLoading,
  isPlaybackActive,
  processingStatus,
  micError,
  autoSubmitPaused,
  handsFreeEnabled,
  timerExpiredRef,
  onStartListening,
  onStopListening,
  onAutoSubmitPausedChange,
  onStartTest,
}) {
  const prefersReducedMotion = useReducedMotion();
  const isUnavailable =
    isProcessing || isSpeaking || isTTSLoading || isPlaybackActive || timerExpiredRef?.current;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <AnimatePresence initial={false}>
        <MicrophoneError message={micError} />
      </AnimatePresence>

      {!testStarted && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className="mx-auto flex w-full max-w-sm flex-col items-center gap-1.5 text-center"
        >
          <Button
            onClick={onStartTest}
            size="lg"
            className="h-11 w-full gap-2 rounded-lg border border-rose-600/30 bg-rose-500 px-6 text-sm font-extrabold text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-rose-600"
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            Begin test
          </Button>
          <p className={cn(MUTED, 'text-[10px] leading-relaxed')}>Progress saves automatically.</p>
        </motion.div>
      )}

      {testStarted && !isPart2Prep && (
        <>
          {!isListening && (
            <div className="flex min-h-5 items-center justify-center">
              <ExaminerStatus isProcessing={isProcessing} processingStatus={processingStatus} />
              {!isProcessing && !isTTSLoading && !isSpeaking && !isPlaybackActive && (
                <p className={cn(MICRO, MUTED, 'tracking-[0.14em]')}>
                  {handsFreeEnabled ? 'Microphone ready' : 'Ready for your answer'}
                </p>
              )}
            </div>
          )}

          <div className="flex w-full max-w-sm items-center justify-center gap-2">
            {isListening && handsFreeEnabled && (
              <motion.button
                type="button"
                onClick={() => onAutoSubmitPausedChange(!autoSubmitPaused)}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                aria-label={
                  autoSubmitPaused
                    ? 'Resume test timer and automatic answer sending'
                    : 'Pause test timer and automatic answer sending'
                }
                aria-pressed={autoSubmitPaused}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 ${
                  autoSubmitPaused
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-[#e4e2f0] bg-white text-slate-500 hover:border-amber-500/30 hover:bg-amber-500/6 hover:text-amber-700 dark:border-white/[0.07] dark:bg-white/3 dark:text-slate-400'
                }`}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={autoSubmitPaused ? 'resume' : 'pause'}
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }
                    }
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }
                    }
                    transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                  >
                    {autoSubmitPaused ? (
                      <Play className="h-4.5 w-4.5 fill-current" aria-hidden="true" />
                    ) : (
                      <Pause className="h-4.5 w-4.5 fill-current" aria-hidden="true" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            )}

            <motion.button
              type="button"
              onClick={isListening ? () => onStopListening('manual') : onStartListening}
              disabled={isUnavailable}
              whileTap={!isUnavailable && !prefersReducedMotion ? { scale: 0.97 } : undefined}
              aria-label={isListening ? 'Finish and send answer' : 'Start recording answer'}
              className={`group relative flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-extrabold transition-[background-color,border-color,color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 ${
                isUnavailable
                  ? 'cursor-not-allowed border-[#e4e2f0] bg-[#f4f3fb] text-slate-500 opacity-60 dark:border-white/[0.07] dark:bg-white/4 dark:text-slate-400'
                  : isListening
                    ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600'
                    : 'border-rose-500/20 bg-white text-rose-600 hover:border-rose-500/35 hover:bg-rose-500/4 dark:bg-white/3 dark:text-rose-400'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              ) : isListening ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  {handsFreeEnabled ? 'Finish now' : 'Finish & send'}
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  {handsFreeEnabled ? 'Start now' : 'Start answer'}
                </>
              )}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
});

RecordingControls.displayName = 'RecordingControls';
export default RecordingControls;
