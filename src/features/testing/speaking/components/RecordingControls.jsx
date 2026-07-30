import React, { useEffect, useState } from 'react';
import {
  AudioLines,
  Captions,
  Loader2,
  Mic,
  MicOff,
  PlayCircle,
  Square,
  Volume2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';

import { formatRecordingDuration } from '../utils/speakingCaptureUtils';

const WAVEFORM_SHAPE = [0.35, 0.58, 0.8, 0.48, 0.92, 0.64, 1, 0.72, 0.5, 0.82, 0.55, 0.38];

function MicrophoneError({ message }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex w-full max-w-2xl items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30"
    >
      <MicOff className="h-5 w-5 flex-shrink-0 text-red-500" aria-hidden="true" />
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
    </motion.div>
  );
}

function ExaminerStatus({ isProcessing, isTTSLoading, isSpeaking, processingStatus }) {
  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">
          {processingStatus || 'Preparing the next question...'}
        </span>
      </div>
    );
  }

  if (isTTSLoading || isSpeaking) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-rose-500/15 bg-rose-500/[0.06] px-3 py-1 text-rose-600 dark:text-rose-400">
        <AudioLines className={isSpeaking ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">
          {isSpeaking ? 'Examiner speaking' : 'Examiner preparing'}
        </span>
      </div>
    );
  }

  return null;
}

function LiveWaveform() {
  return (
    <div className="flex h-8 flex-1 items-center justify-center gap-1" aria-hidden="true">
      {WAVEFORM_SHAPE.map((shape, index) => {
        return (
          <motion.span
            key={index}
            className="w-1 rounded-full bg-gradient-to-t from-rose-500 to-orange-400"
            animate={{ height: [5, 8 + shape * 22, 5] }}
            transition={{
              duration: 0.7 + (index % 3) * 0.12,
              repeat: Infinity,
              delay: index * 0.035,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

function StreamingAnswer({
  liveTranscript,
  recordingStartedAt,
  autoFinishCountdown,
  hasDetectedSpeech,
}) {
  const [durationMs, setDurationMs] = useState(0);

  useEffect(() => {
    if (!recordingStartedAt) {
      setDurationMs(0);
      return undefined;
    }

    const updateDuration = () => setDurationMs(Date.now() - recordingStartedAt);
    updateDuration();
    const timer = setInterval(updateDuration, 250);
    return () => clearInterval(timer);
  }, [recordingStartedAt]);

  const preview =
    liveTranscript ||
    (hasDetectedSpeech
      ? 'Keep speaking naturally—your answer is still being captured.'
      : 'Start speaking when you are ready.');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="w-full max-w-3xl overflow-hidden rounded-2xl border border-rose-500/15 bg-gradient-to-br from-rose-500/[0.055] via-card to-blue-500/[0.035] shadow-sm"
    >
      <div className="flex items-center gap-3 border-b border-border/55 px-3.5 py-2.5 sm:px-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-foreground">
          Live answer
        </span>
        <LiveWaveform />
        <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">
          {formatRecordingDuration(durationMs)}
        </span>
      </div>

      <div className="flex min-h-[54px] items-start gap-2.5 px-3.5 py-3 sm:px-4">
        <Captions className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" aria-hidden="true" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm leading-5 text-foreground">{preview}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Live transcript preview. Final wording may be refined after you finish.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {autoFinishCountdown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-amber-500/15 bg-amber-500/[0.07] px-3.5 py-2 text-center sm:px-4"
          >
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Finishing in {autoFinishCountdown}s
              <span className="font-normal"> — keep speaking to continue</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
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
    liveTranscript,
    recordingStartedAt,
    autoFinishCountdown,
    hasDetectedSpeech,
    handsFreeEnabled,
    timerExpiredRef,
    onStartListening,
    onStopListening,
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
            className="h-12 w-full gap-2 rounded-xl bg-rose-500 px-7 text-sm font-extrabold text-white shadow-lg shadow-rose-500/20 transition-transform hover:-translate-y-0.5 hover:bg-rose-600"
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            Begin test
          </Button>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Your progress is saved automatically.
          </p>
        </motion.div>
      )}

      {testStarted && !isPart2Prep && (
        <>
          <AnimatePresence mode="wait">
            {isListening ? (
              <StreamingAnswer
                key="streaming"
                liveTranscript={liveTranscript}
                recordingStartedAt={recordingStartedAt}
                autoFinishCountdown={autoFinishCountdown}
                hasDetectedSpeech={hasDetectedSpeech}
              />
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-8 items-center justify-center"
              >
                <ExaminerStatus
                  isProcessing={isProcessing}
                  isTTSLoading={isTTSLoading}
                  isSpeaking={isSpeaking}
                  processingStatus={processingStatus}
                />
                {!isProcessing && !isTTSLoading && !isSpeaking && (
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                    {handsFreeEnabled ? 'Microphone starting' : 'Ready for your answer'}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex w-full max-w-md items-center justify-center gap-3">
            <motion.button
              onClick={isListening ? () => onStopListening('manual') : onStartListening}
              disabled={isProcessing || isSpeaking || isTTSLoading || timerExpiredRef?.current}
              whileTap={!isProcessing && !isSpeaking && !isTTSLoading ? { scale: 0.97 } : {}}
              aria-label={isListening ? 'Finish and send answer' : 'Start recording answer'}
              className={`group relative flex h-12 min-w-[190px] items-center justify-center gap-2.5 rounded-2xl border px-5 text-sm font-extrabold transition-all sm:h-14 ${
                isProcessing || isSpeaking || isTTSLoading
                  ? 'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60'
                  : isListening
                    ? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600'
                    : 'border-rose-500/20 bg-card text-rose-600 shadow-md shadow-rose-500/10 hover:-translate-y-0.5 hover:border-rose-500/35 hover:bg-rose-500/[0.04]'
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
            <p className="flex items-center gap-1.5 text-center text-[10px] text-muted-foreground">
              {isListening ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {handsFreeEnabled
                    ? 'I’ll send after a natural pause. Keep speaking to cancel the countdown.'
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
