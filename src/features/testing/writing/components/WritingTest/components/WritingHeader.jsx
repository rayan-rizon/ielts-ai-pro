import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Loader2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import WritingTestClock from './WritingTestClock';
import { Badge } from '@/components/ui/badge';

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
        className="w-full rounded-2xl flex items-center justify-between py-1 px-2.5 sm:py-1.5 sm:px-3.5 border border-slate-200/50 dark:border-white/10 bg-white/80 dark:bg-[#0B0C1A]/95 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-transparent dark:ring-white/5 transition-all duration-300 gap-2"
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
            className="shrink-0 h-7.5 w-7.5 sm:h-8.5 sm:w-8.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center p-0"
            data-oid="hk29.7f"
          >
            <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" data-oid="9sfx_0v" />
          </Button>

          <div className="flex flex-col min-w-0" data-oid="m4bipk0">
            <h1
              className="text-[12px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px] lg:max-w-[300px]"
              title={task?.title || 'Writing Task'}
              data-oid="in06s0r"
            >
              {task?.title || 'Writing Task'}
            </h1>
            <div
              className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium"
              data-oid="qtfjfp2"
            >
              <span className="opacity-80 dark:opacity-70 truncate" data-oid="y3ia:a_">
                {activeType || 'Writing'}
              </span>
              {task?.is_official_cambridge && (
                <span
                  className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                  data-oid="h9rc23x"
                >
                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" data-oid="s_:7hbv" />
                  <span className="hidden xs:inline">Official</span>
                </span>
              )}
              <Badge
                variant="outline"
                className="h-4 rounded-full px-1.5 text-[8px] font-black uppercase tracking-wide"
              >
                {testMode === 'exam' ? 'Exam Mode' : 'Practice Mode'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Center: Task Switcher (Desktop — md and above) */}
        {compositeTasks && Object.keys(compositeTasks).length > 1 && (
          <div
            className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-full border border-slate-200 dark:border-slate-700"
            data-oid="edt:rn9"
          >
            {Object.keys(compositeTasks).map((type) => (
              <button
                key={type}
                onClick={() => handleSwitchTask(type)}
                className={`relative px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 z-10 ${
                  activeType === type
                    ? 'text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                data-oid="yghl_mz"
              >
                {activeType === type && (
                  <motion.div
                    layoutId="activeTaskTab"
                    className="absolute inset-0 bg-slate-900 dark:bg-indigo-600 rounded-full -z-10"
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
            className="flex md:hidden items-center gap-0.5 bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-full border border-slate-200 dark:border-slate-700 mx-auto"
            data-oid="mobile-task-switcher"
          >
            {Object.keys(compositeTasks).map((type) => (
              <button
                key={type}
                onClick={() => handleSwitchTask(type)}
                className={`relative px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 z-10 ${
                  activeType === type
                    ? 'text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                data-oid="mobile-task-tab"
              >
                {activeType === type && (
                  <motion.div
                    layoutId="activeTaskTabMobile"
                    className="absolute inset-0 bg-slate-900 dark:bg-indigo-600 rounded-full -z-10"
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
          {/* Auto-save Status (Hidden on very small screens) */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
            data-oid="2y1asde"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" data-oid="grs.ci3" />
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
            className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"
            data-oid="15qptnk"
          ></div>

          <WritingTestClock data-oid="rbk722v" />

          <Button
            onClick={() => {
              if (currentFeedback && isCompleted) {
                const element = document.getElementById('feedback-section');
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else if (activeType === 'Task 1' && compositeTasks && compositeTasks['Task 2']) {
                handleSwitchTask('Task 2');
              } else if (testMode === 'exam' && !isCompleted) {
                onSubmit();
              } else {
                handleGetFeedback();
              }
            }}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 sm:gap-2 font-black px-3 sm:px-5 h-8 sm:h-9.5 rounded-lg sm:rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80 disabled:hover:translate-y-0 text-[10px] sm:text-xs uppercase tracking-widest ${
              currentFeedback && isCompleted
                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:shadow-blue-500/50 border-none'
                : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-slate-900/25 dark:shadow-indigo-500/20'
            }`}
            data-oid="ua-kwyv"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" data-oid="m0-obo4" />
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
        </div>
      </div>
    </div>
  );
}
