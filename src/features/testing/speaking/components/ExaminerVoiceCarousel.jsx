import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';
import { MICRO, MUTED, Pill } from '@/features/dashboard/components/primitives';

import { SPEAKING_EXAMINER_VOICES } from '../utils/speakingAccents';
import ExaminerVoiceSlide from './ExaminerVoiceSlide';
import './examinerVoiceCarousel.css';

const VOICES = SPEAKING_EXAMINER_VOICES;

function circularOffset(index, selectedIndex) {
  const forward = (index - selectedIndex + VOICES.length) % VOICES.length;
  if (forward === 0) return 0;
  if (forward <= VOICES.length / 2) return forward;
  return forward - VOICES.length;
}

export default function ExaminerVoiceCarousel({
  examinerVoice,
  onExaminerVoiceChange,
  onVoicePreview,
  previewVoice,
}) {
  const reducedMotion = useReducedMotion();
  const selectedIndex = Math.max(
    0,
    VOICES.findIndex((voice) => voice.id === examinerVoice)
  );
  const selectedVoice = VOICES[selectedIndex];

  const selectRelative = (direction) => {
    const next = (selectedIndex + direction + VOICES.length) % VOICES.length;
    onExaminerVoiceChange?.(VOICES[next].id);
  };

  return (
    <section
      className="flex h-full w-full flex-col justify-between text-left"
      aria-labelledby="examiner-voice-title"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#e4e2f0]/70 px-3 py-2 dark:border-white/[0.06] sm:px-4 sm:py-2.5">
        <div>
          <p className={cn(MICRO, MUTED)}>Examiner voice</p>
          <h3
            id="examiner-voice-title"
            className="text-xs font-extrabold text-slate-800 dark:text-slate-100 sm:text-sm"
          >
            Choose your examiner voice
          </h3>
        </div>
        <Pill tone="accent">{VOICES.length} voices</Pill>
      </div>

      <div className="examiner-voice-stage py-0.5">
        <div className="examiner-voice-scene" aria-label="Examiner voice carousel">
          {VOICES.map((voice, index) => {
            const offset = circularOffset(index, selectedIndex);
            const visible = Math.abs(offset) <= 1;
            const center = offset === 0;
            return (
              <ExaminerVoiceSlide
                key={voice.id}
                center={center}
                isPreviewing={previewVoice === voice.id}
                onExaminerVoiceChange={onExaminerVoiceChange}
                onVoicePreview={onVoicePreview}
                offset={offset}
                reducedMotion={reducedMotion}
                visible={visible}
                voice={voice}
              />
            );
          })}
        </div>

        <div className="examiner-voice-navigation">
          <button
            type="button"
            onClick={() => selectRelative(-1)}
            aria-label="Previous examiner voice"
            className="examiner-voice-arrow"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className={cn(MICRO, 'text-slate-500 dark:text-slate-400')} aria-live="polite">
            {String(selectedIndex + 1).padStart(2, '0')} / {String(VOICES.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => selectRelative(1)}
            aria-label="Next examiner voice"
            className="examiner-voice-arrow"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="border-t border-[#e4e2f0]/70 px-3 py-2 text-center dark:border-white/[0.06] sm:px-4 sm:py-2">
        <div
          className="flex flex-wrap justify-center gap-1"
          role="group"
          aria-label="All examiner voices"
        >
          {VOICES.map((voice) => {
            const selected = voice.id === selectedVoice.id;
            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => onExaminerVoiceChange?.(voice.id)}
                aria-label={`Select ${voice.name}, ${voice.accent} ${voice.gender.toLowerCase()} examiner voice`}
                aria-pressed={selected}
                className={cn(
                  'inline-flex min-h-6.5 items-center gap-1 rounded-full border px-2.5 text-[10px] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                  selected
                    ? 'border-[#5a63df]/40 bg-[#5a63df]/10 text-[#444cc7] dark:text-[#bfc3ff]'
                    : 'border-[#e4e2f0] bg-white/70 text-slate-500 hover:border-[#5a63df]/30 hover:text-slate-800 dark:border-white/[0.07] dark:bg-white/3 dark:text-slate-400 dark:hover:text-slate-100'
                )}
              >
                {selected ? (
                  <Check className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: voice.color || '#5a63df' }}
                    aria-hidden="true"
                  />
                )}
                {voice.name}
              </button>
            );
          })}
        </div>
        <p className={cn(MUTED, 'mt-1 text-center text-[10px] leading-tight')}>
          Tap the centre orb to preview {selectedVoice.name}. Your choice stays with this exam.
        </p>
      </div>
    </section>
  );
}
