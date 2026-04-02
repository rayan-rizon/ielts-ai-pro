import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import XPNotification from '@/components/XPNotification';
import PremiumLoading from '@/components/ui/PremiumLoading';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { WritingHeader } from '../components/WritingTest/components/WritingHeader';
import { TaskPanel } from '../components/WritingTest/components/TaskPanel';
import { WritingEditor } from '../components/WritingTest/components/WritingEditor';
import { FeedbackPanel } from '../components/WritingTest/components/FeedbackPanel';
import { WritingDialogs } from '../components/WritingTest/components/WritingDialogs';
import { WritingTestProvider } from '../components/WritingTest/context/WritingTestContext';
import { useWritingTaskLogic } from '../components/WritingTest/hooks/useWritingTaskLogic';
import { useWritingTestStore } from '../store/useWritingTestStore';
import AnnotatedText from '@/components/writing/AnnotatedText';
import { useAuth } from '@/features/auth/context/AuthContext';

const MemoizedWritingHeader = React.memo(WritingHeader);
const MemoizedTaskPanel = React.memo(TaskPanel);
const MemoizedWritingEditorPane = React.memo(WritingEditorPane);
const MemoizedFeedbackPanel = React.memo(FeedbackPanel);

function WritingTaskContent() {
  const { userProfile: authUser } = useAuth();
  const logic = useWritingTaskLogic(authUser);

  // Optimized Selectors - only subscribe to layout-critical state

  const currentFeedback = useWritingTestStore((state) => state.currentFeedback);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const feedbackError = useWritingTestStore((state) => state.feedbackError);
  const hasFeedbackPane = Boolean(currentFeedback || isAnalyzing || feedbackError);

  // NOTE: 'writing' selector is removed from top-level to prevent whole-page re-renders on keystrokes.
  // It is now handled locally within components that need it.

  const {
    task,
    isLoading,
    loadingMessage,
    showSample,
    setShowSample,
    error,
    initialize,
    handleGetFeedback,
    handleSwitchTask,

    // Gamification
    showConfetti,
    showXPNotification,
    earnedXP,
    setShowConfetti,
    setShowXPNotification,
  } = logic;

  // Determine initial sidebar state
  const [showTask, setShowTask] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // FIX: sessionId alone should NOT hide the task panel (it's present during resume)
    const isViewMode = urlParams.get('view') === 'true' || urlParams.get('view-results') === 'true';
    const existingFeedback = useWritingTestStore.getState().currentFeedback;
    return !isViewMode && !existingFeedback;
  });
  const showTaskPanel = showTask && !hasFeedbackPane;

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-collapse sidebar when feedback arrives, restore when switching to task without feedback
  useEffect(() => {
    if (hasFeedbackPane) {
      if (showTask) setShowTask(false);
      return;
    }

    // Switching to a task without feedback — restore the task panel
    if (!showTask) setShowTask(true);
  }, [hasFeedbackPane, showTask]);

  if (error) {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6"
        data-oid="7.ph7ms"
      >
        <div className="max-w-md w-full text-center space-y-4" data-oid="8345aif">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100" data-oid="8rmw5n1">
            Task Not Available
          </h2>
          <p className="text-slate-600 dark:text-slate-400" data-oid="0n6sb4p">
            {error}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            data-oid="jkb2hob"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !task) {
    return <PremiumLoading message="Loading writing task..." />;
  }

  return (
    <div
      className="flex flex-col h-full w-full bg-slate-50 dark:bg-[#05060B] relative overflow-hidden"
      data-oid="ypz5..c"
    >
      <MemoizedWritingHeader
        task={task}
        handleGetFeedback={handleGetFeedback}
        handleSwitchTask={handleSwitchTask}
        data-oid=".3a0f71"
      />

      <div
        className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1920px] mx-auto w-full relative"
        data-oid="50emge."
      >
        <AnimatePresence mode="wait" initial={false} data-oid=".rp02r7">
          {showTaskPanel && (
            <MemoizedTaskPanel
              task={task}
              showSample={showSample}
              setShowSample={setShowSample}
              data-oid="oxbs3rj"
            />
          )}
        </AnimatePresence>

        <MemoizedWritingEditorPane
          task={task}
          isSidebarClosed={!showTaskPanel}
          onToggleSidebar={() => setShowTask((prev) => !prev)}
          hasFeedback={!!currentFeedback}
          showSample={showSample}
          setShowSample={setShowSample}
          data-oid="xaa39j6"
        />

        {/* Feedback Panel - Coordinated layout transition */}
        <AnimatePresence initial={false} data-oid="i3plaxk">
          {(currentFeedback || isAnalyzing || feedbackError) && (
            <motion.div
              layout="position"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="absolute lg:relative right-0 top-0 bottom-0 w-full lg:w-1/2 bg-white dark:bg-black border-l border-slate-200 dark:border-slate-800 shadow-2xl z-20 flex flex-col h-full"
              data-oid="zsyqr7w"
            >
              <div
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
                data-oid="178ww4r"
              >
                <MemoizedFeedbackPanel
                  feedback={currentFeedback}
                  isAnalyzing={isAnalyzing}
                  feedbackError={feedbackError}
                  handleGetFeedback={handleGetFeedback}
                  loadingMessage={loadingMessage}
                  onClose={() => {}}
                  data-oid="zp34i4j"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <WritingDialogs logic={logic} data-oid=":-fg:99" />

      {/* Gamification Elements */}
      <ConfettiCelebration
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
        data-oid="lav_l9b"
      />

      <XPNotification
        show={showXPNotification}
        xp={earnedXP.xp}
        bonus={earnedXP.bonus}
        streak={earnedXP.streak}
        onComplete={() => setShowXPNotification(false)}
        data-oid="3w2va_q"
      />
    </div>
  );
}

