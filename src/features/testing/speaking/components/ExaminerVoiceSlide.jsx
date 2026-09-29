import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Square } from 'lucide-react';

import { cn } from '@/lib/cn';

import { EXAMINER_VOICE_PREVIEW } from '../utils/speakingAccents';

export default function ExaminerVoiceSlide({
  center,
  isPreviewing,
  onExaminerVoiceChange,
  onVoicePreview,
  offset,
  reducedMotion,
  visible,
  voice,
}) {
  const handleSelect = () => {
    if (center) onVoicePreview?.(voice.id, EXAMINER_VOICE_PREVIEW);
    else onExaminerVoiceChange?.(voice.id);
  };

  return (
    <motion.div
      className="examiner-voice-slide group"
      initial={false}
      animate={{
        x: `${offset * 112}%`,
        scale: center ? 1 : 0.72,
        opacity: visible ? (center ? 1 : 0.68) : 0,
      }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.36, ease: [0.2, 0, 0, 1] }}
      style={{ zIndex: center ? 2 : 1, pointerEvents: visible ? 'auto' : 'none' }}
      aria-hidden={!visible}
    >
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        onClick={handleSelect}
        aria-label={
          center
            ? `${isPreviewing ? 'Stop' : 'Preview'} ${voice.name} voice`
            : `Select ${voice.name}, ${voice.accent} ${voice.gender.toLowerCase()} examiner voice`
        }
        className={cn(
          'examiner-voice-orb-button group',
          center && 'examiner-voice-orb-button--selected',
          isPreviewing && 'examiner-voice-orb-button--playing'
        )}
      >
        <span className="examiner-voice-orb" data-voice={voice.id} aria-hidden="true">
          {center && (
            <span className="examiner-voice-play">
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={isPreviewing ? 'stop' : 'play'}
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={
                    reducedMotion
                      ? undefined
                      : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }
                  }
                  transition={{
                    duration: reducedMotion ? 0 : 0.18,
                    ease: [0.2, 0, 0, 1],
                  }}
                  className="grid place-items-center"
                >
                  {isPreviewing ? (
                    <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                  ) : (
                    <Play className="h-5 w-5 translate-x-px fill-current" aria-hidden="true" />
                  )}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </span>
      </button>
      <div className="mt-1 text-center">
        <span className="block text-sm font-extrabold tracking-tight text-slate-800 transition-colors duration-150 group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#bfc3ff]">
          {voice.name}
        </span>
        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
          {voice.accent} · {voice.gender}
        </span>
      </div>
    </motion.div>
  );
}
