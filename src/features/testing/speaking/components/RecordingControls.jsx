import React from 'react';
import { Mic, MicOff, Loader2, PlayCircle, Volume2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
    timerExpiredRef,
    onStartListening,
    onStopListening,
    onStartTest,
  }) => (
    <>
      {/* Microphone Error */}
      <AnimatePresence>
        {micError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 flex w-full max-w-2xl items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30"
          >
            <MicOff className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{micError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Test Button — Required for Chrome TTS */}
      {!testStarted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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
          <p className="hidden text-[10px] leading-relaxed text-muted-foreground 2xl:block">
            You can’t pause or go back once the test starts.
          </p>
        </motion.div>
      )}

      {/* Unified Status Area */}
      {testStarted && !isPart2Prep && (
        <div className="flex h-9 flex-col items-center justify-center gap-1">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 text-primary"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-black text-[10px] uppercase tracking-[0.2em]">
                  {processingStatus}
                </span>
              </motion.div>
            ) : isTTSLoading ? (
              /* ── Examiner is fetching audio from Cloud TTS ── */
              <motion.div
                key="tts-loading"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </motion.div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400">
                  Examiner preparing...
                </p>
              </motion.div>
            ) : isSpeaking ? (
              /* ── Examiner is speaking (audio playing) ── */
              <motion.div
                key="speaking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1 dark:bg-rose-500/10"
              >
                {/* Animated soundwave bars */}
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-rose-500 rounded-full"
                      animate={{ height: ['4px', `${8 + i * 2}px`, '4px'] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-rose-600 dark:text-rose-400">
                  Examiner speaking...
                </p>
              </motion.div>
            ) : isListening ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center"
              >
                <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 dark:bg-primary/10">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    LISTENING... SPEAK NATURALLY
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Tap the microphone when you are ready
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Microphone Button */}
      {testStarted && !isPart2Prep && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1 h-8 justify-end w-16" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => {
                const height = isListening
                  ? Math.max(4, 6 + Math.sin(i * 0.6) * 16)
                  : [4, 8, 14, 20, 12, 8, 4][i];
                return (
                  <motion.div
                    key={`wave-l-${i}`}
                    layout
                    className={`w-0.5 sm:w-1 rounded-full transition-all duration-300 ${
                      isListening
                        ? 'bg-gradient-to-t from-rose-500 to-orange-400 animate-pulse'
                        : 'bg-slate-200 dark:bg-white/10'
                    }`}
                    style={{
                      height: `${height}px`,
                      animationDelay: isListening ? `${(6 - i) * 70}ms` : undefined,
                      animationDuration: isListening ? `${500 + ((6 - i) % 3) * 150}ms` : undefined,
                    }}
                  />
                );
              })}
            </div>

            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-rose-500/20 dark:bg-rose-500/10 blur-xl"
                animate={{
                  scale: isListening ? [1, 1.4, 1] : 1,
                  opacity: isListening ? [0.3, 0.6, 0.3] : 0,
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative group">
                <div className="absolute -inset-2 rounded-full bg-rose-500/15 opacity-50 blur-xl transition-opacity duration-500 group-hover:opacity-80" />

                <motion.button
                  onClick={isListening ? onStopListening : onStartListening}
                  disabled={isProcessing || isSpeaking || isTTSLoading || timerExpiredRef?.current}
                  whileTap={!isProcessing && !isSpeaking && !isTTSLoading ? { scale: 0.95 } : {}}
                  title={isListening ? 'Send my answer' : 'Start speaking'}
                  aria-label={
                    isListening ? 'Stop recording and send answer' : 'Start recording answer'
                  }
                  className={`relative flex h-16 w-16 transform-gpu items-center justify-center rounded-full border transition-colors duration-300 sm:h-[4.5rem] sm:w-[4.5rem] ${
                    isProcessing || isSpeaking || isTTSLoading
                      ? 'cursor-not-allowed border-border bg-muted opacity-55'
                      : isListening
                        ? 'border-rose-400 bg-rose-500 shadow-lg shadow-rose-500/25'
                        : 'group/btn border-rose-500/20 bg-card text-rose-500 shadow-lg shadow-rose-500/10 hover:border-rose-500/40 hover:bg-rose-500/[0.04]'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground animate-spin" />
                  ) : isTTSLoading ? (
                    /* Pulsing volume icon while TTS is loading */
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                    </motion.div>
                  ) : isSpeaking ? (
                    /* Animated volume icon while examiner is speaking */
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                    </motion.div>
                  ) : isListening ? (
                    <div className="relative flex items-center justify-center -ml-0.5 mt-0.5">
                      <Send className="h-6 w-6 fill-white/10 text-white" />
                    </div>
                  ) : (
                    <div className="relative transition-transform group-hover/btn:scale-110 duration-500">
                      <Mic className="h-6 w-6 text-rose-500 transition-transform duration-300 group-hover/btn:scale-110" />
                    </div>
                  )}
                </motion.button>
              </div>
            </div>

            <div className="flex items-center gap-1 h-8 justify-start w-16" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => {
                const height = isListening
                  ? Math.max(4, 6 + Math.sin(i * 0.6) * 16)
                  : [4, 8, 12, 20, 14, 8, 4][i];
                return (
                  <motion.div
                    key={`wave-r-${i}`}
                    layout
                    className={`w-0.5 sm:w-1 rounded-full transition-all duration-300 ${
                      isListening
                        ? 'bg-gradient-to-t from-rose-500 to-orange-400 animate-pulse'
                        : 'bg-slate-200 dark:bg-white/10'
                    }`}
                    style={{
                      height: `${height}px`,
                      animationDelay: isListening ? `${i * 70}ms` : undefined,
                      animationDuration: isListening ? `${500 + (i % 3) * 150}ms` : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Helper Text Area */}
          <div className="flex h-5 items-center justify-center">
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="animate-pulse text-[9px] font-extrabold uppercase tracking-[0.16em] text-rose-500/80 sm:text-[10px] dark:text-rose-400/80"
                >
                  Tap to send your response
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  )
);

RecordingControls.displayName = 'RecordingControls';
export default RecordingControls;
