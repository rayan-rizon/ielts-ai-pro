import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import WritingTestClock from './WritingTestClock';
import { Pill } from '@/features/dashboard/components/primitives';

import TestModeHeaderControl from '@/features/testing/shared/components/TestModeHeaderControl';
import {
  TEST_HEADER_BADGE,
  TEST_HEADER_BACK,
  TEST_HEADER_META,
  TEST_HEADER_SHELL,
} from '@/features/testing/shared/components/testHeaderStyles';

/**
 * WritingHeader
 *
 * Floating header containing navigation, task switcher, timer, and primary action buttons.
 */
export function WritingHeader({
  task,
  handleGetFeedback,
  handleSwitchTask,
  testMode = 'practice',
  onSubmit,
  isAwaitingStart = false,
  selectedMode = 'practice',
  onModeChange,
  examEligibility = { eligible: true, reason: '' },
  onStart,
  isStarting = false,
}) {
  const activeType = useWritingTestStore((state) => state.activeType);
  const compositeTasks = useWritingTestStore((state) => state.compositeTasks);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const isCompleted = useWritingTestStore((state) => state.isCompleted);
  const currentFeedback = useWritingTestStore((state) => state.currentFeedback);
  const isSaving = useWritingTestStore((state) => state.isSaving);
  const lastSaved = useWritingTestStore((state) => state.lastSaved);
  const setShowExitDialog = useWritingTestStore((state) => state.setShowExitDialog);

  return (
    <div className="sticky top-0 z-50 w-full px-2 py-0.5 sm:px-3 sm:py-1" data-oid=":8ypqdh">
      <div
        className={cn(
          TEST_HEADER_SHELL,
          'flex items-center justify-between gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5'
        )}
        data-oid="djy-d0b"
      >
        {/* Left: Navigation & Info */}
        <div className="flex items-center gap-1 sm:gap-3 min-w-0" data-oid="yr5-_xk">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Exit writing test"
            onClick={() => {
              const textOnly = (useWritingTestStore.getState().getCurrentDraft() || '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              if (!currentFeedback && textOnly.length > 0) {
                setShowExitDialog(true);
              } else {
                window.history.back();
              }
            }}
            className={TEST_HEADER_BACK}
            data-oid="hk29.7f"
          >
            <ArrowLeft
              className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-0.5 stroke-[2.5]"
              data-oid="9sfx_0v"
            />
          </Button>

          <div
            className="flex flex-col min-w-0 max-w-[160px] min-[380px]:max-w-[210px] min-[480px]:max-w-[280px] sm:max-w-[360px] md:max-w-md lg:max-w-lg"
            data-oid="m4bipk0"
          >
            <h1
              className="text-[12px] sm:text-[14px] md:text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug truncate"
              title={task?.title || 'Writing Task'}
              data-oid="in06s0r"
            >
              {task?.title || 'Writing Task'}
            </h1>
            <div
              className={cn(TEST_HEADER_META, 'mt-0.5 flex-nowrap overflow-hidden')}
              data-oid="qtfjfp2"
            >
              <span
                className="font-semibold text-slate-600 dark:text-slate-300 shrink-0 whitespace-nowrap text-[10px] sm:text-[11px]"
                data-oid="y3ia:a_"
              >
                {activeType || 'Writing'}
              </span>
              <span
                className="h-2.5 w-px bg-slate-300/80 dark:bg-white/15 shrink-0 hidden min-[360px]:inline-block"
                aria-hidden="true"
              />
              {task?.is_official_cambridge && (
                <span
                  className={cn(
                    TEST_HEADER_BADGE,
                    'hidden min-[380px]:inline-flex shrink-0 whitespace-nowrap border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/[0.14] dark:text-amber-300'
                  )}
                  data-oid="h9rc23x"
                >
                  <ShieldCheck
                    className="w-2.5 h-2.5 stroke-[2.25] text-amber-600 dark:text-amber-300 shrink-0"
                    data-oid="s_:7hbv"
                  />
                  <span>Official</span>
                </span>
              )}
              {!isAwaitingStart ? (
                <Pill
                  tone={testMode === 'exam' ? 'accent' : 'neutral'}
                  className={cn(
                    'h-4 rounded-full px-1.5 py-0 text-[8px] font-bold tracking-[0.08em] leading-none select-none whitespace-nowrap shrink-0 hidden min-[440px]:inline-flex',
                    testMode !== 'exam' &&
                      'border-slate-200/90 bg-slate-100/80 text-slate-600 dark:border-white/12 dark:bg-white/6 dark:text-slate-300'
                  )}
                >
                  <span className="hidden lg:inline">
                    {testMode === 'exam' ? 'Exam Mode' : 'Practice Mode'}
                  </span>
                  <span className="lg:hidden">{testMode === 'exam' ? 'Exam' : 'Practice'}</span>
                </Pill>
              ) : null}
            </div>
          </div>
        </div>

        {/* Center: Task Switcher (Desktop — md and above) */}
        {compositeTasks && Object.keys(compositeTasks).length > 1 && (
          <div
            className="hidden items-center gap-0.5 rounded-full border border-[#d8d9f0] bg-[#f1f1fb] p-0.5 dark:border-white/12 dark:bg-white/[0.07] md:flex shrink-0"
            data-oid="edt:rn9"
          >
            {Object.keys(compositeTasks).map((type) => (
              <button
                key={type}
                onClick={() => handleSwitchTask(type)}
                className={`relative z-10 inline-flex h-7 items-center justify-center rounded-full px-2.5 sm:px-3 text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200 lg:h-8 lg:px-3.5 lg:text-sm ${
                  activeType === type
                    ? 'text-white dark:text-[#17182a]'
                    : 'text-[#606a83] hover:bg-white/70 hover:text-[#4f58c8] dark:text-[#aeb7ce] dark:hover:bg-white/8 dark:hover:text-[#e3e5ff]'
                }`}
                data-oid="yghl_mz"
              >
                {activeType === type && (
                  <motion.div
                    layoutId="activeTaskTab"
                    className="absolute inset-0 -z-10 rounded-full bg-[#6366d9] dark:bg-[#8f97ff]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    data-oid="y6gfvnb"
                  />
                )}
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Center: Task Switcher (Mobile — below md) */}
        {compositeTasks && Object.keys(compositeTasks).length > 1 && (
          <div
            className="flex shrink-0 items-center gap-0.5 rounded-full border border-[#d8d9f0] bg-[#f1f1fb] p-0.5 dark:border-white/12 dark:bg-white/[0.07] md:hidden"
            data-oid="mobile-task-switcher"
          >
            {Object.keys(compositeTasks).map((type) => (
              <button
                key={type}
                onClick={() => handleSwitchTask(type)}
                className={`relative z-10 inline-flex h-6.5 items-center justify-center rounded-full px-2 text-[11px] font-semibold transition-all duration-200 min-[400px]:h-7 min-[400px]:px-2.5 min-[400px]:text-xs ${
                  activeType === type
                    ? 'text-white dark:text-[#17182a]'
                    : 'text-[#606a83] hover:bg-white/70 hover:text-[#4f58c8] dark:text-[#aeb7ce] dark:hover:bg-white/8 dark:hover:text-[#e3e5ff]'
                }`}
                data-oid="mobile-task-tab"
              >
                {activeType === type && (
                  <motion.div
                    layoutId="activeTaskTabMobile"
                    className="absolute inset-0 -z-10 rounded-full bg-[#6366d9] dark:bg-[#8f97ff]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    data-oid="mobile-active-bg"
                  />
                )}
                {type === 'Task 1' ? 'T1' : type === 'Task 2' ? 'T2' : type}
              </button>
            ))}
          </div>
        )}

        {/* Right: Timer & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0" data-oid="b:e6vdz">
          {isAwaitingStart ? (
            <TestModeHeaderControl
              selectedMode={selectedMode}
              onModeChange={onModeChange}
              examEligibility={examEligibility}
              onStart={onStart}
              isStarting={isStarting}
              isAwaitingStart={isAwaitingStart}
            />
          ) : (
            <>
              {/* Auto-save Status (Hidden on screens below xl to preserve task switcher space) */}
              <div
                className="hidden xl:flex items-center gap-1.5 rounded-md border border-[#e4e2f0] bg-[#f4f3fb] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] dark:border-white/10 dark:bg-white/5.5"
                data-oid="2y1asde"
              >
                {isSaving ? (
                  <Loader2
                    className="w-3 h-3 text-[#5661e9] dark:text-indigo-300 animate-spin"
                    data-oid="grs.ci3"
                  />
                ) : (
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${lastSaved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                    data-oid="tsk037e"
                  />
                )}
                <span
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"
                  data-oid="koxcd6s"
                >
                  {isSaving ? 'Saving' : lastSaved ? 'Saved' : 'Ready'}
                </span>
              </div>

              <div
                className="h-5 w-px bg-[#e4e2f0] dark:bg-white/[0.07] hidden sm:block"
                data-oid="15qptnk"
              />

              <WritingTestClock data-oid="rbk722v" />

              <Button
                onClick={() => {
                  if (currentFeedback && isCompleted) {
                    const element = document.getElementById('feedback-section');
                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else if (isCompleted) {
                    handleGetFeedback();
                  } else if (
                    activeType === 'Task 1' &&
                    compositeTasks &&
                    compositeTasks['Task 2']
                  ) {
                    handleSwitchTask('Task 2');
                  } else if (testMode === 'exam' && !isCompleted) {
                    onSubmit();
                  } else {
                    handleGetFeedback();
                  }
                }}
                disabled={isAnalyzing}
                aria-label={
                  isAnalyzing
                    ? 'Analyzing response'
                    : currentFeedback && isCompleted
                      ? 'View results'
                      : isCompleted
                        ? 'Analyze response'
                        : activeType === 'Task 1' && compositeTasks && compositeTasks['Task 2']
                          ? 'Proceed to Next Task'
                          : testMode === 'exam' && !isCompleted
                            ? 'Submit test'
                            : currentFeedback
                              ? 'Redo analysis'
                              : 'Get AI feedback'
                }
                className={cn(
                  'flex items-center gap-1 sm:gap-1.5 font-bold px-2.5 sm:px-4 h-7.5 sm:h-8.5 rounded-lg sm:rounded-full bg-[#5a63df] hover:bg-[#4d55c7] text-white border-0 shadow-xs transition-all duration-200 active:scale-[0.98] disabled:opacity-75 disabled:hover:scale-100 text-[10px] sm:text-xs uppercase tracking-wide'
                )}
                data-oid="ua-kwyv"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" data-oid="m0-obo4" />
                    <span className="hidden sm:inline" data-oid="p5ycut7">
                      Analyzing...
                    </span>
                    <span className="sm:hidden" data-oid="p5ycut7-mob">
                      ...
                    </span>
                  </>
                ) : currentFeedback && isCompleted ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" data-oid="49as5pg" />
                    <span className="hidden md:inline" data-oid="xdavx2-">
                      VIEW RESULTS
                    </span>
                    <span className="md:hidden" data-oid="xdavx2-mob">
                      RESULTS
                    </span>
                  </>
                ) : isCompleted ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ANALYZE RESPONSE</span>
                    <span className="sm:hidden">ANALYZE</span>
                  </>
                ) : activeType === 'Task 1' && compositeTasks && compositeTasks['Task 2'] ? (
                  <>
                    <span className="hidden md:inline" data-oid="x._jh2f">
                      NEXT TASK
                    </span>
                    <span className="md:hidden" data-oid="x._jh2f-mob">
                      NEXT
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" data-oid="_w3w20d" />
                  </>
                ) : testMode === 'exam' && !isCompleted ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">SUBMIT TEST</span>
                    <span className="sm:hidden">SUBMIT</span>
                  </>
                ) : (
                  <>
                    {currentFeedback ? (
                      <RefreshCw className="w-3.5 h-3.5" data-oid="gzq5nvq" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" data-oid="_k24264" />
                    )}
                    <span className="hidden lg:inline" data-oid="d-j6l5n">
                      {currentFeedback ? 'REDO ANALYSIS' : 'GET AI FEEDBACK'}
                    </span>
                    <span className="hidden sm:inline lg:hidden" data-oid="d-j6l5n-md">
                      {currentFeedback ? 'Redo' : 'AI Feedback'}
                    </span>
                    <span className="sm:hidden" data-oid="d-j6l5n-sm">
                      {currentFeedback ? 'Redo' : 'AI'}
                    </span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
