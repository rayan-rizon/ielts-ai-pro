import React from 'react';
import {
  AudioLines,
  Loader2,
  Mic,
  MicOff,
  Pause,
  PlayCircle,
  Play,
  Square,
  Volume2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { MICRO, MUTED } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

function MicrophoneError({ message }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex w-full max-w-2xl items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30"
    >
      <MicOff className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
    </motion.div>
  );
}

function ExaminerStatus({ isProcessing, processingStatus }) {
  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span className={cn(MICRO, 'tracking-[0.16em]')}>
          {processingStatus || 'Preparing the next question...'}
        </span>
      </div>
    );
  }

  return null;
}

const RecordingControls = React.memo(
  ({
    testStarted,
    isPart2Prep,
    isListening,
    isProcessing,
    isSpeaking,
    isTTSLoading,
    processingStatus,
    micError,
    autoSubmitPaused,
    handsFreeEnabled,
    timerExpiredRef,
    onStartListening,
    onStopListening,
    onAutoSubmitPausedChange,
    onStartTest,
  }) => (
    <div className="flex w-full flex-col items-center gap-3">
      <AnimatePresence>
        <MicrophoneError message={micError} />
      </AnimatePresence>

      {!testStarted && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex w-full max-w-sm flex-col items-center gap-2 text-center"
        >
          <Button
            onClick={onStartTest}
            size="lg"
            className="h-12 w-full gap-2 rounded-xl border border-rose-600/30 bg-rose-500 px-7 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 hover:bg-rose-600"
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            Begin test
          </Button>
          <p className={cn(MUTED, 'text-[10px] leading-relaxed')}>
            Your progress is saved automatically.
          </p>
        </motion.div>
      )}

      {testStarted && !isPart2Prep && (
        <>
          <motion.div
            key="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-8 items-center justify-center"
          >
            {isListening ? (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AudioLines className="h-4 w-4 animate-pulse" aria-hidden="true" />
                <span className={cn(MICRO, 'tracking-[0.16em]')}>
                  {autoSubmitPaused ? 'Auto-send paused' : 'Transcript streaming in chat'}
                </span>
              </div>
            ) : (
              <>
                <ExaminerStatus isProcessing={isProcessing} processingStatus={processingStatus} />
                {!isProcessing && !isTTSLoading && !isSpeaking && (
                  <p className={cn(MICRO, MUTED, 'tracking-[0.16em]')}>
                    {handsFreeEnabled ? 'Microphone starting' : 'Ready for your answer'}
                  </p>
                )}
              </>
            )}
          </motion.div>

          <div className="flex w-full max-w-md items-center justify-center gap-3">
            {isListening && handsFreeEnabled && (
              <motion.button
                type="button"
                onClick={() => onAutoSubmitPausedChange(!autoSubmitPaused)}
                whileTap={{ scale: 0.96 }}
                aria-label={
                  autoSubmitPaused
                    ? 'Resume automatic answer sending'
                    : 'Pause automatic answer sending'
                }
                aria-pressed={autoSubmitPaused}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all sm:h-14 sm:w-14 ${
                  autoSubmitPaused
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 shadow-sm dark:text-amber-300'
                    : 'border-[#e4e2f0] bg-white text-slate-500 shadow-sm hover:border-amber-500/30 hover:bg-amber-500/6 hover:text-amber-700 dark:border-white/[0.07] dark:bg-white/3 dark:text-slate-400'
                }`}
              >
                {autoSubmitPaused ? (
                  <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                ) : (
                  <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
                )}
              </motion.button>
            )}
            <motion.button
              onClick={isListening ? () => onStopListening('manual') : onStartListening}
              disabled={isProcessing || isSpeaking || isTTSLoading || timerExpiredRef?.current}
              whileTap={!isProcessing && !isSpeaking && !isTTSLoading ? { scale: 0.97 } : {}}
              aria-label={isListening ? 'Finish and send answer' : 'Start recording answer'}
              className={`group relative flex h-12 min-w-[190px] items-center justify-center gap-2.5 rounded-2xl border px-5 text-sm font-extrabold transition-all sm:h-14 ${
                isProcessing || isSpeaking || isTTSLoading
                  ? 'cursor-not-allowed border-[#e4e2f0] bg-[#f4f3fb] text-slate-500 opacity-60 dark:border-white/[0.07] dark:bg-white/4 dark:text-slate-400'
                  : isListening
                    ? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600'
                    : 'border-rose-500/20 bg-white text-rose-600 shadow-md shadow-rose-500/10 hover:-translate-y-0.5 hover:border-rose-500/35 hover:bg-rose-500/4 dark:bg-white/3 dark:text-rose-400'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : isListening ? (
                <>
                  <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                  {handsFreeEnabled ? 'Finish now' : 'Finish & send'}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" aria-hidden="true" />
                  {handsFreeEnabled ? 'Start now' : 'Start answer'}
                </>
              )}
            </motion.button>
          </div>

          {!isProcessing && !isSpeaking && !isTTSLoading && (
            <p className={cn(MUTED, 'flex items-center gap-1.5 text-center text-[10px]')}>
              {isListening ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {handsFreeEnabled
                    ? autoSubmitPaused
                      ? 'Take your time. Tap play when you want silence detection to resume.'
                      : 'I’ll send after a natural pause. Pause auto-send whenever you need to think.'
                    : 'Manual mode is on. Finish and send when your answer is complete.'}
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                  {handsFreeEnabled
                    ? 'Hands-free mode starts after each question. Start now is only a fallback.'
                    : 'Start and finish each answer when you are ready.'}
                </>
              )}
            </p>
          )}
        </>
      )}
    </div>
  )
);

RecordingControls.displayName = 'RecordingControls';

export default RecordingControls;
