import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ArrowRight, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import WritingTestClock from './WritingTestClock';
import { Badge } from '@/components/ui/badge';
import TestModeHeaderControl from '@/features/testing/shared/components/TestModeHeaderControl';
import {
  TEST_HEADER_AUTOSAVE,
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
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0" data-oid="yr5-_xk">
          <Button
            variant="ghost"
            size="icon"
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
              className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-0.5 stroke-[2.5]"
              data-oid="9sfx_0v"
            />
          </Button>

          <div className="flex flex-col min-w-0" data-oid="m4bipk0">
            <h1
              className="text-[12px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[160px] min-[480px]:max-w-[220px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[550px]"
              title={task?.title || 'Writing Task'}
              data-oid="in06s0r"
            >
              {task?.title || 'Writing Task'}
            </h1>
            <div className={TEST_HEADER_META} data-oid="qtfjfp2">
              <span className="opacity-80 dark:opacity-70 truncate" data-oid="y3ia:a_">
                {activeType || 'Writing'}
              </span>
              {task?.is_official_cambridge && (
                <span
                  className={cn(
                    TEST_HEADER_BADGE,
                    'border-amber-500/25 bg-amber-500/8 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/[0.14] dark:text-amber-300 sm:gap-1 sm:text-[9px]'
                  )}
                  data-oid="h9rc23x"
                >
                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" data-oid="s_:7hbv" />
                  <span className="hidden min-[480px]:inline">Official</span>
                </span>
              )}
              {!isAwaitingStart ? (
                <Badge
                  variant="outline"
                  className="h-4 shrink-0 whitespace-nowrap rounded-md border-[#e4e2f0] bg-[#f4f3fb] px-1.5 py-0 text-[8px] font-bold uppercase leading-none tracking-[0.08em] text-slate-600 dark:border-white/10 dark:bg-white/5.5 dark:text-slate-300"
                >
                  <span className="hidden min-[420px]:inline">
                    {testMode === 'exam' ? 'Exam Mode' : 'Practice Mode'}
                  </span>
                  <span className="min-[420px]:hidden">
                    {testMode === 'exam' ? 'Exam' : 'Practice'}
                  </span>
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* Center: Task Switcher (Desktop — md and above) */}
        {compositeTasks && Object.keys(compositeTasks).length > 1 && (
          <div
            className="hidden items-center gap-0.5 rounded-full border border-[#d8d9f0] bg-[#f1f1fb] p-0.5 dark:border-white/12 dark:bg-white/[0.07] md:flex"
            data-oid="edt:rn9"
          >
            {Object.keys(compositeTasks).map((type) => (
              <button
                key={type}
                onClick={() => handleSwitchTask(type)}
                className={`relative z-10 inline-flex h-8 items-center justify-center rounded-full px-3.5 text-sm font-semibold transition-all duration-200 ${
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
            className="mx-auto flex items-center gap-0.5 rounded-full border border-[#d8d9f0] bg-[#f1f1fb] p-0.5 dark:border-white/12 dark:bg-white/[0.07] md:hidden"
            data-oid="mobile-task-switcher"
          >
            {Object.keys(compositeTasks).map((type) => (
              <button
                key={type}
                onClick={() => handleSwitchTask(type)}
                className={`relative z-10 inline-flex h-8 items-center justify-center rounded-full px-3 text-sm font-semibold transition-all duration-200 sm:px-3.5 ${
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
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0" data-oid="b:e6vdz">
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
              {/* Auto-save Status (Hidden on very small screens) */}
              <div className={cn(TEST_HEADER_AUTOSAVE, 'lg:flex')} data-oid="2y1asde">
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
                className="h-6 w-px bg-[#e4e2f0] dark:bg-white/[0.07] hidden sm:block"
                data-oid="15qptnk"
              ></div>

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
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2 font-black px-4 sm:px-5.5 h-8.5 sm:h-9.5 rounded-full shadow-md shadow-[#6256ef]/25 hover:shadow-lg hover:shadow-[#6256ef]/35 bg-[#6256ef] hover:bg-[#5246e0] text-white border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-80 disabled:hover:scale-100 text-[11px] sm:text-xs uppercase tracking-wider'
                )}
                data-oid="ua-kwyv"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin"
                      data-oid="m0-obo4"
                    />
                    <span className="hidden sm:inline" data-oid="p5ycut7">
                      Analyzing...
                    </span>
                    <span className="sm:hidden" data-oid="p5ycut7-mob">
                      ...
                    </span>
                  </>
                ) : currentFeedback && isCompleted ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" data-oid="49as5pg" />
                    <span className="hidden md:inline" data-oid="xdavx2-">
                      VIEW RESULTS
                    </span>
                    <span className="md:hidden" data-oid="xdavx2-mob">
                      RESULTS
                    </span>
                  </>
                ) : isCompleted ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" data-oid="_w3w20d" />
                  </>
                ) : testMode === 'exam' && !isCompleted ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">SUBMIT TEST</span>
                    <span className="sm:hidden">SUBMIT</span>
                  </>
                ) : (
                  <>
                    {currentFeedback ? (
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" data-oid="gzq5nvq" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" data-oid="_k24264" />
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
