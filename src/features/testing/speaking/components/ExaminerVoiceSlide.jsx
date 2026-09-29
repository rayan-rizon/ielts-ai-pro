import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Square } from 'lucide-react';

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
  return (
    <motion.div
      className="examiner-voice-slide group"
      {...getMotionProps({ center, offset, reducedMotion, visible })}
    >
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        onClick={() => selectVoice({ center, onExaminerVoiceChange, onVoicePreview, voice })}
        aria-label={voiceActionLabel({ center, isPreviewing, voice })}
        className={voiceButtonClass({ center, isPreviewing })}
      >
        <span className="examiner-voice-orb" data-voice={voice.id} aria-hidden="true">
          {center && <OrbPlaybackControl isPreviewing={isPreviewing} reducedMotion={reducedMotion} />}
        </span>
      </button>
      <VoiceIdentity voice={voice} />
    </motion.div>
  );
}

function getMotionProps({ center, offset, reducedMotion, visible }) {
  return {
    initial: false,
    animate: {
      x: `${offset * 112}%`,
      scale: center ? 1 : 0.72,
      opacity: slideOpacity(center, visible),
    },
    transition: reducedMotion ? { duration: 0 } : { duration: 0.36, ease: [0.2, 0, 0, 1] },
    style: { zIndex: center ? 2 : 1, pointerEvents: visible ? 'auto' : 'none' },
    'aria-hidden': !visible,
  };
}

function slideOpacity(center, visible) {
  if (!visible) return 0;
  return center ? 1 : 0.68;
}

function voiceActionLabel({ center, isPreviewing, voice }) {
  if (center) return `${isPreviewing ? 'Stop' : 'Preview'} ${voice.name} voice`;
  return `Select ${voice.name}, ${voice.accent} ${voice.gender.toLowerCase()} examiner voice`;
}

function voiceButtonClass({ center, isPreviewing }) {
  return [
    'examiner-voice-orb-button group',
    center && 'examiner-voice-orb-button--selected',
    isPreviewing && 'examiner-voice-orb-button--playing',
  ]
    .filter(Boolean)
    .join(' ');
}

function selectVoice({ center, onExaminerVoiceChange, onVoicePreview, voice }) {
  if (center) return onVoicePreview?.(voice.id, EXAMINER_VOICE_PREVIEW);
  return onExaminerVoiceChange?.(voice.id);
}

function OrbPlaybackControl({ isPreviewing, reducedMotion }) {
  const icon = isPreviewing ? (
    <Square className="h-4 w-4 fill-current" aria-hidden="true" />
  ) : (
    <Play className="h-5 w-5 translate-x-px fill-current" aria-hidden="true" />
  );

  return (
    <span className="examiner-voice-play">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={isPreviewing ? 'stop' : 'play'}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.2, 0, 0, 1] }}
          className="grid place-items-center"
        >
          {icon}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function VoiceIdentity({ voice }) {
  return (
    <div className="mt-1 text-center">
      <span className="block text-sm font-extrabold tracking-tight text-slate-800 transition-colors duration-150 group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#bfc3ff]">
        {voice.name}
      </span>
      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
        {voice.accent} · {voice.gender}
      </span>
    </div>
  );
}
