import React from 'react';
import { GraduationCap, Loader2, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

const MODES = [
  { id: 'practice', label: 'Practice', icon: Sparkles },
  { id: 'exam', label: 'Exam', icon: GraduationCap },
];

export default function TestModeHeaderControl({
  selectedMode,
  onModeChange,
  examEligibility,
  onStart,
  isStarting = false,
}) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div
        className="relative flex items-center rounded-full border border-slate-200/90 bg-slate-100/90 p-0.5 dark:border-white/10 dark:bg-slate-800/80 shadow-xs backdrop-blur-md"
        role="radiogroup"
        aria-label="Test mode"
      >
        {MODES.map(({ id, label, icon: Icon }) => {
          const selected = selectedMode === id;
          const disabled = id === 'exam' && !examEligibility.eligible;
          const unavailableReason = disabled ? examEligibility.reason : undefined;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={unavailableReason ? `${label}: ${unavailableReason}` : label}
              title={unavailableReason}
              disabled={disabled || isStarting}
              onClick={() => onModeChange(id)}
              className={cn(
                'relative z-10 flex h-7 items-center gap-1.5 rounded-full px-2.5 sm:px-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer select-none',
                selected
                  ? 'text-[#3b44b8] dark:text-white'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white',
                disabled && 'cursor-not-allowed opacity-40'
              )}
            >
              {selected && (
                <motion.div
                  layoutId="testModeControlPill"
                  className="absolute inset-0 bg-white dark:bg-[#5661e9] rounded-full shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={cn(
                  'h-3.5 w-3.5 stroke-[2.5]',
                  selected ? 'text-[#3b44b8] dark:text-white' : 'text-slate-700 dark:text-slate-300'
                )}
              />
              <span className={cn(id === 'practice' && 'hidden sm:inline')}>{label}</span>
            </button>
          );
        })}
      </div>

      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
        <Button
          type="button"
          aria-label={isStarting ? 'Starting test' : 'Start Test'}
          onClick={() => onStart(selectedMode)}
          disabled={isStarting}
          className="h-8 rounded-full bg-[#5661e9] hover:bg-[#4852d4] dark:bg-[#5661e9] dark:hover:bg-[#4852d4] px-3.5 sm:px-4 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer"
        >
          {isStarting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current sm:mr-1" />
          )}
          <span className="hidden sm:inline">{isStarting ? 'Starting…' : 'Start Test'}</span>
          <span className="sm:hidden">{isStarting ? '…' : 'Start'}</span>
        </Button>
      </motion.div>
    </div>
  );
}

export function TestStartPreviewNotice({ examEligibility }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-start justify-center bg-white/55 px-4 pt-5 backdrop-blur-[1px] dark:bg-slate-950/55 sm:pt-8">
      <div className="max-w-lg rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 text-center shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900/95">
        <p className="text-sm font-black text-slate-900 dark:text-white">
          Choose a mode in the header, then start when you are ready.
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          The session and timer have not started.
        </p>
        {!examEligibility.eligible ? (
          <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {examEligibility.reason} Practice Mode is selected for this attempt.
          </p>
        ) : null}
      </div>
    </div>
  );
}
