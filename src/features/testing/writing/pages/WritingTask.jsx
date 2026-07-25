import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
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
import { useNavigate } from 'react-router-dom';
import TestModeStartGate from '@/features/testing/shared/components/TestModeStartGate';

const MemoizedWritingHeader = React.memo(WritingHeader);
const MemoizedTaskPanel = React.memo(TaskPanel);
const MemoizedWritingEditorPane = React.memo(WritingEditorPane);
const MemoizedFeedbackPanel = React.memo(FeedbackPanel);

function WritingErrorScreen({ error }) {
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

function WritingFeedbackDrawer({
  hasFeedbackPane,
  currentFeedback,
  isAnalyzing,
  feedbackError,
  handleGetFeedback,
  loadingMessage,
}) {
  if (!hasFeedbackPane) return null;

  return (
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
  );
}

function useWritingInitialTaskPanelState(hasFeedbackPane) {
  const [showTask, setShowTask] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isViewMode = urlParams.get('view') === 'true' || urlParams.get('view-results') === 'true';
    const existingFeedback = useWritingTestStore.getState().currentFeedback;
    return !isViewMode && !existingFeedback;
  });

  useEffect(() => {
    if (hasFeedbackPane) {
      if (showTask) setShowTask(false);
      return;
    }
    if (!showTask) setShowTask(true);
  }, [hasFeedbackPane, showTask]);

  return [showTask, setShowTask];
}

