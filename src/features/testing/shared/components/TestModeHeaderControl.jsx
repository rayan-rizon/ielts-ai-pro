import React, { useState } from 'react';
import {
  GraduationCap,
  Loader2,
  Play,
  Sparkles,
  HelpCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const MODES = [
  {
    id: 'practice',
    label: 'Practice',
    icon: Sparkles,
    badge: 'Self-Paced',
    shortDesc: 'Untimed practice with instant answers & detailed hints.',
  },
  {
    id: 'exam',
    label: 'Exam',
    icon: GraduationCap,
    badge: 'Official Simulation',
    shortDesc: 'Strict IELTS timed test conditions with score recording.',
  },
];

export default function TestModeHeaderControl({
  selectedMode,
  onModeChange,
  examEligibility,
  onStart,
  isStarting = false,
  isAwaitingStart = true,
}) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const showHeaderGuide = isAwaitingStart;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex items-center gap-1.5 sm:gap-2">
        {/* Mode Selector Radio Group */}
        <div
          className="relative flex items-center rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] p-1 dark:border-white/[0.10] dark:bg-white/[0.055]"
          role="radiogroup"
          aria-label="Test mode"
        >
          {MODES.map(({ id, label, icon: Icon }) => {
            const selected = selectedMode === id;
            const disabled = id === 'exam' && !examEligibility?.eligible;
            const unavailableReason = disabled ? examEligibility?.reason : undefined;

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
                  'relative z-10 flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-bold uppercase tracking-[0.10em] transition-colors cursor-pointer select-none sm:px-3 sm:text-[10px]',
                  selected
                    ? 'text-white dark:text-[#10111a]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100',
                  disabled && 'cursor-not-allowed opacity-40'
                )}
              >
                {selected && (
                  <motion.div
                    layoutId="testModeControlPill"
                    className="absolute inset-0 -z-10 rounded-lg bg-[#5a63df] dark:bg-[#8f97ff]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={cn(
                    'h-3.5 w-3.5 stroke-[2.5]',
                    selected
                      ? 'text-white dark:text-[#10111a]'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                />
                <span className={cn(id === 'practice' && 'hidden sm:inline')}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode Guide Popover Info Button */}
        <Popover open={isGuideOpen} onOpenChange={setIsGuideOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Mode Guide"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:border-white/[0.10] dark:bg-white/[0.055] dark:text-slate-400 dark:hover:bg-white/[0.09] dark:hover:text-slate-100"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="z-50 w-80 rounded-xl border border-[#e4e2f0] bg-white p-4 shadow-xl dark:border-white/[0.12] dark:bg-[#131315]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-600 dark:text-slate-200" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Test Mode Guide
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md cursor-pointer"
                aria-label="Close guide"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] p-2.5 dark:border-white/[0.10] dark:bg-white/[0.055]">
                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-slate-200 mb-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Practice Mode</span>
                </div>
                <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                  <li>Untimed & self-paced learning</li>
                  <li>Check answers instantly with explanations</li>
                  <li>Ideal for skill building without timer stress</li>
                </ul>
              </div>

              <div className="rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] p-2.5 dark:border-white/[0.10] dark:bg-white/[0.055]">
                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-slate-200 mb-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Exam Mode</span>
                </div>
                <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                  <li>Strict IELTS official timed test simulation</li>
                  <li>Single final submission for official score</li>
                  <li>Track performance in your progress stats</li>
                </ul>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 text-[11px] text-center font-medium text-slate-500 dark:text-slate-400">
              Select your mode above and click{' '}
              <span className="font-bold text-indigo-600 dark:text-slate-200">Start Test</span> to
              begin.
            </div>
          </PopoverContent>
        </Popover>

        {/* Start Test Button */}
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

        {/* Persistent & Responsive Header Guidance Callout */}
        <AnimatePresence>
          {showHeaderGuide && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2.5 z-50 w-[calc(100vw-2rem)] max-w-xs sm:w-76 rounded-[22px] border border-[#dce0f2] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f2f0ff] dark:from-[#111214] dark:via-[#191b1f] dark:to-[#111214] p-3.5 text-left shadow-[0_20px_50px_-25px_rgba(15,23,42,0.35)] dark:shadow-black/60 backdrop-blur-xl"
            >
              {/* Arrow dynamically pointing up to active mode toggle pill (Practice vs Exam) */}
              <div
                className={cn(
                  'absolute -top-1.5 h-3 w-3 rotate-45 border-l border-t border-[#dce0f2] bg-white dark:border-white/10 dark:bg-[#111214] transition-all duration-300',
                  selectedMode === 'exam' ? 'left-[92px] sm:left-[112px]' : 'left-7 sm:left-9'
                )}
              />

              <div className="flex items-center gap-2 relative z-10 border-b border-slate-100 dark:border-white/10 pb-2 mb-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-white/10 dark:text-slate-100 text-xs font-bold shrink-0">
                  💡
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Choose Your Test Mode
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Select Practice or Exam before starting
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 relative z-10">
                <div
                  className={cn(
                    'flex items-start gap-1.5 p-1.5 rounded-xl transition-all duration-200',
                    selectedMode === 'practice'
                      ? 'bg-indigo-500/10 dark:bg-white/[0.08] text-indigo-950 dark:text-slate-100 font-medium border border-indigo-500/20 dark:border-white/[0.14] shadow-xs'
                      : 'opacity-70'
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white">Practice:</strong> Untimed
                    practice with instant answer checks & detailed hints.
                  </div>
                </div>

                <div
                  className={cn(
                    'flex items-start gap-1.5 p-1.5 rounded-xl transition-all duration-200',
                    selectedMode === 'exam'
                      ? 'bg-indigo-500/10 dark:bg-white/[0.08] text-indigo-950 dark:text-slate-100 font-medium border border-indigo-500/20 dark:border-white/[0.14] shadow-xs'
                      : 'opacity-70'
                  )}
                >
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-500 dark:text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white">Exam:</strong> Strict IELTS
                    timed test simulation & official score recording.
                  </div>
                </div>
              </div>

              {!examEligibility?.eligible && (
                <div className="mt-2 rounded-lg bg-amber-500/10 p-2 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                  <span>{examEligibility?.reason} (Practice mode enabled)</span>
                </div>
              )}

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] text-center font-medium text-slate-500 dark:text-slate-400">
                Click{' '}
                <span className="font-bold text-indigo-600 dark:text-slate-200">Start Test</span>{' '}
                when you are ready to begin.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

export function TestStartPreviewNotice() {
  return null;
}
