import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import XPNotification from '@/components/XPNotification';
import PremiumLoading from '@/components/ui/PremiumLoading';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';
import { WritingHeader } from '../components/WritingTest/components/WritingHeader';
import { TaskPanel } from '../components/WritingTest/components/TaskPanel';
import { WritingEditor } from '../components/WritingTest/components/WritingEditor';
import { FeedbackPanel } from '../components/WritingTest/components/FeedbackPanel';
import { WritingDialogs } from '../components/WritingTest/components/WritingDialogs';
import { WritingTestProvider } from '../components/WritingTest/context/WritingTestContext';
import { useWritingTaskLogic } from '../components/WritingTest/hooks/useWritingTaskLogic';
import { useWritingTestStore } from '../store/useWritingTestStore';
import AnnotatedText from '@/components/writing/AnnotatedText';
import { analyzeWriting } from '../utils/writingCoaching';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const MemoizedWritingHeader = React.memo(WritingHeader);
const MemoizedTaskPanel = React.memo(TaskPanel);
const MemoizedWritingEditorPane = React.memo(WritingEditorPane);
const MemoizedFeedbackPanel = React.memo(FeedbackPanel);

function WritingErrorScreen({ error }) {
  return (
    <div
      className="min-h-screen bg-[#f7f6fd] dark:bg-[#08080a] flex items-center justify-center p-6"
      data-oid="7.ph7ms"
    >
      <div className={cn(PANEL, 'max-w-md w-full rounded-2xl p-8 text-center space-y-4')}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50" data-oid="8rmw5n1">
          Task Not Available
        </h2>
        <p className={MUTED} data-oid="0n6sb4p">
          {error}
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-[#5661e9] text-white rounded-lg hover:bg-[#4853d6] transition-colors"
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
  onShowInEssay,
  coachSession,
  coachTaskType,
  originalHtml,
  isMobile,
}) {
  if (!hasFeedbackPane || isMobile) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative flex h-full min-h-0 min-w-0 w-full flex-col border-l border-[#e4e2f0] bg-white dark:border-white/[0.07] dark:bg-[#08080a]"
      data-oid="zsyqr7w"
    >
      <div className="min-h-0 flex-1" data-oid="178ww4r">
        <MemoizedFeedbackPanel
          feedback={currentFeedback}
          isAnalyzing={isAnalyzing}
          feedbackError={feedbackError}
          handleGetFeedback={handleGetFeedback}
          loadingMessage={loadingMessage}
          onShowInEssay={onShowInEssay}
          coachSession={coachSession}
          coachTaskType={coachTaskType}
          originalHtml={originalHtml}
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

function WritingMobileTabToggle({ activeTab, onTabChange, wordCount, targetLimit }) {
  const tabs = [
    { id: 'question', label: 'Question', icon: BookOpen },
    {
      id: 'editor',
      label: `Essay (${wordCount}/${targetLimit || 150}w)`,
      icon: PenLine,
    },
  ];

  return (
    <div className="flex items-center justify-center w-full px-2 py-1.5 bg-white dark:bg-[#131315] border-b border-[#e4e2f0] dark:border-white/[0.07] md:hidden z-30 shrink-0">
      <div className="flex items-center w-full max-w-sm rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] p-0.5 dark:border-white/[0.07] dark:bg-white/4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'group relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs font-bold transition-all duration-150',
                isActive
                  ? 'text-[#5a63df] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeWritingMobileTab"
                  className="pointer-events-none absolute inset-0 -z-10 rounded-md bg-white shadow-xs dark:bg-indigo-600"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WritingTaskContent() {
  const { userProfile: authUser } = useAuth();
  const logic = useWritingTaskLogic(authUser);
  const isMobile = useIsMobile();

  const currentFeedback = useWritingTestStore((state) => state.currentFeedback);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const feedbackError = useWritingTestStore((state) => state.feedbackError);
  const activeType = useWritingTestStore((state) => state.activeType) || 'Task 1';
  const wordCount = useWritingTestStore((state) => state.wordCount);
  const targetLimit = activeType === 'Task 2' ? 250 : 150;

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

  const [showTask] = useWritingInitialTaskPanelState(hasFeedbackPane);
  const [mobileTab, setMobileTab] = useState('question');
  const [viewMode, setViewMode] = useState(() => (isMobile ? 'feedback' : 'review'));
  const [focusAnnotation, setFocusAnnotation] = useState(null);
  const showTaskPanel = showTask && !hasFeedbackPane;

  const handleShowInEssay = useCallback((annotation) => {
    setViewMode('review');
    setFocusAnnotation({ ...annotation, requestId: Date.now() });
  }, []);

  useEffect(() => {
    if (hasFeedbackPane && isMobile) {
      setViewMode('feedback');
    } else if (hasFeedbackPane && !isMobile) {
      setViewMode('review');
    }
  }, [hasFeedbackPane, isMobile]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (error) {
    return <WritingErrorScreen error={error} />;
  }

  if (isLoading || !task) {
    return <PremiumLoading message="Loading writing task..." />;
  }

  return (
    <div
      className="flex min-h-0 h-full w-full flex-col overflow-hidden bg-[#f7f6fd] relative dark:bg-[#08080a]"
      data-oid="ypz5..c"
    >
      <MemoizedWritingHeader
        task={task}
        handleGetFeedback={handleGetFeedback}
        handleSwitchTask={handleSwitchTask}
        testMode={testMode}
        onSubmit={() => setShowSubmitDialog(true)}
        isAwaitingStart={isAwaitingStart}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        examEligibility={examEligibility}
        onStart={handleStartTest}
        isStarting={isStarting}
        data-oid=".3a0f71"
      />

      {/* Mobile Mode Switcher when testing/practicing */}
      {!hasFeedbackPane && (
        <WritingMobileTabToggle
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          wordCount={wordCount}
          targetLimit={targetLimit}
        />
      )}

      <div
        className={cn(
          'relative mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col overflow-hidden transition-all duration-300',
          hasFeedbackPane ? 'md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'md:flex-row',
          isAwaitingStart && 'pointer-events-none select-none blur-[3px] opacity-75'
        )}
        aria-disabled={isAwaitingStart || undefined}
        inert={isAwaitingStart ? '' : undefined}
        data-oid="50emge."
      >
        {/* On Mobile during test: show TaskPanel if mobileTab === 'question' */}
        {/* On Desktop during test: show TaskPanel if showTaskPanel */}
        {((isMobile && !hasFeedbackPane && mobileTab === 'question') ||
          (!isMobile && showTaskPanel)) && (
          <MemoizedTaskPanel
            task={task}
            showSample={showSample}
            setShowSample={setShowSample}
            allowSample={testMode !== 'exam' || isCompleted}
            onSwitchToEditor={isMobile ? () => setMobileTab('editor') : undefined}
            data-oid="oxbs3rj"
          />
        )}

        {/* On Mobile during test: show Editor if mobileTab === 'editor' */}
        {/* In feedback mode or desktop: render EditorPane */}
        {((isMobile && !hasFeedbackPane && mobileTab === 'editor') ||
          (isMobile && hasFeedbackPane) ||
          !isMobile) && (
          <MemoizedWritingEditorPane
            task={task}
            testMode={testMode}
            hasFeedback={hasFeedbackPane}
            viewMode={viewMode}
            setViewMode={setViewMode}
            focusAnnotation={focusAnnotation}
            showSample={showSample}
            setShowSample={setShowSample}
            isMobile={isMobile}
            handleShowInEssay={handleShowInEssay}
            handleGetFeedback={handleGetFeedback}
            loadingMessage={loadingMessage}
            coachSession={testMode !== 'exam' ? logic.session : null}
            coachTaskType={activeType}
            data-oid="xaa39j6"
          />
        )}

        <AnimatePresence initial={false} data-oid="i3plaxk">
          <WritingFeedbackDrawer
            hasFeedbackPane={hasFeedbackPane}
            currentFeedback={currentFeedback}
            isAnalyzing={isAnalyzing}
            feedbackError={feedbackError}
            handleGetFeedback={handleGetFeedback}
            loadingMessage={loadingMessage}
            onShowInEssay={handleShowInEssay}
            coachSession={testMode !== 'exam' ? logic.session : null}
            coachTaskType={activeType}
            originalHtml={
              currentFeedback?.originalSource ||
              useWritingTestStore.getState().drafts[activeType] ||
              ''
            }
            isMobile={isMobile}
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

function WritingViewModeToggle({ viewMode, setViewMode, isMobile }) {
  const tabs = isMobile
    ? [
        { id: 'feedback', label: 'Report' },
        { id: 'review', label: 'Annotation' },
        { id: 'question', label: 'Question' },
        { id: 'edit', label: 'Draft' },
      ]
    : [
        { id: 'review', label: 'Annotation' },
        { id: 'question', label: 'Question' },
        { id: 'edit', label: 'Editor' },
      ];

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-[#131315] border-b border-[#e4e2f0] dark:border-white/[0.07] px-2 py-1.5 sm:px-4">
      <div className="flex items-center justify-center w-full">
        <div className="flex items-center rounded-lg sm:rounded-full border border-[#e4e2f0] bg-[#f4f3fb] p-0.5 sm:p-1 shadow-xs dark:border-white/[0.07] dark:bg-white/4 w-full sm:w-auto max-w-md sm:max-w-none">
          {tabs.map((tab) => {
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id)}
                className={cn(
                  'group relative z-10 flex flex-1 items-center justify-center rounded-md sm:rounded-full px-2 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-bold text-center transition-colors duration-200 sm:flex-none',
                  isActive
                    ? 'text-[#5a63df] dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeWritingTab"
                    className="pointer-events-none absolute inset-0 -z-10 rounded-md sm:rounded-full border border-[#d2d7f8] bg-white shadow-xs dark:border-indigo-500/30 dark:bg-indigo-600"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnnotatedReviewPane({ feedback, writing, setWriting, focusAnnotation }) {
  const analysis = React.useMemo(
    () => analyzeWriting(feedback.originalSource || writing, feedback.taskPrompt),
    [feedback.originalSource, feedback.taskPrompt, writing]
  );
  const applyCorrection = useCallback(
    (annotation) => {
      const source = feedback.originalSource || writing;
      setWriting(source.replace(annotation.originalText, annotation.suggestion));
    },
    [feedback, writing, setWriting]
  );

  return (
    <div className="px-1 pb-6 sm:px-2" data-oid="j1tntdm">
      <AnnotatedText
        text={feedback.originalSource || writing}
        annotations={feedback.annotations || []}
        vocabularyEnhancements={feedback.vocabularyEnhancements || []}
        writingAnalysis={analysis}
        onApplyCorrection={applyCorrection}
        focusAnnotation={focusAnnotation}
        cardClassName="min-h-[500px]"
        data-oid="wg_1:8b"
      />
    </div>
  );
}

function QuestionViewPane({ task, showSample, setShowSample }) {
  return (
    <div className="flex-1" data-oid="2zns8ok">
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
  feedbackError,
  writing,
  setWriting,
  task,
  showSample,
  setShowSample,
  activeType,
  wordCount,
  isCompleted,
  isAnalyzing,
  testMode,
  focusAnnotation,
  isMobile,
  handleShowInEssay,
  handleGetFeedback,
  loadingMessage,
  coachSession,
  coachTaskType,
}) {
  const isFeedbackMode = isMobile && hasFeedback && viewMode === 'feedback';
  const isReviewMode = hasFeedback && viewMode === 'review' && Boolean(currentFeedback);
  const isQuestionMode = hasFeedback && viewMode === 'question';
  const contentKey = isFeedbackMode
    ? 'feedback'
    : isReviewMode
      ? 'review'
      : isQuestionMode
        ? 'question'
        : 'editor';

  let content;
  if (isFeedbackMode) {
    content = (
      <div className="flex-1 overflow-y-auto">
        <MemoizedFeedbackPanel
          feedback={currentFeedback}
          isAnalyzing={isAnalyzing}
          feedbackError={feedbackError}
          handleGetFeedback={handleGetFeedback}
          loadingMessage={loadingMessage}
          onShowInEssay={handleShowInEssay}
          coachSession={coachSession}
          coachTaskType={coachTaskType}
          originalHtml={currentFeedback?.originalSource || writing}
          onClose={() => {}}
        />
      </div>
    );
  } else if (isReviewMode) {
    content = (
      <AnnotatedReviewPane
        feedback={currentFeedback}
        writing={writing}
        setWriting={setWriting}
        focusAnnotation={focusAnnotation}
      />
    );
  } else if (isQuestionMode) {
    content = (
      <QuestionViewPane task={task} showSample={showSample} setShowSample={setShowSample} />
    );
  } else {
    content = (
      <WritingEditor
        key={activeType}
        writing={writing}
        setWriting={setWriting}
        wordCount={wordCount}
        targetLimit={activeType === 'Task 2' ? 250 : 150}
        isCompleted={isCompleted}
        testMode={testMode}
        isAnalyzing={isAnalyzing}
        currentFeedback={currentFeedback}
        title={`${activeType} Response`}
        subtitle={`Draft your ${activeType.toLowerCase()} essay`}
        data-oid="p08gpnf"
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-1 pt-1.5 pb-4 sm:px-2 sm:pt-2.5 sm:pb-6">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={contentKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function WritingEditorPane({
  task,
  testMode,
  hasFeedback,
  viewMode,
  setViewMode,
  focusAnnotation,
  showSample,
  setShowSample,
  isMobile,
  handleShowInEssay,
  handleGetFeedback,
  loadingMessage,
  coachSession,
  coachTaskType,
}) {
  const activeType = useWritingTestStore((state) => state.activeType);
  const writing = useWritingTestStore((state) => state.drafts[activeType] || '');
  const wordCount = useWritingTestStore((state) => state.wordCount);
  const isCompleted = useWritingTestStore((state) => state.isCompleted);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const currentFeedback = useWritingTestStore((state) => state.currentFeedback);
  const feedbackError = useWritingTestStore((state) => state.feedbackError);
  const setDraft = useWritingTestStore((state) => state.setDraft);

  const setWriting = useCallback(
    (content) => setDraft(activeType, content),
    [activeType, setDraft]
  );

  return (
    <div
      className={cn(
        'relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#fcfcfc] dark:bg-[#08080a]',
        hasFeedback
          ? 'w-full h-full md:min-w-0 md:border-r border-[#e4e2f0] dark:border-white/[0.07]'
          : 'w-full md:w-1/2 md:basis-1/2 md:flex-1 h-full'
      )}
      data-oid="ctlrd56"
    >
      {hasFeedback && (
        <WritingViewModeToggle viewMode={viewMode} setViewMode={setViewMode} isMobile={isMobile} />
      )}
      <div
        className="flex flex-1 min-h-0 flex-col overflow-y-auto"
        style={{ scrollbarGutter: 'stable' }}
      >
        <WritingPaneBody
          hasFeedback={hasFeedback}
          viewMode={viewMode}
          currentFeedback={currentFeedback}
          feedbackError={feedbackError}
          writing={writing}
          setWriting={setWriting}
          task={task}
          showSample={showSample}
          setShowSample={setShowSample}
          activeType={activeType}
          wordCount={wordCount}
          isCompleted={isCompleted}
          isAnalyzing={isAnalyzing}
          testMode={testMode}
          focusAnnotation={focusAnnotation}
          isMobile={isMobile}
          handleShowInEssay={handleShowInEssay}
          handleGetFeedback={handleGetFeedback}
          loadingMessage={loadingMessage}
          coachSession={coachSession}
          coachTaskType={coachTaskType}
        />
      </div>
    </div>
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