function WritingTaskContent() {
  const { userProfile: authUser } = useAuth();
  const logic = useWritingTaskLogic(authUser);

  const currentFeedback = useWritingTestStore((state) => state.currentFeedback);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const feedbackError = useWritingTestStore((state) => state.feedbackError);
  const navigate = useNavigate();

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
    showConfetti,
    showXPNotification,
    earnedXP,
    setShowConfetti,
    setShowXPNotification,
    testMode,
    selectedMode,
    setSelectedMode,
    examEligibility,
    isAwaitingStart,
    isStarting,
    handleStartTest,
    isCompleted,
    setShowSubmitDialog,
  } = logic;
  const hasFeedbackPane =
    Boolean(currentFeedback || isAnalyzing || feedbackError) &&
    (testMode !== 'exam' || isCompleted);

  const [showTask, setShowTask] = useWritingInitialTaskPanelState(hasFeedbackPane);
  const showTaskPanel = showTask && !hasFeedbackPane;

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (error) {
    return <WritingErrorScreen error={error} />;
  }

  if (isLoading || !task) {
    return <PremiumLoading message="Loading writing task..." />;
  }

  if (isAwaitingStart) {
    return (
      <TestModeStartGate
        title={task.title || 'Writing Test'}
        skill="Writing"
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        examEligibility={examEligibility}
        onStart={handleStartTest}
        isStarting={isStarting}
        onExit={() => navigate('/writing')}
      />
    );
  }

  return (
    <div
      className="flex min-h-0 h-full w-full flex-col overflow-hidden bg-slate-50 relative dark:bg-[#05060B]"
      data-oid="ypz5..c"
    >
      <MemoizedWritingHeader
        task={task}
        handleGetFeedback={handleGetFeedback}
        handleSwitchTask={handleSwitchTask}
        testMode={testMode}
        onSubmit={() => setShowSubmitDialog(true)}
        data-oid=".3a0f71"
      />

      <div
        className="relative mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col overflow-hidden md:flex-row"
        data-oid="50emge."
      >
        <AnimatePresence mode="wait" initial={false} data-oid=".rp02r7">
          {showTaskPanel && (
            <MemoizedTaskPanel
              task={task}
              showSample={showSample}
              setShowSample={setShowSample}
              allowSample={testMode !== 'exam' || isCompleted}
              data-oid="oxbs3rj"
            />
          )}
        </AnimatePresence>

        <MemoizedWritingEditorPane
          task={task}
          isSidebarClosed={!showTaskPanel}
          onToggleSidebar={() => setShowTask((prev) => !prev)}
          hasFeedback={hasFeedbackPane}
          showSample={showSample}
          setShowSample={setShowSample}
          data-oid="xaa39j6"
        />

        <AnimatePresence initial={false} data-oid="i3plaxk">
          <WritingFeedbackDrawer
            hasFeedbackPane={hasFeedbackPane}
            currentFeedback={currentFeedback}
            isAnalyzing={isAnalyzing}
            feedbackError={feedbackError}
            handleGetFeedback={handleGetFeedback}
            loadingMessage={loadingMessage}
          />
        </AnimatePresence>
      </div>

      <WritingDialogs logic={logic} data-oid=":-fg:99" />

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

function WritingViewModeToggle({ viewMode, setViewMode }) {
  return (
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
                  ? 'text-indigo-600 dark:text-white'
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
  );
}

function AnnotatedReviewPane({ feedback, writing, setWriting }) {
  const applyCorrection = useCallback(
    (annotation) => {
      const source = feedback.originalSource || writing;
      setWriting(source.replace(annotation.originalText, annotation.suggestion));
    },
    [feedback, writing, setWriting]
  );

  return (
    <div className="flex-1 pt-0 px-1 sm:px-2 pb-6" data-oid="j1tntdm">
      <div
        className="bg-white dark:bg-[#0D0E1A] rounded-2xl border border-indigo-100/50 dark:border-white/5 shadow-sm p-3 min-h-[500px]"
        data-oid="w9yqk30"
      >
        <AnnotatedText
          text={feedback.originalSource || writing}
          annotations={feedback.annotations || []}
          vocabularyEnhancements={feedback.vocabularyEnhancements || []}
          onApplyCorrection={applyCorrection}
          data-oid="wg_1:8b"
        />
      </div>
    </div>
  );
}

function QuestionViewPane({ task, showSample, setShowSample }) {
  return (
    <div className="flex-1 overflow-y-auto" data-oid="2zns8ok">
      <MemoizedTaskPanel
        task={task}
        showSample={showSample}
        setShowSample={setShowSample}
        isInset={true}
        data-oid="jx93n_u"
      />
    </div>
  );
}

function WritingPaneBody({
  hasFeedback,
  viewMode,
  currentFeedback,
  writing,
  setWriting,
  task,
  showSample,
  setShowSample,
  activeType,
  wordCount,
  isCompleted,
  isAnalyzing,
  isSidebarClosed,
  onToggleSidebar,
}) {
  const isReviewMode = hasFeedback && viewMode === 'review' && Boolean(currentFeedback);
  const isQuestionMode = hasFeedback && viewMode === 'question';

  if (isReviewMode) {
    return (
      <AnnotatedReviewPane feedback={currentFeedback} writing={writing} setWriting={setWriting} />
    );
  }

  if (isQuestionMode) {
    return <QuestionViewPane task={task} showSample={showSample} setShowSample={setShowSample} />;
  }

  return (
    <WritingEditor
      key={activeType}
      writing={writing}
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

  const [viewMode, setViewMode] = useState('review');

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
        'relative z-30 flex min-h-0 flex-col overflow-hidden bg-[#fcfcfc] dark:bg-[#050505]',
        hasFeedback
          ? 'w-full md:w-1/2 h-full border-r border-slate-200 dark:border-slate-800'
          : isSidebarClosed
            ? 'w-full h-full'
            : 'w-full md:w-1/2 h-1/2 md:h-full'
      )}
      data-oid="ctlrd56"
    >
      {hasFeedback && <WritingViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />}
      <WritingPaneBody
        hasFeedback={hasFeedback}
        viewMode={viewMode}
        currentFeedback={currentFeedback}
        writing={writing}
        setWriting={setWriting}
        task={task}
        showSample={showSample}
        setShowSample={setShowSample}
        activeType={activeType}
        wordCount={wordCount}
        isCompleted={isCompleted}
        isAnalyzing={isAnalyzing}
        isSidebarClosed={isSidebarClosed}
        onToggleSidebar={onToggleSidebar}
      />
    </motion.div>
  );
}

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
