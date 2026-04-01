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
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
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
          className="text-center space-y-2 bg-white/50 dark:bg-black/20 p-4 sm:p-5 rounded-xl border-2 border-dashed border-rose-200 dark:border-rose-500/20 max-w-[280px] sm:max-w-sm mx-auto"
        >
          <div className="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
            <PlayCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold tracking-tight">Ready to begin?</h4>
            <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
              Your speaking session is ready. Click the button below to start.
            </p>
          </div>
          <Button
            onClick={onStartTest}
            size="lg"
            className="bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white shadow-lg shadow-rose-500/10 px-5 sm:px-6 py-4 text-xs sm:text-sm font-black tracking-tight rounded-lg gap-2 hover-lift w-full sm:w-auto mt-2"
          >
            <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Begin Now
          </Button>
        </motion.div>
      )}

      {/* Audio Level Visualizer — CSS-only, shown while recording */}
      {testStarted && !isPart2Prep && isListening && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-1 h-8 py-2"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-rose-500 to-orange-400 rounded-full animate-pulse"
              style={{
                height: `${Math.max(4, 8 + Math.sin(i * 0.8) * 12)}px`,
                animationDelay: `${i * 80}ms`,
                animationDuration: `${600 + (i % 5) * 100}ms`,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Status Text */}
      {testStarted && !isPart2Prep && (
        <div className="h-8">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-3 text-primary"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
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
                className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full"
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
                className="flex items-center gap-2 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full"
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
                className="bg-primary/5 dark:bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full"
              >
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  LISTENING... SPEAK NATURALLY
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-opacity hover:opacity-100 italic">
                  Click the microphone to speak
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Microphone Button */}
      {testStarted && !isPart2Prep && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-rose-500/20 dark:bg-rose-500/10 blur-xl"
              animate={{
                scale: isListening ? [1, 1.5, 1] : 1,
                opacity: isListening ? [0.3, 0.6, 0.3] : 0,
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative group">
              <div
                className={`absolute -inset-2 bg-gradient-to-br transition-opacity duration-700 blur-2xl opacity-20 dark:opacity-40 group-hover:opacity-60 ${isListening ? 'from-rose-500 to-orange-600 animate-pulse' : 'from-rose-500 to-orange-400'}`}
              />

              <motion.button
                onClick={isListening ? onStopListening : onStartListening}
                disabled={isProcessing || isSpeaking || isTTSLoading || timerExpiredRef?.current}
                whileTap={!isProcessing && !isSpeaking && !isTTSLoading ? { scale: 0.95 } : {}}
                title={isListening ? 'Send my answer' : 'Start speaking'}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center transition-colors duration-500 border-4 transform-gpu ${
                  isProcessing || isSpeaking || isTTSLoading
                    ? 'bg-muted dark:bg-zinc-800 border-muted-foreground/10 cursor-not-allowed opacity-50'
                    : isListening
                      ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-orange-700 border-rose-400/30'
                      : 'bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border-rose-500/20 hover:border-rose-500/40 shadow-xl group/btn'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground animate-spin" />
                ) : isTTSLoading ? (
                  /* Pulsing volume icon while TTS is loading */
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </motion.div>
                ) : isSpeaking ? (
                  /* Animated volume icon while examiner is speaking */
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </motion.div>
                ) : isListening ? (
                  <div className="relative flex items-center justify-center -ml-1 mt-0.5">
                    <Send className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white/10" />
                  </div>
                ) : (
                  <div className="relative transition-transform group-hover/btn:scale-110 duration-500">
                    <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500 group-hover:text-rose-600 transition-colors" />
                  </div>
                )}
              </motion.button>
            </div>
          </div>

          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-2 sm:mt-4"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-rose-500/70 dark:text-rose-400/70 animate-pulse"
              >
                Tap to send your response
              </motion.div>
            </motion.div>
          )}
        </div>
      )}
    </>
  )
);

RecordingControls.displayName = 'RecordingControls';
export default RecordingControls;