function WritingEditorPane({
  task,
  isSidebarClosed,
  onToggleSidebar,
  hasFeedback,
  showSample,
  setShowSample,
}) {
  const activeType = useWritingTestStore((state) => state.activeType);
  const writing = useWritingTestStore((state) => state.drafts[activeType] || '');
  const wordCount = useWritingTestStore((state) => state.wordCount);
  const isCompleted = useWritingTestStore((state) => state.isCompleted);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const currentFeedback = useWritingTestStore((state) => state.currentFeedback);
  const setDraft = useWritingTestStore((state) => state.setDraft);

  // Local state to toggle between Edit and Review modes when feedback is present
  const [viewMode, setViewMode] = useState('review'); // 'edit' or 'review'

  // Effect: When feedback arrives, switch to review mode
  useEffect(() => {
    if (hasFeedback) setViewMode('review');
  }, [hasFeedback]);

  const setWriting = useCallback(
    (content) => setDraft(activeType, content),
    [activeType, setDraft]
  );

  return (
    <motion.div
      layout
      initial={false}
      transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
      className={cn(
        'flex flex-col bg-[#fcfcfc] dark:bg-[#050505] relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 z-30',
        hasFeedback
          ? 'w-full lg:w-1/2 h-full border-r border-slate-200 dark:border-slate-800'
          : isSidebarClosed
            ? 'w-full h-full'
            : 'w-full lg:w-1/2 h-1/2 lg:h-full'
      )}
      data-oid="ctlrd56"
    >
      {/* View Toggle Logic (Only when feedback exists) */}
      {hasFeedback && (
        <div
          className="sticky top-0 z-40 bg-white/80 dark:bg-[#05060B]/90 backdrop-blur-xl border-b border-slate-200/40 dark:border-white/5 px-4 py-2"
          data-oid="dowvur:"
        >
          <div className="flex items-center justify-center w-full" data-oid="3v:texu">
            <div
              className="flex p-1 bg-slate-100/80 dark:bg-[#0D0E1A] rounded-full border border-slate-200/50 dark:border-white/10 shadow-inner"
              data-oid=":s9x3zg"
            >
              {['review', 'question', 'edit'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'relative px-5 py-1.5 text-xs md:text-sm font-bold rounded-full transition-all duration-300 flex-1 sm:flex-none text-center z-10',
                    viewMode === mode
                      ? 'text-indigo-600 dark:text-white' // High contrast text in dark mode
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                  data-oid="9pob-6k"
                >
                  {viewMode === mode && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white dark:bg-indigo-600 rounded-full shadow-lg dark:shadow-indigo-500/30 border border-slate-200/50 dark:border-white/10 pointer-events-none -z-10"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                      data-oid="uy8a.j4"
                    />
                  )}
                  <span className="relative" data-oid="od:phi1">
                    {mode === 'review'
                      ? 'Annotated Review'
                      : mode === 'question'
                        ? 'Question'
                        : 'Editor'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {hasFeedback && viewMode === 'review' && currentFeedback ? (
        <div className="flex-1 pt-0 px-1 sm:px-2 pb-6" data-oid="j1tntdm">
          <div
            className="bg-white dark:bg-[#0D0E1A] rounded-2xl border border-indigo-100/50 dark:border-white/5 shadow-sm p-3 min-h-[500px]"
            data-oid="w9yqk30"
          >
            <AnnotatedText
              text={currentFeedback.originalSource || writing}
              annotations={currentFeedback.annotations || []}
              vocabularyEnhancements={currentFeedback.vocabularyEnhancements || []}
              onApplyCorrection={(annotation) => {
                const newText = (currentFeedback.originalSource || writing).replace(
                  annotation.originalText,
                  annotation.suggestion
                );
                setWriting(newText);
              }}
              data-oid="wg_1:8b"
            />
          </div>
        </div>
      ) : hasFeedback && viewMode === 'question' ? (
        <div className="flex-1 overflow-y-auto" data-oid="2zns8ok">
          <MemoizedTaskPanel
            task={task}
            showSample={showSample}
            setShowSample={setShowSample}
            isInset={true}
            data-oid="jx93n_u"
          />
        </div>
      ) : (
        <WritingEditor
          key={activeType}
          writing={writing} // The debounced store value
          setWriting={setWriting}
          wordCount={wordCount}
          targetLimit={activeType === 'Task 2' ? 250 : 150}
          isCompleted={isCompleted}
          isAnalyzing={isAnalyzing}
          currentFeedback={currentFeedback}
          isSidebarClosed={isSidebarClosed}
          onToggleSidebar={onToggleSidebar}
          title={`${activeType} Response`}
          subtitle={`Draft your ${activeType.toLowerCase()} essay`}
          data-oid="p08gpnf"
        />
      )}
    </motion.div>
  );
}

/**
 * WritingTask
 *
 * Entry point wrapped in WritingTestProvider to ensure store access.
 */
export default function WritingTask() {
  return (
    <React.Suspense
      fallback={<PremiumLoading message="Initializing writing module..." />}
      data-oid="1pb7_3n"
    >
      <ErrorBoundary
        title="Writing Task Error"
        fallbackMessage="Something went wrong while loading the writing task. Your progress has been auto-saved. Please try refreshing the page."
        data-oid="5c65acz"
      >
        <WritingTestProvider data-oid="pwit..v">
          <WritingTaskContent data-oid="y6l-6so" />
        </WritingTestProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
}
